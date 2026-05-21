// Exhaustive quiz flow capture — waits for full render before each step.
// Run: node scripts/capture-quiz-dom.js
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'dom-snapshots', 'quiz');
fs.mkdirSync(OUT, { recursive: true });

async function saveAll(page, file) {
  try {
    await page.screenshot({ path: path.join(OUT, `${file}.png`), fullPage: true });
    const result = await page.evaluate(() => {
      const allEls = [...document.querySelectorAll('*')].flatMap(el => {
        const rect = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        if (rect.width < 5 || rect.height < 5 || s.display === 'none' || s.visibility === 'hidden') return [];
        const tag = el.tagName.toLowerCase();
        const interestingTags = ['input','select','textarea','button','a','label','h1','h2','h3','h4','p','li','div','span'];
        if (!interestingTags.includes(tag)) return [];
        const text = el.textContent?.trim().replace(/\s+/g,' ').slice(0,80) || '';
        if (!text && !['input','select','textarea'].includes(tag)) return [];
        return [{
          tag,
          id: el.id||null, type: el.getAttribute('type')||null, name: el.getAttribute('name')||null,
          value: el.getAttribute('value')||null, fcn: el.getAttribute('formcontrolname')||null,
          dtid: el.getAttribute('data-test-id')||null, dqa: el.getAttribute('data-qa')||null,
          cls: el.className?.toString().replace(/\s+/g,' ').slice(0,80)||null,
          disabled: el.hasAttribute('disabled'), href: el.getAttribute('href')||null,
          text, html: el.outerHTML.slice(0,350),
        }];
      });
      const bodyText = document.body?.innerText?.replace(/\s+/g,' ').slice(0,3000)||'';
      return { url: location.href, bodyText, elements: allEls };
    });
    fs.writeFileSync(path.join(OUT, `${file}.json`), JSON.stringify(result, null, 2));
    console.log(`  ✓ ${file} — ${result.elements.length} els`);
    console.log(`    body: "${result.bodyText.slice(0,300)}"`);
    // Print interactive elements clearly
    const interactive = result.elements.filter(e =>
      ['input','select','textarea','button','a'].includes(e.tag) ||
      (e.cls && /btn|button|cta|option|choice|card|next|continue/i.test(e.cls))
    );
    if (interactive.length) {
      console.log(`    interactive (${interactive.length}):`);
      interactive.forEach(e => console.log(`      [${e.tag}] type=${e.type} cls="${e.cls?.slice(0,50)}" text="${e.text}" disabled=${e.disabled}`));
    }
    return result;
  } catch(e) { console.log(`  save failed: ${e.message}`); return { elements:[], bodyText:'' }; }
}

async function clickNthEnabledBtnPrimary(page) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const count = await page.locator('button.btn-primary').count();
    for (let i = 0; i < count; i++) {
      const btn = page.locator('button.btn-primary').nth(i);
      const vis = await btn.isVisible().catch(() => false);
      const dis = await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
      if (vis && !dis) {
        await btn.click(); await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(1500);
        return;
      }
    }
    await page.waitForTimeout(200);
  }
  throw new Error('No enabled btn-primary');
}

