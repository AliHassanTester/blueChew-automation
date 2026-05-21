import { test, expect } from '@playwright/test';
import { getRegistrationData } from '../../src/data/login/registration.data';
import {
  disableAnimations,
  screenshotPage,
  screenshotComponent,
  screenshotAtViewport,
  validateTokens,
  formatViolations,
} from '../../helpers/visual.helper';
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS } from '../../constants/design-tokens.constants';

test.use({ browserName: 'chromium' });

const scenario = getRegistrationData('AQ-01-User-Registration');
const { devGateURL, registrationURL } = scenario.registrationDetails;

/** Pass the dev-login gate and land on /register (step 1 — state & terms). */
async function navigateToRegisterStep1(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(devGateURL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector("input[formcontrolname='password']"), { timeout: 15_000 });
  await page.locator("input[formcontrolname='password']").fill(process.env.DEV_GATE_PASSWORD || 'dev');
  await page.locator("//button[normalize-space()='Submit']").click();
  await page.waitForLoadState('domcontentloaded');
  await page.goto(registrationURL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => !!document.querySelector("select[formcontrolname='state']"),
    { timeout: 15_000 },
  );
  await disableAnimations(page);
}

test.describe('Visual: Registration Page (/register)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToRegisterStep1(page);
  });

  // ── Snapshot tests ───────────────────────────────────────────────────────────

  test('Registration step 1 full-viewport snapshot matches baseline', async ({ page }) => {
    await screenshotPage(page, 'registration-step1-desktop');
  });

  test('Registration step 1 on mobile viewport matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'mobile', 'registration-step1-mobile');
  });

  test('Registration step 1 on tablet viewport matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'tablet', 'registration-step1-tablet');
  });

  test('Registration step 1 form component snapshot matches baseline', async ({ page }) => {
    const formLocator = page.locator('form').first();
    await formLocator.waitFor({ state: 'visible' });
    await screenshotComponent(formLocator, 'registration-step1-form');
  });

  // ── Design token validation ──────────────────────────────────────────────────

  test('CONTINUE button design tokens are compliant (step 1 enabled after state + terms)', async ({ page }) => {
    // Enable the button by filling state + checking terms
    await page.selectOption("select[formcontrolname='state']", { label: 'Illinois' });
    await page.locator('#agree_terms').check();
    const violations = await validateTokens(
      page,
      'button.btn-primary:not([disabled])',
      {
        color: COLOR_TOKENS.primaryButtonText,
        'font-weight': TYPOGRAPHY_TOKENS.weightBold,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
