// Starting from a fully filled medical form, captures checkout and beyond.
// Run: node scripts/capture-checkout-forward.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'dom-snapshots', 'checkout-forward');
fs.mkdirSync(OUT, { recursive: true });

let stepNum = 0;
async function capture(page, label) {
  stepNum++;
  const slug = label.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40);
  const file = `${String(stepNum).padStart(2, '0')}-${slug}`;
  // Wait briefly for page to settle before capturing
  await page.waitForTimeout(500);
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
  console.log(`  Body: "${data.bodyText.slice(0, 300)}"`);
  const dtids = data.elements.filter(e => e.dtid).map(e => `    [${e.dtid}] "${e.text.slice(0, 80)}"`);
  if (dtids.length) console.log(`  data-test-ids:\n${dtids.join('\n')}`);
  const btns = data.elements.filter(e => e.tag === 'button' && e.text && !e.disabled);
  if (btns.length) console.log(`  buttons:\n${btns.slice(0, 10).map(b => `    id="${b.id}" dtid="${b.dtid}" cls="${b.cls?.slice(0,50)}" text="${b.text.slice(0, 60)}"`).join('\n')}`);
  const inputs = data.elements.filter(e => ['input','select','textarea'].includes(e.tag));
  if (inputs.length) console.log(`  inputs:\n${inputs.slice(0, 15).map(i => `    id="${i.id}" fcn="${i.fcn}" type="${i.type}" dtid="${i.dtid}"`).join('\n')}`);
  return data;
}

async function waitForAngular(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.processing-loader', { state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function clickActiveStepContinue(page) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const count = await page.locator('button.btn-primary').count();
    for (let i = 0; i < count; i++) {
      const btn = page.locator('button.btn-primary').nth(i);
      if (await btn.isVisible().catch(() => false) && !await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true)) {
        await btn.click(); await waitForAngular(page); return;
      }
    }
    await page.waitForTimeout(200);
  }
  throw new Error('No enabled btn-primary');
}