async function completeRegistration(page) {
  const email = `aliQA.quiz.${Date.now()}@example.com`;
  console.log(`  email: ${email}`);
  await page.goto('https://dev.app.bluechew.com/dev-login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector("input[formcontrolname='password']");
  await page.fill("input[formcontrolname='password']", 'dev');
  await page.locator("//button[normalize-space()='Submit']").click();
  await page.waitForLoadState('networkidle');
  await page.goto('https://dev.app.bluechew.com/register', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector("select[formcontrolname='state']");
  await page.selectOption("select[formcontrolname='state']", { label: 'Illinois' });
  await page.locator('#agree_terms').check(); await page.waitForTimeout(400);
  await clickNthEnabledBtnPrimary(page);
  await page.waitForFunction(() => { const i = document.querySelector("input[formcontrolname='email']"); return i && window.getComputedStyle(i).display!=='none' && i.getBoundingClientRect().width>0; }, {timeout:10000});
  await page.fill("input[formcontrolname='email']", email);
  await page.locator("input[formcontrolname='email']").press('Tab'); await page.waitForTimeout(400);
  await clickNthEnabledBtnPrimary(page);
  await page.waitForFunction(() => { const i = document.querySelector("input[formcontrolname='pass']"); return i && window.getComputedStyle(i).display!=='none' && i.getBoundingClientRect().width>0; }, {timeout:10000});
  await page.fill("input[formcontrolname='pass']", 'certa@123');
  await page.locator("input[formcontrolname='pass']").press('Tab'); await page.waitForTimeout(400);
  await clickNthEnabledBtnPrimary(page);
  await page.waitForURL(/dev\.bluechew\.com\/quiz/, { timeout:30000 });
  console.log(`  ✓ quiz: ${page.url()}`);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);

  console.log('=== REGISTERING ===');
  await completeRegistration(page);

  // Wait for quiz to fully render — look for any clickable element beyond the logo
  console.log('\n=== WAITING FOR QUIZ TO RENDER ===');
  await page.waitForFunction(() => {
    const btns = [...document.querySelectorAll('button,a')].filter(el => {
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      const text = el.textContent?.trim() || '';
      return r.width > 10 && s.display !== 'none' && text.length > 2 && !el.hasAttribute('aria-hidden');
    });
    return btns.length > 1; // more than just the logo button
  }, { timeout: 20000 });

  let step = 1;
  let prevURL = '';
  let stuckCount = 0;

  while (step <= 20) {
    const url = page.url();
    console.log(`\n=== QUIZ STEP ${step} === ${url}`);
    await page.waitForTimeout(1000); // let Angular/React settle
    const snapshot = await saveAll(page, `Q${String(step).padStart(2,'0')}`);

    // Decide what to do based on visible elements
    const els = snapshot.elements;
    const radios     = els.filter(e => e.type === 'radio');
    const checkboxes = els.filter(e => e.type === 'checkbox');
    const selects    = els.filter(e => e.tag === 'select');
    const textInputs = els.filter(e => e.tag === 'input' && !['radio','checkbox','hidden','submit','button'].includes(e.type||''));
    const buttons    = els.filter(e => e.tag === 'button' && !e.disabled && e.text);
    const links      = els.filter(e => e.tag === 'a' && e.text && e.href);

    // Select first radio
    if (radios.length > 0) {
      const names = [...new Set(radios.map(r => r.name).filter(Boolean))];
      for (const name of names) {
        const loc = page.locator(`input[type="radio"][name="${name}"]`).first();
        await loc.check().catch(() => {});
        const val = radios.find(r => r.name===name)?.value || '?';
        console.log(`  ✓ radio[name="${name}"] = first option "${val}"`);
      }
      // Also try first radio by index if no name
      if (!names.length) {
        await page.locator('input[type="radio"]').first().check().catch(() => {});
        console.log(`  ✓ checked first radio (no name attr)`);
      }
      await page.waitForTimeout(300);
    }

    // Check first checkbox
    if (checkboxes.length > 0) {
      await page.locator('input[type="checkbox"]').first().check().catch(() => {});
      console.log(`  ✓ checked first checkbox`);
      await page.waitForTimeout(300);
    }

    // Fill selects
    for (const sel of selects) {
      const loc = sel.fcn ? page.locator(`select[formcontrolname="${sel.fcn}"]`).first()
                : sel.name ? page.locator(`select[name="${sel.name}"]`).first()
                : sel.id ? page.locator(`#${sel.id}`).first()
                : page.locator('select').first();
      await loc.selectOption({ index: 1 }).catch(() => {});
      console.log(`  ✓ select filled`);
      await page.waitForTimeout(200);
    }

    // Fill text inputs
    for (const inp of textInputs) {
      const loc = inp.id ? page.locator(`#${inp.id}`).first()
                : inp.name ? page.locator(`input[name="${inp.name}"]`).first()
                : inp.fcn ? page.locator(`input[formcontrolname="${inp.fcn}"]`).first()
                : page.locator('input:visible').first();
      const vis = await loc.isVisible().catch(() => false);
      if (!vis) continue;
      const val = inp.type==='number' ? '5' : inp.type==='tel' ? '3125550100' : 'TestValue';
      await loc.fill(val); await loc.press('Tab');
      console.log(`  ✓ input filled: "${val}"`);
      await page.waitForTimeout(200);
    }

    // Click the most appropriate advance button
    const ADVANCE_TEXTS = ['next','continue','get started','submit','done','see my options','show my plan','find my plan','view plans','get my plan'];
    let advanced = false;

    // First try buttons with known advance text
    for (const btn of buttons) {
      if (ADVANCE_TEXTS.some(t => btn.text?.toLowerCase().includes(t))) {
        const loc = page.locator(`button:has-text("${btn.text?.slice(0,30)}")`).first();
        const vis = await loc.isVisible().catch(() => false);
        const dis = await loc.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
        if (vis && !dis) {
          console.log(`  → clicking button: "${btn.text}"`);
          await loc.click();
          await page.waitForLoadState('domcontentloaded').catch(() => {});
          await page.waitForTimeout(2000);
          advanced = true;
          break;
        }
      }
    }

    // Fallback: first visible+enabled button that's not the logo/menu
    if (!advanced) {
      for (const btn of buttons) {
        if (!btn.text || btn.text.length < 2) continue;
        if (/logo|menu|close|back/i.test(btn.cls||'')) continue;
        const loc = page.locator('button').filter({ hasText: btn.text.slice(0,20) }).first();
        const vis = await loc.isVisible().catch(() => false);
        const dis = await loc.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
        if (vis && !dis) {
          console.log(`  → fallback button: "${btn.text}"`);
          await loc.click();
          await page.waitForLoadState('domcontentloaded').catch(() => {});
          await page.waitForTimeout(2000);
          advanced = true;
          break;
        }
      }
    }

    // Fallback: links with advance text
    if (!advanced) {
      for (const lnk of links) {
        if (ADVANCE_TEXTS.some(t => lnk.text?.toLowerCase().includes(t))) {
          const loc = page.locator(`a:has-text("${lnk.text?.slice(0,30)}")`).first();
          const vis = await loc.isVisible().catch(() => false);
          if (vis) {
            console.log(`  → clicking link: "${lnk.text}"`);
            await loc.click();
            await page.waitForLoadState('domcontentloaded').catch(() => {});
            await page.waitForTimeout(2000);
            advanced = true;
            break;
          }
        }
      }
    }

    if (!advanced) {
      console.log('  ⚠ No advance element found — quiz complete or stuck');
      break;
    }

    const newURL = page.url();
    console.log(`  URL: ${url} → ${newURL}`);

    if (newURL.includes('/plan') || newURL.includes('/checkout') || newURL.includes('/account') ||
        newURL.includes('/treatment') || newURL.includes('/membership') ||
        (!newURL.includes('/quiz') && newURL !== url)) {
      console.log(`  ✅ Quiz done — landed: ${newURL}`);
      await saveAll(page, 'QUIZ-DONE');
      break;
    }

    if (newURL === prevURL) {
      if (++stuckCount > 2) { console.log('  ⚠ Stuck — aborting'); break; }
    } else { stuckCount = 0; prevURL = newURL; }

    step++;
  }

  await page.waitForTimeout(2000);
  await saveAll(page, 'FINAL');
  console.log(`\n✅ Final URL: ${page.url()}`);
  await browser.close();
})();
