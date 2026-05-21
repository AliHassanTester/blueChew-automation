// Fills the medical form with safe/common answers and captures the checkout page.
// Run: node scripts/capture-medical-checkout.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'dom-snapshots', 'checkout-flow');
fs.mkdirSync(OUT, { recursive: true });

let stepNum = 0;
async function capture(page, label) {
  stepNum++;
  const slug = label.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
  const file = `${String(stepNum).padStart(2, '0')}-${slug}`;
  await page.screenshot({ path: path.join(OUT, `${file}.png`), fullPage: true });
  const data = await page.evaluate(() => {
    const allEls = [...document.querySelectorAll('*')].flatMap(el => {
      const rect = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      if (rect.width < 5 || rect.height < 5 || s.display === 'none' || s.visibility === 'hidden') return [];
      const tag = el.tagName.toLowerCase();
      if (!['input','select','textarea','button','a','label','h1','h2','h3','h4','p','li','div','span'].includes(tag)) return [];
      const text = el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 120) || '';
      if (!text && !['input','select','textarea'].includes(tag)) return [];
      return [{
        tag, id: el.id || null, dtid: el.getAttribute('data-test-id'),
        fcn: el.getAttribute('formcontrolname'),
        cls: el.className?.toString().replace(/\s+/g, ' ').slice(0, 80) || null,
        text, disabled: el.hasAttribute('disabled'), type: el.getAttribute('type'),
        html: el.outerHTML.slice(0, 400),
      }];
    });
    return { url: location.href, bodyText: document.body?.innerText?.replace(/\s+/g, ' ').slice(0, 2000) || '', elements: allEls };
  });
  fs.writeFileSync(path.join(OUT, `${file}.json`), JSON.stringify(data, null, 2));
  console.log(`\n=== [${file}] ===`);
  console.log(`  URL: ${data.url}`);
  console.log(`  Body: "${data.bodyText.slice(0, 250)}"`);
  const dtids = data.elements.filter(e => e.dtid).map(e => `    [${e.dtid}] "${e.text.slice(0, 80)}"`);
  if (dtids.length) console.log(`  data-test-ids:\n${dtids.join('\n')}`);
  const btns = data.elements.filter(e => e.tag === 'button' && e.text && !e.disabled);
  if (btns.length) console.log(`  buttons:\n${btns.slice(0, 10).map(b => `    id="${b.id}" dtid="${b.dtid}" cls="${b.cls?.slice(0,40)}" text="${b.text.slice(0, 60)}"`).join('\n')}`);
  const inputs = data.elements.filter(e => ['input','select','textarea'].includes(e.tag));
  if (inputs.length) console.log(`  inputs:\n${inputs.slice(0, 20).map(i => `    id="${i.id}" fcn="${i.fcn}" type="${i.type}"`).join('\n')}`);
  return data;
}

async function waitForAngular(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.processing-loader, [class*="spinner"]', { state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => {
    const els = [...document.querySelectorAll('button, h1, h2, [data-test-id]')].filter(el => {
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return r.width > 10 && s.display !== 'none';
    });
    return els.length > 0;
  }, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);
}

async function clickActiveStepContinue(page) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const count = await page.locator('button.btn-primary').count();
    for (let i = 0; i < count; i++) {
      const btn = page.locator('button.btn-primary').nth(i);
      const vis = await btn.isVisible().catch(() => false);
      const dis = await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
      if (vis && !dis) { await btn.click(); await waitForAngular(page); return; }
    }
    await page.waitForTimeout(200);
  }
  throw new Error('No enabled btn-primary');
}

async function register(page) {
  const email = `aliQA.co.${Date.now()}@example.com`;
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
  const hasAnswers = await page.waitForSelector('[data-test-id="quiz-answer-0"]', { timeout: 5000 }).then(() => true).catch(() => false);
  if (!hasAnswers) {
    for (const t of ['Get Started','Begin','Continue','Start','Next']) {
      const btn = page.locator(`button:has-text("${t}")`).first();
      if (await btn.isVisible().catch(() => false)) { await btn.click(); break; }
    }
    await page.waitForSelector('[data-test-id="quiz-answer-0"]', { timeout: 20000 });
  }
  for (const [i, ans] of [[0,2],[1,0],[2,1]]) {
    const prog = await page.locator('[data-test-id="quiz-progress-text"]').textContent().catch(() => `${i+1}`);
    await page.locator(`[data-test-id="quiz-answer-${ans}"]`).click();
    if (i < 2) await page.waitForFunction((p) => { const el = document.querySelector('[data-test-id="quiz-progress-text"]'); return el !== null && el.textContent?.trim() !== p; }, prog?.trim(), { timeout: 10000 });
  }
  await page.waitForURL(/\/results/, { timeout: 20000 });
}

