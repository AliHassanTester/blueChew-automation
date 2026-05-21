// Exhaustive registration flow capture using Playwright native clicks.
// Run: node scripts/capture-register-dom.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'dom-snapshots', 'register');
fs.mkdirSync(OUT, { recursive: true });

async function save(page, file) {
  try {
    await page.screenshot({ path: path.join(OUT, `${file}.png`), fullPage: true });
    fs.writeFileSync(path.join(OUT, `${file}.html`), await page.content());
    const els = await page.evaluate(() =>
      [...document.querySelectorAll('input, select, button, h1, h2, h3, h4')].flatMap(el => {
        const rect = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        if (rect.width === 0 || s.display === 'none' || s.visibility === 'hidden') return [];
        return [{
          tag: el.tagName.toLowerCase(),
          fcn: el.getAttribute('formcontrolname'),
          type: el.getAttribute('type'),
          dtid: el.getAttribute('data-test-id'),
          id: el.id || null,
          disabled: el.hasAttribute('disabled'),
          cls: el.className?.toString().slice(0, 60),
          text: el.textContent?.trim().slice(0, 50),
          html: el.outerHTML.slice(0, 250),
        }];
      })
    );
    fs.writeFileSync(path.join(OUT, `${file}-els.json`), JSON.stringify(els, null, 2));
    console.log(`  saved ${file} — ${els.length} visible @ ${page.url()}`);
    return els;
  } catch { return []; }
}

