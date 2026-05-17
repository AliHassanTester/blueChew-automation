/**
 * BlueChew App Explorer — app.bluechew.com (production)
 *
 * Maps every authenticated page: screenshots + element/URL/heading inventory.
 * Output drives the framework refactoring.
 *
 * Run: npx ts-node scripts/explore-app.ts
 */
import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const APP_BASE = 'https://app.bluechew.com';
const MKT_BASE = 'https://www.bluechew.com';
const EMAIL    = 'ali@meds.com';
const PASSWORD = 'certa@123';

const OUT_DIR = path.resolve('screenshots/app-exploration');
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

interface PageSnapshot {
  step: string;
  url: string;
  title: string;
  file: string;
  headings: string[];
  buttons: string[];
  links: string[];
  fields: string[];
  testIds: string[];
}
const journal: PageSnapshot[] = [];
let stepNum = 0;

async function snap(page: Page, label: string): Promise<PageSnapshot> {
  stepNum++;
  const slug  = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/-+/g, '-');
  const filename = `${String(stepNum).padStart(2, '0')}-${slug}.png`;
  const file = path.join(OUT_DIR, filename);

  await page.waitForTimeout(800); // let animations settle
  await page.screenshot({ path: file, fullPage: true });

  const [headings, buttons, links, fields, testIds] = await Promise.all([
    page.locator('h1,h2,h3').allTextContents().then(t => t.map(s => s.trim()).filter(Boolean).slice(0, 8)),
    page.locator('button,[role="button"]').allTextContents().then(t => [...new Set(t.map(s => s.trim()).filter(Boolean))].slice(0, 15)),
    page.locator('a[href]').evaluateAll(els =>
      [...new Set((els as HTMLAnchorElement[]).map(e => e.href).filter(h => h.includes('bluechew.com')))].slice(0, 30)
    ),
    page.locator('input:not([type=hidden]),select,textarea').evaluateAll(els =>
      (els as HTMLInputElement[]).map(e =>
        `${e.type || 'input'}::${e.name || e.placeholder || e.id || e.getAttribute('aria-label') || '?'}`
      ).slice(0, 20)
    ),
    page.locator('[data-test-id],[data-testid]').evaluateAll(els =>
      (els as HTMLElement[]).map(e => e.getAttribute('data-test-id') || e.getAttribute('data-testid') || '').filter(Boolean).slice(0, 30)
    ),
  ]);

  const entry: PageSnapshot = { step: label, url: page.url(), title: await page.title(), file: filename, headings, buttons, links: links as string[], fields: fields as string[], testIds: testIds as string[] };
  journal.push(entry);

  console.log(`\n📸 [${String(stepNum).padStart(2,'0')}] ${label}`);
  console.log(`   URL     : ${entry.url}`);
  console.log(`   Title   : ${entry.title}`);
  if (headings.length) console.log(`   Headings: ${headings.slice(0,5).join(' | ')}`);
  if (buttons.length)  console.log(`   Buttons : ${buttons.slice(0,10).join(', ')}`);
  if (fields.length)   console.log(`   Fields  : ${fields.join(', ')}`);
  if (testIds.length)  console.log(`   TestIDs : ${testIds.slice(0,15).join(', ')}`);

  return entry;
}

async function visitIfNew(page: Page, url: string, label: string, visited: Set<string>): Promise<void> {
  if (visited.has(url)) return;
  visited.add(url);
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {/* ok */});
    const finalUrl = page.url();
    if (finalUrl.includes('/log-in') && !url.includes('/log-in')) {
      console.log(`   🔒 Auth-gated: ${url}`);
      return;
    }
    if ((resp?.status() ?? 0) === 404 || finalUrl.includes('not-found')) {
      console.log(`   ⊘  404: ${url}`);
      return;
    }
    await snap(page, label);
  } catch (err) {
    console.log(`   ⚠️  Error visiting ${url}: ${String(err).substring(0, 80)}`);
  }
}

