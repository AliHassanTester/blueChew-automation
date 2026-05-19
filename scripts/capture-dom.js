// DOM capture script — run once to get real Angular-rendered HTML and locator data
// Usage: node scripts/capture-dom.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'dom-snapshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = 'https://dev.app.bluechew.com';
const DEV_GATE  = 'dev';
const USERNAME  = 'ali@meds.com';
const PASSWORD  = 'certa@123';

function save(name, content) {
  const file = path.join(OUT_DIR, `${name}.html`);
  fs.writeFileSync(file, content, 'utf8');
  console.log(`  saved → ${file} (${Math.round(content.length / 1024)}KB)`);
}

async function waitForAngular(page, timeout = 15000) {
  await page.waitForFunction(
    () => {
      const root = document.querySelector('app-root');
      if (!root) return false;
      const loader = root.querySelector('#app-loading');
      return !loader || loader.style.display === 'none' || loader.offsetParent === null;
    },
    { timeout }
  ).catch(() => {});
  await page.waitForTimeout(1500);
}

async function extractInteractiveElements(page) {
  return page.evaluate(() => {
    const results = [];
    document.querySelectorAll('input, button, a[href], select, textarea, form').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      results.push({
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '',
        id: el.id || '',
        name: el.getAttribute('name') || '',
        placeholder: el.getAttribute('placeholder') || '',
        formControlName: el.getAttribute('formcontrolname') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
        dataTestId: el.getAttribute('data-testid') || '',
        className: (el.className || '').substring(0, 80),
        text: (el.textContent || '').trim().substring(0, 80),
        href: el.getAttribute('href') || '',
      });
    });
    return results;
  });
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await context.newPage();

  // ── 1. Navigate to dev-login gate and pass it ──────────────────────────────
  console.log('\n[1] Navigating to /dev-login ...');
  await page.goto(`${BASE_URL}/dev-login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForAngular(page);
  console.log('    URL:', page.url());

  const devPasswordInput = page.locator("input[formcontrolname='password']").first();
  await devPasswordInput.fill(DEV_GATE);
  const submitBtn = page.locator("button:has-text('Submit')").first();
  await submitBtn.click();
  await page.waitForLoadState('domcontentloaded');
  await waitForAngular(page);
  console.log('    Post-gate URL:', page.url());

  // ── 2. Navigate to the real login page (/log-in) ───────────────────────────
  console.log('\n[2] Navigating to /log-in ...');
  await page.goto(`${BASE_URL}/log-in`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitForAngular(page);
  await page.waitForTimeout(2000);
  console.log('    URL:', page.url());

  const loginElements = await extractInteractiveElements(page);
  save('02-log-in-page', await page.content());
  await page.screenshot({ path: path.join(OUT_DIR, '02-log-in-page.png'), fullPage: true });
  fs.writeFileSync(path.join(OUT_DIR, '02-log-in-elements.json'), JSON.stringify(loginElements, null, 2));
  console.log('    Elements found:', loginElements.length);
  loginElements.forEach(e => console.log(
    `    [${e.tag}] type="${e.type}" id="${e.id}" name="${e.name}" fcn="${e.formControlName}" placeholder="${e.placeholder}" ariaLabel="${e.ariaLabel}" class="${e.className.substring(0,40)}" text="${e.text.substring(0,50)}"`
  ));

  // ── 3. Fill login form ─────────────────────────────────────────────────────
  console.log('\n[3] Filling login form ...');
  let emailFilled = false, passFilled = false;

  // Angular reactive forms use formcontrolname
  for (const fcn of ['email', 'username', 'userName', 'emailAddress']) {
    const el = page.locator(`input[formcontrolname='${fcn}']`).first();
    if (await el.isVisible().catch(() => false)) {
      await el.fill(USERNAME);
      console.log(`    email → input[formcontrolname='${fcn}']`);
      emailFilled = true; break;
    }
  }
  if (!emailFilled) {
    for (const sel of ["input[type='email']", "input[name='email']", "input[placeholder*='email' i]", "input[id*='email' i]"]) {
      const el = page.locator(sel).first();
      if (await el.isVisible().catch(() => false)) {
        await el.fill(USERNAME);
        console.log(`    email → ${sel}`);
        emailFilled = true; break;
      }
    }
  }

  for (const fcn of ['password', 'Password']) {
    const el = page.locator(`input[formcontrolname='${fcn}']`).first();
    if (await el.isVisible().catch(() => false)) {
      await el.fill(PASSWORD);
      console.log(`    password → input[formcontrolname='${fcn}']`);
      passFilled = true; break;
    }
  }
  if (!passFilled) {
    const el = page.locator("input[type='password']").first();
    if (await el.isVisible().catch(() => false)) {
      await el.fill(PASSWORD);
      console.log('    password → input[type="password"]');
      passFilled = true;
    }
  }

  if (!emailFilled) console.warn('    ⚠ email field not found');
  if (!passFilled)  console.warn('    ⚠ password field not found');

  save('03-log-in-filled', await page.content());
  await page.screenshot({ path: path.join(OUT_DIR, '03-log-in-filled.png'), fullPage: true });

  // ── 4. Submit ──────────────────────────────────────────────────────────────
  console.log('\n[4] Submitting ...');
  let submitted = false;
  for (const sel of [
    "button[type='submit']",
    "button:has-text('Log in')",
    "button:has-text('Login')",
    "button:has-text('Sign in')",
    "button:has-text('Continue')",
    "button:has-text('Next')",
  ]) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      const txt = await el.textContent();
      await el.click();
      console.log(`    clicked → ${sel} ("${(txt||'').trim()}")`);
      submitted = true; break;
    }
  }
  if (!submitted) console.warn('    ⚠ submit button not found');

  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await waitForAngular(page, 20000);
  await page.waitForTimeout(3000);
  console.log('    Post-login URL:', page.url());

  // ── 5. Capture post-login page ────────────────────────────────────────────
  save('04-post-login', await page.content());
  await page.screenshot({ path: path.join(OUT_DIR, '04-post-login.png'), fullPage: true });

  const postElements = await extractInteractiveElements(page);
  fs.writeFileSync(path.join(OUT_DIR, '04-post-login-elements.json'), JSON.stringify(postElements, null, 2));
  console.log('    Post-login elements (first 20):');
  postElements.slice(0, 20).forEach(e => console.log(
    `    [${e.tag}] type="${e.type}" id="${e.id}" fcn="${e.formControlName}" text="${e.text.substring(0,60)}"`
  ));

  await browser.close();
  console.log('\nDone. All snapshots in:', OUT_DIR);
})();