// Use Playwright-native iteration to find the first visible+enabled btn-primary
async function clickContinue(page, label) {
  let clicked = false;
  for (let attempt = 0; attempt < 30 && !clicked; attempt++) {
    const count = await page.locator('button.btn-primary').count();
    for (let i = 0; i < count && !clicked; i++) {
      const btn = page.locator('button.btn-primary').nth(i);
      const visible = await btn.isVisible().catch(() => false);
      const disabled = await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
      if (visible && !disabled) {
        const txt = (await btn.textContent().catch(() => '')).trim();
        console.log(`  [${label}] clicking btn-primary[${i}]: "${txt}"`);
        await btn.click();
        clicked = true;
      }
    }
    if (!clicked) await page.waitForTimeout(200);
  }
  if (!clicked) throw new Error(`No visible+enabled btn-primary found for: ${label}`);
  // wait for Angular to process + possible URL change
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);

  // ── Dev gate ─────────────────────────────────────────────────────────────────
  console.log('\n=== DEV GATE ===');
  await page.goto('https://dev.app.bluechew.com/dev-login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector("input[formcontrolname='password']");
  await page.fill("input[formcontrolname='password']", 'dev');
  await page.locator("//button[normalize-space()='Submit']").click();
  await page.waitForLoadState('networkidle');

  // ── Login page — confirm Sign Up link ────────────────────────────────────────
  console.log('\n=== LOGIN PAGE ===');
  await page.goto('https://dev.app.bluechew.com/log-in', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-test-id="sign-in-page"]');
  await save(page, 'LOGIN-page');

  const signUpLink = await page.evaluate(() =>
    [...document.querySelectorAll('a[href="/register"]')].map(a => {
      const r = a.getBoundingClientRect();
      const s = window.getComputedStyle(a);
      return { text: a.textContent?.trim(), class: a.className, visible: r.width > 0 && s.display !== 'none' };
    })
  );
  console.log('  All a[href=/register] links:', JSON.stringify(signUpLink, null, 2));

  // ── Navigate directly to /register ──────────────────────────────────────────
  console.log('\n=== REGISTER /register ===');
  await page.goto('https://dev.app.bluechew.com/register', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector("select[formcontrolname='state']", { timeout: 15000 });

  const testEmail = `aliQA.capture.${Date.now()}@example.com`;
  console.log(`  Test email: ${testEmail}`);

  // ── STEP 1: state + terms ─────────────────────────────────────────────────
  console.log('\n--- STEP 1: state + terms ---');
  await save(page, 'S1-before');
  await page.selectOption("select[formcontrolname='state']", { label: 'Illinois' });
  await page.locator('#agree_terms').check();
  await page.locator('#agree_terms').dispatchEvent('change'); // force Angular zone
  await page.waitForTimeout(400);
  await save(page, 'S1-filled');
  await clickContinue(page, 'S1');
  await save(page, 'S1-after');

  // ── STEP 2: email ─────────────────────────────────────────────────────────
  console.log('\n--- STEP 2: email ---');
  await page.waitForFunction(
    () => {
      const inp = document.querySelector("input[formcontrolname='email']");
      if (!inp) return false;
      const s = window.getComputedStyle(inp);
      return s.display !== 'none' && inp.getBoundingClientRect().width > 0;
    },
    { timeout: 10000 }
  );
  await save(page, 'S2-before');
  await page.fill("input[formcontrolname='email']", testEmail);
  await page.locator("input[formcontrolname='email']").dispatchEvent('input');
  await page.locator("input[formcontrolname='email']").dispatchEvent('blur');
  await page.waitForTimeout(400);
  await save(page, 'S2-filled');
  await clickContinue(page, 'S2');
  await save(page, 'S2-after');

  // ── STEP 3: password ──────────────────────────────────────────────────────
  console.log('\n--- STEP 3: password ---');
  await page.waitForFunction(
    () => {
      const inp = document.querySelector("input[formcontrolname='pass']");
      if (!inp) return false;
      const s = window.getComputedStyle(inp);
      return s.display !== 'none' && inp.getBoundingClientRect().width > 0;
    },
    { timeout: 10000 }
  );
  await save(page, 'S3-before');
  await page.fill("input[formcontrolname='pass']", 'certa@123');
  await page.locator("input[formcontrolname='pass']").dispatchEvent('input');
  await page.locator("input[formcontrolname='pass']").dispatchEvent('blur');
  await page.waitForTimeout(400);
  await save(page, 'S3-filled');

  const urlBefore = page.url();
  await clickContinue(page, 'S3');
  const urlAfter = page.url();
  console.log(`  URL changed: ${urlBefore} → ${urlAfter}`);
  await save(page, 'S3-after');

  // ── STEP 4+: follow until we leave /register ──────────────────────────────
  let stepN = 4;
  while (page.url().includes('dev.app.bluechew.com/register') && stepN <= 12) {
    console.log(`\n--- STEP ${stepN} (still on /register) ---`);
    const label = `S${stepN}`;
    const els = await save(page, `${label}-before`);

    const inputs = els.filter(e => ['input', 'select'].includes(e.tag) && !e.disabled);
    console.log(`  Visible inputs: ${inputs.map(i => i.fcn || i.type).join(', ')}`);

    for (const inp of inputs) {
      if (!inp.fcn) continue;
      const fcn = inp.fcn.toLowerCase();
      const loc = page.locator(`[formcontrolname="${inp.fcn}"]`).first();
      const vis = await loc.isVisible().catch(() => false);
      if (!vis) continue;

      if (inp.tag === 'select') {
        await loc.selectOption({ index: 1 }).catch(() => {});
      } else if (inp.type === 'checkbox') {
        await loc.check().catch(() => {});
        await loc.dispatchEvent('change');
      } else if (fcn.includes('email')) {
        await loc.fill(testEmail);
        await loc.dispatchEvent('input'); await loc.dispatchEvent('blur');
      } else if (fcn.includes('pass')) {
        await loc.fill('certa@123');
        await loc.dispatchEvent('input'); await loc.dispatchEvent('blur');
      } else if (fcn.includes('first')) {
        await loc.fill('Ali');
        await loc.dispatchEvent('input'); await loc.dispatchEvent('blur');
      } else if (fcn.includes('last')) {
        await loc.fill('QA');
        await loc.dispatchEvent('input'); await loc.dispatchEvent('blur');
      } else if (fcn.includes('phone')) {
        await loc.fill('3125550100');
        await loc.dispatchEvent('input'); await loc.dispatchEvent('blur');
      }
    }

    await page.waitForTimeout(400);
    await save(page, `${label}-filled`);
    const before = page.url();
    await clickContinue(page, label).catch(e => console.log(`  No clickable btn: ${e.message}`));
    console.log(`  URL: ${before} → ${page.url()}`);
    stepN++;
  }

  // ── Final page ──────────────────────────────────────────────────────────────
  console.log('\n=== FINAL PAGE ===');
  await page.waitForTimeout(1000);
  await save(page, 'FINAL');
  console.log(`  Final URL: ${page.url()}`);

  await browser.close();
  console.log('\n✅ Done. dom-snapshots/register/');
})();