async function main() {
  console.log('🚀 BlueChew App Explorer (app.bluechew.com — production)');
  console.log(`   Output: ${OUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121 Safari/537.36',
  });
  const page = await context.newPage();

  // ══════════════════════════════════════════════════════════════
  // 1. MARKETING SITE
  // ══════════════════════════════════════════════════════════════
  await page.goto(MKT_BASE, { waitUntil: 'load', timeout: 30000 });
  await snap(page, 'marketing-home');

  await page.goto(`${MKT_BASE}/quiz`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
  await snap(page, 'marketing-quiz');

  // ══════════════════════════════════════════════════════════════
  // 2. APP LOGIN PAGE
  // ══════════════════════════════════════════════════════════════
  await page.goto(`${APP_BASE}/log-in`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
  await snap(page, 'login-page');

  // ══════════════════════════════════════════════════════════════
  // 3. LOGIN FLOW
  // ══════════════════════════════════════════════════════════════
  // BlueChew uses Angular — find the reactive form inputs by data-test-id first,
  // fall back to type/placeholder selectors
  const emailSels = [
    '[data-test-id*="email"]',
    '[data-testid*="email"]',
    'input[type="email"]',
    'input[name="email"]',
    'input[name="username"]',
    'input[placeholder*="email" i]',
    '#email',
  ];
  const passSels = [
    '[data-test-id*="password"]',
    '[data-testid*="password"]',
    'input[type="password"]',
    '#password',
  ];
  const submitSels = [
    '[data-test-id*="submit"]',
    '[data-testid*="submit"]',
    '[data-test-id*="login"]',
    'button[type="submit"]',
    'button.btn-primary',
  ];

  async function fillAndClick(selectors: string[], value: string): Promise<boolean> {
    for (const sel of selectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.fill(value);
          return true;
        }
      } catch { /* try next */ }
    }
    return false;
  }

  await fillAndClick(emailSels, EMAIL);
  await fillAndClick(passSels, PASSWORD);
  await snap(page, 'login-form-filled');

  // Click submit
  for (const sel of submitSels) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 3000 })) {
        await el.click();
        break;
      }
    } catch { /* try next */ }
  }

  // Wait for navigation or error
  try {
    await page.waitForURL(url => !url.href.includes('/log-in'), { timeout: 15000 });
  } catch {
    // May be two-step (email → next → password) or MFA
    const continueSels = ['button:has-text("Continue")', 'button:has-text("Next")', '[data-test-id*="continue"]'];
    for (const sel of continueSels) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 3000 })) {
          await el.click();
          await page.waitForTimeout(2000);
          await fillAndClick(passSels, PASSWORD);
          for (const s of submitSels) {
            const btn = page.locator(s).first();
            if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) { await btn.click(); break; }
          }
          break;
        }
      } catch { /* ignore */ }
    }
  }

  await page.waitForTimeout(4000);
  const postLoginUrl = page.url();
  console.log(`\n🔑 Post-login URL: ${postLoginUrl}`);
  const loggedIn = !postLoginUrl.includes('/log-in');
  console.log(`   Login status: ${loggedIn ? '✅ SUCCESS' : '❌ FAILED — still on login page'}`);

  await snap(page, 'post-login-landing');

  // ══════════════════════════════════════════════════════════════
  // 4. EXPLORE AUTHENTICATED PAGES
  // ══════════════════════════════════════════════════════════════
  const visited = new Set<string>([page.url(), `${APP_BASE}/log-in`]);

  const accountRoutes = [
    ['/account', 'account-home'],
    ['/account/membership', 'account-membership'],
    ['/account/orders', 'account-orders'],
    ['/account/profile', 'account-profile'],
    ['/account/medical', 'account-medical'],
    ['/account/address', 'account-address'],
    ['/account/payment', 'account-payment'],
    ['/account/password', 'account-password'],
    ['/account/notifications', 'account-notifications'],
    ['/account/health', 'account-health'],
    ['/plans', 'plans-page'],
    ['/checkout', 'checkout-page'],
    ['/visit', 'visit-page'],
    ['/dashboard', 'dashboard-page'],
    ['/home', 'home-authenticated'],
  ];

  for (const [route, label] of accountRoutes) {
    await visitIfNew(page, `${APP_BASE}${route}`, label, visited);
  }

  // ══════════════════════════════════════════════════════════════
  // 5. HARVEST LINKS FROM AUTHENTICATED PAGES AND VISIT NEW ONES
  // ══════════════════════════════════════════════════════════════
  const allDiscoveredLinks = journal.flatMap(e => e.links).filter(l => l.startsWith(APP_BASE));
  const uniqueLinks = [...new Set(allDiscoveredLinks)].filter(l => !visited.has(l));

  console.log(`\n🕸️  Discovered ${uniqueLinks.length} new unique app links — visiting...`);
  for (const link of uniqueLinks.slice(0, 20)) {
    const linkPath = link.replace(APP_BASE, '') || '/';
    const linkLabel = `nav-${linkPath.replace(/\//g, '-').replace(/^-/, '')}`;
    await visitIfNew(page, link, linkLabel, visited);
  }

  // ══════════════════════════════════════════════════════════════
  // 6. SIGN UP / ONBOARDING FLOW (unauthenticated)
  // ══════════════════════════════════════════════════════════════
  const anonContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const anonPage   = await anonContext.newPage();

  await anonPage.goto(`${APP_BASE}/sign-up`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap(anonPage, 'sign-up-page');

  await anonPage.goto(`${MKT_BASE}/quiz`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
  await snap(anonPage, 'quiz-start');

  // Click start / next on quiz
  for (const sel of ['button:has-text("Get Started")', 'button:has-text("Start")', 'button:has-text("Next")', 'button:has-text("Begin")', 'button.primary', 'button.btn-primary']) {
    if (await anonPage.locator(sel).isVisible({ timeout: 2000 }).catch(() => false)) {
      await anonPage.locator(sel).first().click();
      await anonPage.waitForTimeout(1500);
      await snap(anonPage, 'quiz-step-1');
      break;
    }
  }

  await anonContext.close();

  // ══════════════════════════════════════════════════════════════
  // 7. SAVE JOURNAL
  // ══════════════════════════════════════════════════════════════
  const journalPath = path.join(OUT_DIR, '_journal.json');
  fs.writeFileSync(journalPath, JSON.stringify(journal, null, 2));

  await browser.close();

  console.log('\n' + '═'.repeat(60));
  console.log(`✅  Exploration complete — ${journal.length} pages captured`);
  console.log(`    Screenshots : ${OUT_DIR}`);
  console.log(`    Journal     : ${journalPath}`);
  console.log('═'.repeat(60));

  // Print summary
  console.log('\n📋 PAGE INVENTORY:');
  journal.forEach(e => {
    console.log(`\n  [${e.step}]`);
    console.log(`  URL     : ${e.url}`);
    if (e.headings.length) console.log(`  H1-H3   : ${e.headings.join(' | ')}`);
    if (e.testIds.length)  console.log(`  TestIDs : ${e.testIds.join(', ')}`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
