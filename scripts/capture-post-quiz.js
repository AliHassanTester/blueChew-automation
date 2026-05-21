// Captures the page that loads after the quiz completes.
// Run: node scripts/capture-post-quiz.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'dom-snapshots', 'post-quiz');
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
  const email = `aliQA.pqcap.${Date.now()}@example.com`;
  console.log(`Registering: ${email}`);
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
  await page.waitForFunction(() => { const i = document.querySelector("input[formcontrolname='email']"); return i && window.getComputedStyle(i).display !== 'none' && i.getBoundingClientRect().width > 0; }, { timeout: 10000 });
  await page.fill("input[formcontrolname='email']", email);
  await page.locator("input[formcontrolname='email']").press('Tab');
  await page.waitForTimeout(400);
  await clickActiveStepContinue(page);
  await page.waitForFunction(() => { const i = document.querySelector("input[formcontrolname='pass']"); return i && window.getComputedStyle(i).display !== 'none' && i.getBoundingClientRect().width > 0; }, { timeout: 10000 });
  await page.fill("input[formcontrolname='pass']", 'certa@123');
  await page.locator("input[formcontrolname='pass']").press('Tab');
  await page.waitForTimeout(400);
  await clickActiveStepContinue(page);
  await page.waitForURL(/dev\.bluechew\.com\/quiz/, { timeout: 30000 });
}

async function completeQuiz(page) {
  // Dismiss intro CTA if present
  const hasAnswers = await page.waitForSelector('[data-test-id="quiz-answer-0"]', { timeout: 5000 }).then(() => true).catch(() => false);
  if (!hasAnswers) {
    for (const text of ['Get Started', 'Begin', 'Continue', 'Start', 'Next']) {
      const btn = page.locator(`button:has-text("${text}")`).first();
      if (await btn.isVisible().catch(() => false)) { await btn.click(); break; }
    }
    await page.waitForSelector('[data-test-id="quiz-answer-0"]', { timeout: 20000 });
  }
  // Answers: Q1=2 "All of the above", Q2=0 "Yes", Q3=1 "No, just standard"
  const answers = [2, 0, 1];
  for (let i = 0; i < answers.length; i++) {
    const progress = await page.locator('[data-test-id="quiz-progress-text"]').textContent().catch(() => `${i+1}`);
    console.log(`  Q${i+1} (${progress?.trim()}): clicking quiz-answer-${answers[i]}`);
    await page.locator(`[data-test-id="quiz-answer-${answers[i]}"]`).click();
    if (i < answers.length - 1) {
      await page.waitForFunction(
        (prev) => { const el = document.querySelector('[data-test-id="quiz-progress-text"]'); return el !== null && el.textContent?.trim() !== prev; },
        progress?.trim(), { timeout: 10000 }
      );
    }
  }
  console.log('  Quiz answered — waiting for post-quiz page...');
}

async function captureDOM(page, label) {
  await page.screenshot({ path: path.join(OUT, `${label}.png`), fullPage: true });
  const data = await page.evaluate(() => {
    const allEls = [...document.querySelectorAll('*')].flatMap(el => {
      const rect = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      if (rect.width < 5 || rect.height < 5 || s.display === 'none' || s.visibility === 'hidden') return [];
      const tag = el.tagName.toLowerCase();
      const interestingTags = ['input','select','textarea','button','a','label','h1','h2','h3','h4','p','li','div','span'];
      if (!interestingTags.includes(tag)) return [];
      const text = el.textContent?.trim().replace(/\s+/g,' ').slice(0,120) || '';
      if (!text && !['input','select','textarea'].includes(tag)) return [];
      const dtid = el.getAttribute('data-test-id');
      const cls = el.className?.toString().replace(/\s+/g,' ').slice(0,80) || null;
      return [{ tag, id: el.id||null, dtid, cls, text, html: el.outerHTML.slice(0,400) }];
    });
    return { url: location.href, bodyText: document.body?.innerText?.replace(/\s+/g,' ').slice(0,2000)||'', elements: allEls };
  });
  fs.writeFileSync(path.join(OUT, `${label}.json`), JSON.stringify(data, null, 2));
  console.log(`\n=== ${label} ===`);
  console.log(`  URL: ${data.url}`);
  console.log(`  Body (first 400): "${data.bodyText.slice(0,400)}"`);
  const dtids = data.elements.filter(e => e.dtid).map(e => `[${e.dtid}] ${e.text.slice(0,60)}`);
  if (dtids.length) { console.log(`  data-test-id elements (${dtids.length}):`); dtids.forEach(d => console.log(`    ${d}`)); }
  const btns = data.elements.filter(e => e.tag === 'button' && e.text);
  if (btns.length) { console.log(`  buttons (${btns.length}):`); btns.slice(0,15).forEach(b => console.log(`    cls="${b.cls?.slice(0,50)}" text="${b.text.slice(0,60)}"`)); }
  return data;
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);

  await register(page);
  await completeQuiz(page);

  // Capture immediately after last quiz answer (the "Generating..." screen)
  await page.waitForTimeout(800);
  await captureDOM(page, '01-generating');

  // Wait for the recommendations/plan page to load — poll for URL change or new content
  console.log('\n  Waiting for post-quiz navigation...');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    const url = page.url();
    const body = await page.evaluate(() => document.body?.innerText?.replace(/\s+/g,' ').slice(0,300) || '');
    console.log(`  [${i+1}s] ${url} | body: "${body.slice(0,80)}"`);
    if (!url.includes('/quiz') || (body && !body.includes('Generating your recommendations'))) {
      console.log('  → Content changed, capturing');
      break;
    }
  }

  await captureDOM(page, '02-post-quiz');

  // If URL changed to something else, capture that too
  const finalURL = page.url();
  console.log(`\n  Final URL: ${finalURL}`);

  // Check for additional navigation after a few more seconds
  await page.waitForTimeout(3000);
  const laterURL = page.url();
  if (laterURL !== finalURL) {
    console.log(`  URL changed again to: ${laterURL}`);
    await captureDOM(page, '03-final');
  }

  await browser.close();
  console.log('\n✅ Done — dom-snapshots/post-quiz/');
})();
