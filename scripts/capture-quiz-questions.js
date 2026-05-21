// Focused quiz question capture — uses waitForSelector (fast) instead of networkidle.
// Registers a fresh account, then walks all quiz questions and prints each Q + answers.
// Run: node scripts/capture-quiz-questions.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'dom-snapshots', 'quiz');
fs.mkdirSync(OUT, { recursive: true });

async function clickActiveStepContinue(page) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const count = await page.locator('button.btn-primary').count();
    for (let i = 0; i < count; i++) {
      const btn = page.locator('button.btn-primary').nth(i);
      const vis = await btn.isVisible().catch(() => false);
      const dis = await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
      if (vis && !dis) {
        await btn.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);
        return;
      }
    }
    await page.waitForTimeout(200);
  }
  throw new Error('No enabled btn-primary found');
}

async function register(page) {
  const email = `aliQA.qcap.${Date.now()}@example.com`;
  console.log(`\n=== REGISTERING: ${email} ===`);

  await page.goto('https://dev.app.bluechew.com/dev-login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector("input[formcontrolname='password']");
  await page.fill("input[formcontrolname='password']", 'dev');
  await page.locator("//button[normalize-space()='Submit']").click();
  await page.waitForLoadState('networkidle');

  await page.goto('https://dev.app.bluechew.com/register', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector("select[formcontrolname='state']");
  await page.selectOption("select[formcontrolname='state']", { label: 'Illinois' });
  await page.locator('#agree_terms').check();
  await page.waitForTimeout(400);
  await clickActiveStepContinue(page);

  await page.waitForFunction(() => {
    const i = document.querySelector("input[formcontrolname='email']");
    return i && window.getComputedStyle(i).display !== 'none' && i.getBoundingClientRect().width > 0;
  }, { timeout: 10000 });
  await page.fill("input[formcontrolname='email']", email);
  await page.locator("input[formcontrolname='email']").press('Tab');
  await page.waitForTimeout(400);
  await clickActiveStepContinue(page);

  await page.waitForFunction(() => {
    const i = document.querySelector("input[formcontrolname='pass']");
    return i && window.getComputedStyle(i).display !== 'none' && i.getBoundingClientRect().width > 0;
  }, { timeout: 10000 });
  await page.fill("input[formcontrolname='pass']", 'certa@123');
  await page.locator("input[formcontrolname='pass']").press('Tab');
  await page.waitForTimeout(400);
  await clickActiveStepContinue(page);

  await page.waitForURL(/dev\.bluechew\.com\/quiz/, { timeout: 30000 });
  console.log(`  ✓ Landed on quiz: ${page.url()}`);
}

async function captureQuizStep(page, stepNum) {
  // Wait for answer buttons to be present — fast, element-based wait
  await page.waitForSelector('[data-test-id="quiz-answer-0"]', { timeout: 20000 });
  await page.waitForTimeout(300); // allow all sibling buttons to render

  const data = await page.evaluate(() => {
    const progressEl = document.querySelector('[data-test-id="quiz-progress-text"]');
    const questionEl = document.querySelector('[data-test-id="quiz-question"]');
    const answerEls  = [...document.querySelectorAll('[data-test-id^="quiz-answer-"]')];

    return {
      url: location.href,
      progress: progressEl?.textContent?.trim() || null,
      question: questionEl?.textContent?.trim().replace(/\s+/g, ' ') || null,
      answers: answerEls.map(el => ({
        dtid: el.getAttribute('data-test-id'),
        text: el.textContent?.trim().replace(/\s+/g, ' ') || '',
      })),
    };
  });

  console.log(`\n=== QUIZ STEP ${stepNum} === ${data.progress || ''}`);
  console.log(`  Q: ${data.question}`);
  data.answers.forEach(a => console.log(`  [${a.dtid}] "${a.text}"`));

  await page.screenshot({ path: path.join(OUT, `step${stepNum}.png`), fullPage: true });
  fs.writeFileSync(
    path.join(OUT, `step${stepNum}.json`),
    JSON.stringify(data, null, 2)
  );

  return data;
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);

  await register(page);

  // The quiz may show an intro/transition page first — wait for it to pass
  // by waiting for the first actual answer button.
  console.log('\n=== WAITING FOR FIRST QUIZ QUESTION ===');

  // Check if there's a "Get Started" button on the transition page
  try {
    await page.waitForSelector('[data-test-id="quiz-answer-0"]', { timeout: 5000 });
    console.log('  Answer buttons already visible — no intro CTA needed');
  } catch {
    console.log('  Answer buttons not yet visible — looking for CTA...');
    // Try clicking a Get Started / Begin / Continue type button
    const ctaTexts = ['get started', 'begin', 'continue', 'start', 'next'];
    let clicked = false;
    for (const text of ctaTexts) {
      const loc = page.locator(`button:has-text("${text}")`).first();
      const vis = await loc.isVisible().catch(() => false);
      if (vis) {
        console.log(`  Clicking CTA: "${text}"`);
        await loc.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      // Try btn-primary as last resort
      const btn = page.locator('button.btn-primary').first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
      }
    }
    await page.waitForSelector('[data-test-id="quiz-answer-0"]', { timeout: 20000 });
  }

  const allSteps = [];

  for (let step = 1; step <= 10; step++) {
    const data = await captureQuizStep(page, step);
    allSteps.push(data);

    // Pick answer index 2 if available (usually "all of the above" / broadest option),
    // otherwise last available answer
    const lastIndex = data.answers.length - 1;
    const pickIndex = Math.min(2, lastIndex);
    const picked = data.answers[pickIndex];
    console.log(`  → clicking: [${picked.dtid}] "${picked.text}"`);

    await page.locator(`[data-test-id="${picked.dtid}"]`).click();

    // Wait to see if a new question loads or if we leave the quiz
    try {
      await page.waitForFunction(
        (prevProgress) => {
          const el = document.querySelector('[data-test-id="quiz-progress-text"]');
          const ans = document.querySelector('[data-test-id="quiz-answer-0"]');
          // New question: progress changed OR answer buttons gone (end of quiz)
          return !ans || (el && el.textContent?.trim() !== prevProgress);
        },
        data.progress,
        { timeout: 15000 }
      );
    } catch {
      console.log('  Quiz appears to have ended or navigated away');
    }

    await page.waitForTimeout(500);
    const currentURL = page.url();
    console.log(`  URL after answer: ${currentURL}`);

    // If we left the quiz, we're done
    if (!currentURL.includes('/quiz')) {
      console.log(`\n✅ Quiz complete — landed at: ${currentURL}`);
      await page.screenshot({ path: path.join(OUT, 'quiz-done.png'), fullPage: true });
      break;
    }

    // If no answer buttons visible, quiz is done
    const hasAnswers = await page.locator('[data-test-id="quiz-answer-0"]').isVisible().catch(() => false);
    if (!hasAnswers) {
      console.log('\n  No more answer buttons — quiz complete');
      await page.waitForTimeout(2000);
      console.log(`  Final URL: ${page.url()}`);
      await page.screenshot({ path: path.join(OUT, 'quiz-done.png'), fullPage: true });
      break;
    }
  }

  // Save summary
  fs.writeFileSync(
    path.join(OUT, 'quiz-summary.json'),
    JSON.stringify(allSteps, null, 2)
  );
  console.log(`\n✅ Saved ${allSteps.length} quiz steps to dom-snapshots/quiz/`);

  await browser.close();
})();