async function register(page) {
  const email = `aliQA.cf.${Date.now()}@example.com`;
  console.log(`Registering: ${email}`);
  await page.goto('https://dev.app.bluechew.com/dev-login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector("input[formcontrolname='password']");
  await page.fill("input[formcontrolname='password']", 'dev');
  await page.locator("//button[normalize-space()='Submit']").click();
  await page.waitForLoadState('networkidle');
  await page.goto('https://dev.app.bluechew.com/register', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector("select[formcontrolname='state']");
  await page.selectOption("select[formcontrolname='state']", { label: 'Illinois' });
  await page.locator('#agree_terms').check(); await page.waitForTimeout(400);
  await clickActiveStepContinue(page);
  await page.waitForFunction(() => { const i = document.querySelector("input[formcontrolname='email']"); return i && window.getComputedStyle(i).display !== 'none' && i.getBoundingClientRect().width > 0; }, { timeout: 10000 });
  await page.fill("input[formcontrolname='email']", email);
  await page.locator("input[formcontrolname='email']").press('Tab'); await page.waitForTimeout(400);
  await clickActiveStepContinue(page);
  await page.waitForFunction(() => { const i = document.querySelector("input[formcontrolname='pass']"); return i && window.getComputedStyle(i).display !== 'none' && i.getBoundingClientRect().width > 0; }, { timeout: 10000 });
  await page.fill("input[formcontrolname='pass']", 'certa@123');
  await page.locator("input[formcontrolname='pass']").press('Tab'); await page.waitForTimeout(400);
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
  await page.fill("input[formcontrolname='first_name']", 'Ali');
  await page.fill("input[formcontrolname='last_name']", 'QA');
  await page.fill("input[formcontrolname='birthday']", '01/01/1990');
  await page.locator("input[formcontrolname='birthday']").press('Tab'); await page.waitForTimeout(300);
  await page.locator('#male-seeking-treatment-yes').check();
  await page.locator('#are-you-the-patient-yes').check();
  await page.locator('#reason-for-choosing-checkbox-4').check();
  await page.locator('#walk-one-mile-yes').check();
  await page.locator('#climb-two-stairs-1').check();
  const fitnessVisible = await page.locator('#fitness-agree-yes').waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);
  if (fitnessVisible) { await page.locator('#fitness-agree-yes').check(); }
  await page.locator('#healthy-enough-no').check();
  await page.locator('#low-blood-pressure-no').check();
  await page.locator('#high-blood-pressure-no').check();
  await page.locator('#taking-other-med-checkbox-4').check();
  await page.locator('#take-contra-meds-checkbox-8').check();
  await page.locator('#have-allergies-no').check();
  await page.locator('#abnormal-conditions-5').check();
  await page.locator('#other-med-conditions-no').check();
  await page.locator('#notTakingAnyOtherMeds').check();
  await page.locator('#anything-else-no').check();
  await page.waitForTimeout(400);
  console.log('  ✓ Medical form filled');
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);

  await register(page);
  await completeQuiz(page);
  await page.waitForSelector('[data-test-id="results-page-root"]', { timeout: 15000 });

  // TRY GOLD
  await page.locator('button.cta-button').first().click();
  await waitForAngular(page);
  await page.waitForSelector("input[formcontrolname='first_name']", { timeout: 15000 });
  console.log(`  → on medical: ${page.url()}`);

  // Fill & submit medical form
  await fillMedicalForm(page);
  for (let attempt = 1; attempt <= 2; attempt++) {
    await page.locator('button.btn-submit-alone').first().click();
    await page.waitForTimeout(1500);
    const dismissBtn = page.locator('button:has-text("Dismiss")').first();
    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click(); await page.waitForTimeout(500);
      const fa = await page.locator('#fitness-agree-yes').isVisible().catch(() => false);
      if (fa) { await page.locator('#fitness-agree-yes').check(); await page.waitForTimeout(300); }
    } else { break; }
  }
  // Wait for navigation to checkout
  await page.waitForURL(/\/checkout/, { timeout: 20000 });
  console.log(`  → on checkout: ${page.url()}`);

  // ── Walk from /checkout onward ──────────────────────────────────────────────
  let prevURL = '';
  for (let step = 1; step <= 12; step++) {
    await waitForAngular(page);
    const url = page.url();
    const slug = url.replace('https://dev.app.bluechew.com/', '').replace(/\?.*/,'').replace(/\//g,'-') || `step${step}`;
    const data = await capture(page, slug);
    if (url === prevURL) { console.log('  ⚠ URL unchanged — end of captured flow'); break; }
    prevURL = url;

    // Fill any inputs
    for (const inp of data.elements.filter(e => ['input','select','textarea'].includes(e.tag) && !e.disabled)) {
      const loc = inp.fcn ? page.locator(`[formcontrolname="${inp.fcn}"]`).first()
        : inp.id ? page.locator(`#${inp.id}`).first() : null;
      if (!loc || !await loc.isVisible().catch(() => false)) continue;
      if (inp.tag === 'select') { await loc.selectOption({ index: 1 }).catch(() => {}); }
      else if (inp.type === 'checkbox') { await loc.check().catch(() => {}); }
      else if (inp.type === 'radio') { /* handle below */ }
      else if (!['hidden','submit','button'].includes(inp.type || '')) {
        const fcn = (inp.fcn || inp.id || '').toLowerCase();
        const val = fcn.includes('email') ? `aliQA.fill.${Date.now()}@example.com`
          : fcn.includes('pass') ? 'certa@123' : fcn.includes('phone') ? '3125550100'
          : inp.type === 'number' ? '5' : 'TestValue';
        await loc.fill(val).catch(() => {}); await loc.press('Tab').catch(() => {});
        console.log(`  ✓ input[${inp.fcn || inp.id}] = "${val}"`);
      }
    }
    await page.waitForTimeout(400);

    const ADVANCE = ['continue','next','submit','proceed','confirm','checkout','place order','complete','pay','purchase','select plan','get started'];
    let advanced = false;
    const btns = data.elements.filter(e => e.tag === 'button' && e.text && !e.disabled);

    for (const btn of btns) {
      if (ADVANCE.some(t => btn.text.toLowerCase().includes(t))) {
        const loc = btn.id ? page.locator(`#${btn.id}`).first()
          : page.locator('button').filter({ hasText: btn.text.slice(0, 30) }).first();
        if (await loc.isVisible().catch(() => false) && !await loc.evaluate(el => el.hasAttribute('disabled')).catch(() => true)) {
          console.log(`  → "${btn.text.slice(0, 60)}"`);
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
    // Fallback: div.slide-btn (used on checkout product-education slides)
    if (!advanced) {
      const slideBtn = page.locator('div.slide-btn').first();
      if (await slideBtn.isVisible().catch(() => false)) {
        const txt = (await slideBtn.textContent().catch(() => '')).trim();
        console.log(`  → div.slide-btn: "${txt}"`);
        await slideBtn.click(); await page.waitForTimeout(1500); advanced = true;
      }
    }
    if (!advanced) { console.log('  ⚠ No advance button'); break; }
    console.log(`  URL: ${url} → ${page.url()}`);
  }

  await browser.close();
  console.log('\n✅ Done — dom-snapshots/checkout-forward/');
})();
