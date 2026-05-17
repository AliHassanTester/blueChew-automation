/**
 * BlueChew Site Explorer
 *
 * One-shot script: logs in and crawls the site to capture screenshots,
 * URLs, page titles, and key UI elements. Output drives framework design.
 *
 * Run: npx ts-node scripts/explore-site.ts
 * Or:  npx playwright test scripts/explore-site.ts --headed (if as a spec)
 */
import { chromium, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://dev.bluechew.com';
const EMAIL = 'ali@meds.com';
const PASSWORD = 'certa@123';

const OUT_DIR = path.resolve('screenshots/exploration');
fs.mkdirSync(OUT_DIR, { recursive: true });

interface PageInfo {
  step: string;
  url: string;
  title: string;
  screenshot: string;
  visibleLinks: string[];
  formFields: string[];
  buttons: string[];
  headings: string[];
}

const journal: PageInfo[] = [];

async function capture(page: Page, step: string): Promise<void> {
  const filename = `${String(journal.length + 1).padStart(2, '0')}-${step.replace(/\s+/g, '-').toLowerCase()}.png`;
  const screenshotPath = path.join(OUT_DIR, filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const links = await page
    .locator('a[href]')
    .evaluateAll((els) =>
      [...new Set((els as HTMLAnchorElement[]).map((e) => e.href).filter((h) => h.startsWith('http')))].slice(0, 20)
    );

  const buttons = await page
    .locator('button, [role="button"], input[type="submit"]')
    .allTextContents()
    .then((txts) => [...new Set(txts.map((t) => t.trim()).filter(Boolean))].slice(0, 15));

  const fields = await page
    .locator('input:not([type="hidden"]), select, textarea')
    .evaluateAll((els) =>
      (els as HTMLInputElement[]).map((e) => `${e.type || 'input'}:${e.name || e.placeholder || e.id || '?'}`).slice(0, 15)
    );

  const headings = await page
    .locator('h1, h2, h3')
    .allTextContents()
    .then((txts) => txts.map((t) => t.trim()).filter(Boolean).slice(0, 10));

  const info: PageInfo = {
    step,
    url: page.url(),
    title: await page.title(),
    screenshot: filename,
    visibleLinks: links as string[],
    formFields: fields as string[],
    buttons,
    headings,
  };

  journal.push(info);
  console.log(`\n📸 [${String(journal.length).padStart(2,'0')}] ${step}`);
  console.log(`   URL    : ${info.url}`);
  console.log(`   Title  : ${info.title}`);
  if (info.headings.length) console.log(`   H1-H3  : ${info.headings.slice(0,5).join(' | ')}`);
  if (info.buttons.length)  console.log(`   Buttons: ${info.buttons.slice(0,8).join(', ')}`);
  if (info.formFields.length) console.log(`   Fields : ${info.formFields.join(', ')}`);
}

async function tryClick(page: Page, selectors: string[]): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3000 })) {
        await el.click();
        return true;
      }
    } catch { /* continue */ }
  }
  return false;
}

async function main() {
  console.log('🚀 BlueChew Site Explorer');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Output: ${OUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true, slowMo: 200 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  });
  const page = await context.newPage();

  // ── 1. Home page ─────────────────────────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 60000 });
  await capture(page, 'home-page');

  // ── 2. Look for login / sign-in links ─────────────────────────────────────
  const loginClicked = await tryClick(page, [
    'a[href*="login"]', 'a[href*="sign-in"]', 'a[href*="signin"]',
    'button:has-text("Login")', 'button:has-text("Sign In")',
    'a:has-text("Login")', 'a:has-text("Sign In")', 'a:has-text("Log in")',
  ]);

  if (loginClicked) {
    await page.waitForLoadState('load', { timeout: 30000 });
    await capture(page, 'login-page');
  } else {
    // Try navigating directly to common login URLs
    for (const path_ of ['/login', '/signin', '/sign-in', '/account/login', '/user/login']) {
      try {
        await page.goto(`${BASE_URL}${path_}`, { waitUntil: 'load', timeout: 15000 });
        if (!page.url().includes('404')) {
          await capture(page, `login-page-direct-${path_.replace('/', '')}`);
          break;
        }
      } catch { /* continue */ }
    }
  }

  // ── 3. Attempt login ────────────────────────────────────────────────────
  const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="email" i]', '#email', 'input[name="username"]'];
  const passSelectors  = ['input[type="password"]', 'input[name="password"]', '#password'];
  const submitSelectors = ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Log in")', 'button:has-text("Sign in")', 'button:has-text("Login")', 'button:has-text("Continue")'];

  let emailFilled = false;
  for (const sel of emailSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3000 })) {
        await el.fill(EMAIL);
        emailFilled = true;
        break;
      }
    } catch { /* continue */ }
  }

  if (emailFilled) {
    for (const sel of passSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.fill(PASSWORD);
          break;
        }
      } catch { /* continue */ }
    }

    await capture(page, 'login-form-filled');

    for (const sel of submitSelectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.click();
          break;
        }
      } catch { /* continue */ }
    }

    try {
      await page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
    } catch { /* may not navigate */ }

    await page.waitForTimeout(3000);
    await capture(page, 'post-login-landing');
  }

  // ── 4. Explore navigation links found on current page ────────────────────
  const navLinks = await page.locator('nav a, header a, [role="navigation"] a').evaluateAll(
    (els) => (els as HTMLAnchorElement[]).map((e) => ({ text: e.textContent?.trim() || '', href: e.href })).filter((l) => l.text && l.href)
  );

  console.log('\n🧭 Navigation links found:');
  navLinks.forEach((l) => console.log(`   "${l.text}" → ${l.href}`));

  // Visit each distinct nav link to map the site
  const visited = new Set([page.url()]);
  for (const link of navLinks.slice(0, 12)) {
    if (!link.href.startsWith(BASE_URL) && !link.href.startsWith('https://dev.bluechew.com')) continue;
    if (visited.has(link.href)) continue;
    visited.add(link.href);

    try {
      await page.goto(link.href, { waitUntil: 'load', timeout: 20000 });
      await capture(page, `nav-${link.text.replace(/\s+/g, '-').substring(0, 30)}`);
    } catch (e) {
      console.log(`   ⚠️  Could not visit: ${link.href}`);
    }
  }

  // ── 5. Look for key user-flow pages ──────────────────────────────────────
  const knownPaths = [
    '/dashboard', '/profile', '/account', '/subscription', '/orders',
    '/plans', '/checkout', '/settings', '/my-account', '/prescriptions',
    '/questionnaire', '/visit', '/products', '/cart',
  ];

  for (const p of knownPaths) {
    const fullUrl = `${BASE_URL}${p}`;
    if (visited.has(fullUrl)) continue;
    try {
      const resp = await page.goto(fullUrl, { waitUntil: 'load', timeout: 15000 });
      if (resp && resp.status() < 400) {
        visited.add(fullUrl);
        await capture(page, `explore-${p.replace('/', '')}`);
      }
    } catch { /* page doesn't exist, skip */ }
  }

  // ── Save journal ──────────────────────────────────────────────────────────
  const journalPath = path.join(OUT_DIR, '_journal.json');
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2));

  await browser.close();

  console.log('\n═══════════════════════════════════════════');
  console.log(`✅ Exploration complete — ${journal.length} pages captured`);
  console.log(`   Screenshots: ${OUT_DIR}`);
  console.log(`   Journal    : ${journalPath}`);
  console.log('═══════════════════════════════════════════');
}

main().catch((err) => {
  console.error('Exploration failed:', err);
  process.exit(1);
});
