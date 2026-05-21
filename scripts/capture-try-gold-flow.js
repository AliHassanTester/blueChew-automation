// Captures every page after clicking TRY GOLD, with proper Angular hydration waits.
// Run: node scripts/capture-try-gold-flow.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'dom-snapshots', 'try-gold-flow');
fs.mkdirSync(OUT, { recursive: true });

let stepNum = 0;
async function capture(page, label) {
  stepNum++;
  const file = `${String(stepNum).padStart(2,'0')}-${label.replace(/[^a-zA-Z0-9-]/g,'').slice(0,40)}`;
  await page.screenshot({ path: path.join(OUT, `${file}.png`), fullPage: true });
  const data = await page.evaluate(() => {
    const allEls = [...document.querySelectorAll('*')].flatMap(el => {
      const rect = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      if (rect.width < 5 || rect.height < 5 || s.display === 'none' || s.visibility === 'hidden') return [];
      const tag = el.tagName.toLowerCase();
      if (!['input','select','textarea','button','a','label','h1','h2','h3','h4','p','li','div','span'].includes(tag)) return [];
      const text = el.textContent?.trim().replace(/\s+/g,' ').slice(0,120) || '';
      if (!text && !['input','select','textarea'].includes(tag)) return [];
      return [{ tag, id: el.id||null, dtid: el.getAttribute('data-test-id'), fcn: el.getAttribute('formcontrolname'), cls: el.className?.toString().replace(/\s+/g,' ').slice(0,80)||null, text, disabled: el.hasAttribute('disabled'), type: el.getAttribute('type'), html: el.outerHTML.slice(0,400) }];
    });
    return { url: location.href, bodyText: document.body?.innerText?.replace(/\s+/g,' ').slice(0,2000)||'', elements: allEls };
  });
  fs.writeFileSync(path.join(OUT, `${file}.json`), JSON.stringify(data, null, 2));
  console.log(`\n=== [${file}] ===`);
  console.log(`  URL: ${data.url}`);
  console.log(`  Body: "${data.bodyText.slice(0,300)}"`);
  const dtids = data.elements.filter(e => e.dtid).map(e => `    [${e.dtid}] "${e.text.slice(0,80)}"`);
  if (dtids.length) console.log(`  data-test-ids:\n${dtids.join('\n')}`);
  const btns = data.elements.filter(e => e.tag === 'button' && e.text && !e.disabled);
  if (btns.length) console.log(`  buttons:\n${btns.slice(0,10).map(b => `    "${b.text.slice(0,60)}" [cls="${b.cls?.slice(0,50)}"] [dtid="${b.dtid}"]`).join('\n')}`);
  const inputs = data.elements.filter(e => ['input','select','textarea'].includes(e.tag));
  if (inputs.length) console.log(`  inputs:\n${inputs.slice(0,10).map(i => `    [${i.tag}] fcn="${i.fcn}" type="${i.type}" dtid="${i.dtid}"`).join('\n')}`);
  return data;
}

