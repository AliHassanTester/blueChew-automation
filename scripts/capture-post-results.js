// Captures everything after clicking TRY GOLD on the results page.
// Run: node scripts/capture-post-results.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'dom-snapshots', 'post-results');
fs.mkdirSync(OUT, { recursive: true });

let stepNum = 0;
async function capture(page, label) {
  stepNum++;
  const file = `${String(stepNum).padStart(2,'0')}-${label}`;
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
      return [{ tag, id: el.id||null, dtid: el.getAttribute('data-test-id'), fcn: el.getAttribute('formcontrolname'), cls: el.className?.toString().replace(/\s+/g,' ').slice(0,80)||null, text, disabled: el.hasAttribute('disabled'), html: el.outerHTML.slice(0,400) }];
    });
    return { url: location.href, bodyText: document.body?.innerText?.replace(/\s+/g,' ').slice(0,2000)||'', elements: allEls };
  });
  fs.writeFileSync(path.join(OUT, `${file}.json`), JSON.stringify(data, null, 2));
  console.log(`\n=== [${file}] ===`);
  console.log(`  URL: ${data.url}`);
  console.log(`  Body: "${data.bodyText.slice(0,300)}"`);
  const dtids = data.elements.filter(e => e.dtid).map(e => `  [${e.dtid}] "${e.text.slice(0,80)}"`);
  if (dtids.length) { console.log(`  data-test-ids:\n${dtids.join('\n')}`); }
  const btns = data.elements.filter(e => e.tag === 'button' && e.text && !e.disabled);
  if (btns.length) { console.log(`  enabled buttons:\n${btns.slice(0,10).map(b => `    cls="${b.cls?.slice(0,50)}" text="${b.text.slice(0,60)}"`).join('\n')}`); }
  const inputs = data.elements.filter(e => ['input','select','textarea'].includes(e.tag));
  if (inputs.length) { console.log(`  inputs:\n${inputs.slice(0,10).map(i => `    [${i.tag}] fcn="${i.fcn}" type="${i.tag==='input'?i.html.match(/type="([^"]+)"/)?.[1]:'—'}"`).join('\n')}`); }
  return data;
}

async function clickActiveStepContinue(page) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const count = await page.locator('button.btn-primary').count();
    for (let i = 0; i < count; i++) {
      const btn = page.locator('button.btn-primary').nth(i);
      const vis = await btn.isVisible().catch(() => false);
      const dis = await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
      if (vis && !dis) { await btn.click(); await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(1500); return; }
    }
    await page.waitForTimeout(200);
  }
  throw new Error('No enabled btn-primary');
}

async function register(page) {
  const email = `aliQA.pr.${Date.now()}@example.com`;
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
  console.log('  ✓ on quiz');
}