async function fillMedicalForm(page) {
  console.log('\n  → Filling medical form...');

  // Text fields
  await page.fill("input[formcontrolname='first_name']", 'Ali');
  await page.fill("input[formcontrolname='last_name']", 'QA');
  await page.fill("input[formcontrolname='birthday']", '01/01/1990');
  await page.locator("input[formcontrolname='birthday']").press('Tab');
  await page.waitForTimeout(300);

  // Q2: Sex → Male
  await page.locator('#male-seeking-treatment-yes').check();

  // Q3: Are you the patient? → Yes
  await page.locator('#are-you-the-patient-yes').check();

  // Q4: Reason → "I want to see if chewables work better for me" (checkbox-4)
  await page.locator('#reason-for-choosing-checkbox-4').check();

  // Q5: Can walk 1 mile? → Yes
  await page.locator('#walk-one-mile-yes').check();

  // Q6: Climb 2 stairs time → About 10 seconds (#1)
  await page.locator('#climb-two-stairs-1').check();

  // Q6b: Fitness agreement (appears dynamically after Q6) → Yes
  const fitnessVisible = await page.locator('#fitness-agree-yes').waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);
  if (fitnessVisible) {
    await page.locator('#fitness-agree-yes').check();
    console.log('  ✓ fitnessAgree = Yes');
  }

  // Q7: Told NOT to have sex? → No
  await page.locator('#healthy-enough-no').check();

  // Q8: Low blood pressure? → No
  await page.locator('#low-blood-pressure-no').check();

  // Q9: High blood pressure? → No
  await page.locator('#high-blood-pressure-no').check();

  // Q10: Vitamins → "I DO NOT take any of these" (checkbox-4)
  await page.locator('#taking-other-med-checkbox-4').check();

  // Q11: Contraindicated meds → "I DO NOT take any of these" (checkbox-8)
  await page.locator('#take-contra-meds-checkbox-8').check();

  // Q12: Allergies? → No
  await page.locator('#have-allergies-no').check();

  // Q13: Conditions → "I have NONE of these" (abnormal-conditions-5)
  await page.locator('#abnormal-conditions-5').check();

  // Q14: Other medical conditions? → No
  await page.locator('#other-med-conditions-no').check();

  // Q15: Not taking other meds → check the "I am NOT taking any" checkbox
  await page.locator('#notTakingAnyOtherMeds').check();

  // Q16: Anything else? → No
  await page.locator('#anything-else-no').check();

  await page.waitForTimeout(500);
  console.log('  ✓ Medical form filled');
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);

  await register(page);
  await completeQuiz(page);
  await page.waitForSelector('[data-test-id="results-page-root"]', { timeout: 15000 });
  await capture(page, 'results');

  // Click TRY GOLD
  console.log('\n  → Clicking TRY GOLD...');
  await page.locator('button.cta-button').first().click();
  await waitForAngular(page);
  console.log(`  URL: ${page.url()}`);

  // Medical form
  await page.waitForSelector("input[formcontrolname='first_name']", { timeout: 15000 });
  await capture(page, 'medical-blank');
  await fillMedicalForm(page);
  await capture(page, 'medical-filled');

  // Submit (may need two attempts if a validation modal appears)
  for (let attempt = 1; attempt <= 2; attempt++) {
    const submitBtn = page.locator('button.btn-submit-alone').first();
    if (await submitBtn.isVisible().catch(() => false)) {
      console.log(`  → Clicking Submit (attempt ${attempt})...`);
      await submitBtn.click();
      await page.waitForTimeout(1500);
    }
    // Dismiss any validation modal
    const dismissBtn = page.locator('button:has-text("Dismiss")').first();
    if (await dismissBtn.isVisible().catch(() => false)) {
      console.log('  → Dismissing validation modal...');
      await dismissBtn.click();
      await page.waitForTimeout(500);
      // Re-check fitnessAgree if it appeared
      const fa = await page.locator('#fitness-agree-yes').isVisible().catch(() => false);
      if (fa) { await page.locator('#fitness-agree-yes').check(); await page.waitForTimeout(300); }
    } else {
      break; // no modal, move on
    }
  }
  await waitForAngular(page);
  console.log(`  URL after submit: ${page.url()}`);
  await capture(page, `after-submit-${page.url().split('/').pop()?.replace(/\?.*/,'') || 'page'}`);

  // If on checkout, capture fully and keep going
  for (let step = 1; step <= 8; step++) {
    const url = page.url();
    const data = await capture(page, `step${step}-${url.split('/').pop()?.replace(/\?.*/,'') || 'page'}`);
    const btns = data.elements.filter(e => e.tag === 'button' && e.text && !e.disabled);
    const ADVANCE = ['next','continue','submit','proceed','confirm','checkout','place order','complete','pay','purchase'];
    let advanced = false;

    for (const btn of btns) {
      if (ADVANCE.some(t => btn.text.toLowerCase().includes(t))) {
        const loc = page.locator('button').filter({ hasText: btn.text.slice(0,30) }).first();
        if (await loc.isVisible().catch(() => false)) {
          console.log(`  → "${btn.text.slice(0,60)}"`);
          await loc.click(); await waitForAngular(page); advanced = true; break;
        }
      }
    }
    if (!advanced) {
      const count = await page.locator('button.btn-primary').count();
      for (let i = 0; i < count; i++) {
        const b = page.locator('button.btn-primary').nth(i);
        if (await b.isVisible().catch(() => false) && !await b.evaluate(el => el.hasAttribute('disabled')).catch(() => true)) {
          const txt = (await b.textContent().catch(() => '')).trim();
          console.log(`  → btn-primary: "${txt}"`);
          await b.click(); await waitForAngular(page); advanced = true; break;
        }
      }
    }
    if (!advanced) { console.log('  ⚠ No advance button — stopping'); break; }
    const newURL = page.url();
    if (newURL === url) { console.log('  URL unchanged — stopping'); break; }
    console.log(`  URL: ${url} → ${newURL}`);
  }

  await browser.close();
  console.log('\n✅ Done — dom-snapshots/checkout-flow/');
})();