async function waitForAngular(page) {
  await page.waitForLoadState('domcontentloaded');
  // Wait for loader to vanish
  await page.waitForSelector('.processing-loader, [class*="spinner"], [aria-label="Loading"]', { state: 'hidden', timeout: 15000 }).catch(() => {});
  // Wait until at least one visible button or h1/h2 appears (Angular hydrated)
  await page.waitForFunction(() => {
    const els = [...document.querySelectorAll('button, h1, h2, [data-test-id]')].filter(el => {
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return r.width > 10 && r.height > 10 && s.display !== 'none';
    });
    return els.length > 0;
  }, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
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
  const email = `aliQA.tg.${Date.now()}@example.com`;
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

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 60 });
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);

  await register(page);
  await completeQuiz(page);
  await page.waitForSelector('[data-test-id="results-page-root"]', { timeout: 15000 });
  await capture(page, 'results');

  // ── Click TRY GOLD ──────────────────────────────────────────────────────────
  console.log('\n  → Clicking TRY GOLD...');
  await page.locator('button.cta-button').first().click();
  await waitForAngular(page);
  const postGoldURL = page.url();
  console.log(`  URL after TRY GOLD: ${postGoldURL}`);
  const data1 = await capture(page, postGoldURL.split('/').slice(-1)[0].replace(/\?.*/, '') || 'post-gold');

  // ── Walk the remaining flow ─────────────────────────────────────────────────
  const ADVANCE = ['next','continue','get started','submit','done','proceed','confirm','select','checkout','see my','find my','get my','view plan'];
  let prevURL = '';

  for (let step = 1; step <= 15; step++) {
    const url = page.url();
    if (url === prevURL) { console.log('  ⚠ URL unchanged — stopping'); break; }
    prevURL = url;

    const data = await (step === 1 ? Promise.resolve(data1) : capture(page, url.split('/').slice(-1)[0].replace(/\?.*/, '') || `step${step}`));

    // Fill any visible inputs
    for (const inp of data.elements.filter(e => ['input','select','textarea'].includes(e.tag) && !e.disabled)) {
      const loc = inp.fcn ? page.locator(`[formcontrolname="${inp.fcn}"]`).first()
        : inp.dtid ? page.locator(`[data-test-id="${inp.dtid}"]`).first()
        : null;
      if (!loc || !await loc.isVisible().catch(() => false)) continue;
      if (inp.tag === 'select') {
        await loc.selectOption({ index: 1 }).catch(() => {});
        console.log(`  ✓ select[${inp.fcn}]`);
      } else if (inp.type === 'checkbox') {
        await loc.check().catch(() => {});
      } else if (inp.type !== 'radio' && inp.type !== 'hidden' && inp.type !== 'submit') {
        const fcn = (inp.fcn || '').toLowerCase();
        const val = fcn.includes('email') ? `aliQA.fill.${Date.now()}@example.com`
          : fcn.includes('pass') ? 'certa@123' : fcn.includes('first') ? 'Ali'
          : fcn.includes('last') ? 'QA' : fcn.includes('phone') ? '3125550100'
          : inp.type === 'number' ? '5' : 'TestValue';
        await loc.fill(val).catch(() => {});
        await loc.press('Tab').catch(() => {});
        console.log(`  ✓ input[${inp.fcn || inp.dtid}] = "${val}"`);
      }
    }
    await page.waitForTimeout(400);

    let advanced = false;
    // Try named advance buttons
    for (const btn of data.elements.filter(e => e.tag === 'button' && e.text && !e.disabled)) {
      if (ADVANCE.some(t => btn.text.toLowerCase().includes(t))) {
        const loc = page.locator('button').filter({ hasText: btn.text.slice(0,30) }).first();
        if (await loc.isVisible().catch(() => false)) {
          console.log(`  → "${btn.text.slice(0,60)}"`);
          await loc.click(); await waitForAngular(page); advanced = true; break;
        }
      }
    }
    // Fallback: first visible+enabled btn-primary
    if (!advanced) {
      const count = await page.locator('button.btn-primary').count();
      for (let i = 0; i < count; i++) {
        const btn = page.locator('button.btn-primary').nth(i);
        if (await btn.isVisible().catch(() => false) && !await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true)) {
          const txt = (await btn.textContent().catch(() => '')).trim();
          console.log(`  → btn-primary: "${txt}"`);
          await btn.click(); await waitForAngular(page); advanced = true; break;
        }
      }
    }
    if (!advanced) { console.log('  ⚠ Nothing to click — end of flow'); break; }

    const newURL = page.url();
    console.log(`  URL: ${url} → ${newURL}`);
    if (newURL !== url) await capture(page, newURL.split('/').slice(-1)[0].replace(/\?.*/, '') || `after${step}`);
  }

  await browser.close();
  console.log(`\n✅ Done — dom-snapshots/try-gold-flow/`);
})();