async function completeQuiz(page) {
  const hasAnswers = await page.waitForSelector('[data-test-id="quiz-answer-0"]', { timeout: 5000 }).then(() => true).catch(() => false);
  if (!hasAnswers) {
    for (const text of ['Get Started', 'Begin', 'Continue', 'Start', 'Next']) {
      const btn = page.locator(`button:has-text("${text}")`).first();
      if (await btn.isVisible().catch(() => false)) { await btn.click(); break; }
    }
    await page.waitForSelector('[data-test-id="quiz-answer-0"]', { timeout: 20000 });
  }
  for (const [i, ans] of [[0,2],[1,0],[2,1]]) {
    const progress = await page.locator('[data-test-id="quiz-progress-text"]').textContent().catch(() => `${i+1}`);
    console.log(`  Q${i+1} (${progress?.trim()}): clicking quiz-answer-${ans}`);
    await page.locator(`[data-test-id="quiz-answer-${ans}"]`).click();
    if (i < 2) {
      await page.waitForFunction(
        (prev) => { const el = document.querySelector('[data-test-id="quiz-progress-text"]'); return el !== null && el.textContent?.trim() !== prev; },
        progress?.trim(), { timeout: 10000 }
      );
    }
  }
  console.log('  ✓ quiz answered — waiting for /results...');
  await page.waitForURL(/\/results/, { timeout: 20000 });
  console.log(`  ✓ on results: ${page.url()}`);
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
  const tryGoldBtn = page.locator('button.cta-button').first();
  await tryGoldBtn.waitFor({ state: 'visible', timeout: 10000 });
  const prevURL = page.url();
  await tryGoldBtn.click();
  await page.waitForTimeout(1500);

  // Walk up to 10 more steps
  for (let step = 1; step <= 10; step++) {
    const url = page.url();
    const label = url.split('/').pop()?.replace(/[^a-zA-Z0-9-]/g,'') || `step${step}`;
    const data = await capture(page, label);

    const btns = data.elements.filter(e => e.tag === 'button' && e.text && !e.disabled);
    const inputs = data.elements.filter(e => ['input','select','textarea'].includes(e.tag));
    const advanceTexts = ['next','continue','get started','submit','done','see my','show my','find my','view plan','get my','checkout','proceed','confirm','select plan'];

    let advanced = false;

    // Fill visible inputs first
    for (const inp of inputs) {
      const fcn = (inp.fcn || '').toLowerCase();
      const loc = inp.fcn ? page.locator(`[formcontrolname="${inp.fcn}"]`).first() : null;
      if (!loc) continue;
      const vis = await loc.isVisible().catch(() => false);
      if (!vis) continue;
      const tag = inp.tag;
      const inputType = inp.html.match(/type="([^"]+)"/)?.[1] || '';
      if (tag === 'select') {
        await loc.selectOption({ index: 1 }).catch(() => {});
        console.log(`  ✓ select[${inp.fcn}] filled`);
      } else if (inputType === 'checkbox') {
        await loc.check().catch(() => {});
        console.log(`  ✓ checkbox[${inp.fcn}] checked`);
      } else if (inputType !== 'radio' && inputType !== 'hidden') {
        const val = fcn.includes('email') ? `aliQA.fill.${Date.now()}@example.com`
          : fcn.includes('pass') ? 'certa@123'
          : fcn.includes('first') ? 'Ali'
          : fcn.includes('last') ? 'QA'
          : fcn.includes('phone') ? '3125550100'
          : inputType === 'number' ? '5' : 'TestValue';
        await loc.fill(val).catch(() => {});
        await loc.press('Tab').catch(() => {});
        console.log(`  ✓ input[${inp.fcn}] = "${val}"`);
      }
    }
    await page.waitForTimeout(300);

    // Try advance buttons
    for (const btn of btns) {
      if (advanceTexts.some(t => btn.text.toLowerCase().includes(t))) {
        const loc = page.locator('button').filter({ hasText: btn.text.slice(0, 30) }).first();
        if (await loc.isVisible().catch(() => false)) {
          console.log(`  → clicking: "${btn.text.slice(0,50)}"`);
          await loc.click();
          await page.waitForLoadState('domcontentloaded').catch(() => {});
          await page.waitForTimeout(2000);
          advanced = true;
          break;
        }
      }
    }

    if (!advanced) {
      // Try btn-primary
      const bpCount = await page.locator('button.btn-primary').count();
      for (let i = 0; i < bpCount; i++) {
        const btn = page.locator('button.btn-primary').nth(i);
        const vis = await btn.isVisible().catch(() => false);
        const dis = await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
        if (vis && !dis) {
          const txt = (await btn.textContent().catch(() => '')).trim();
          console.log(`  → btn-primary: "${txt}"`);
          await btn.click();
          await page.waitForLoadState('domcontentloaded').catch(() => {});
          await page.waitForTimeout(2000);
          advanced = true;
          break;
        }
      }
    }

    if (!advanced) {
      console.log('  ⚠ No advance element — end of flow or stuck');
      break;
    }

    const newURL = page.url();
    console.log(`  URL: ${url} → ${newURL}`);
    if (newURL === url && step > 1) { console.log('  URL unchanged twice — stopping'); break; }
  }

  await browser.close();
  console.log(`\n✅ Done — dom-snapshots/post-results/`);
})();
