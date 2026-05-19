import { test, expect } from '@playwright/test';
import { getLoginData } from '../../src/data/login/login.data';
import {
  disableAnimations,
  screenshotPage,
  screenshotComponent,
  screenshotAtViewport,
  validateTokens,
  formatViolations,
} from '../../helpers/visual.helper';
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS } from '../../constants/design-tokens.constants';

// All visual specs are pinned to Chromium so cross-browser rendering differences
// never contaminate the PNG baselines.
test.use({ browserName: 'chromium' });

const scenario = getLoginData('AQ-02-User-Login');
const { devGateURL, loginURL } = scenario.loginPageDetails;

/** Pass the dev-login gate and land on /log-in. */
async function passGateAndNavigate(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(devGateURL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!document.querySelector("input[formcontrolname='password']"), { timeout: 15_000 });
  await page.locator("input[formcontrolname='password']").fill(process.env.DEV_GATE_PASSWORD || 'dev');
  await page.locator("//button[normalize-space()='Submit']").click();
  await page.waitForLoadState('domcontentloaded');
  // Now navigate to the real login page
  await page.goto(loginURL, { waitUntil: 'domcontentloaded' });
  // Wait for Angular to render the login form
  await page.waitForFunction(
    () => !!document.querySelector('[data-test-id="sign-in-page"]'),
    { timeout: 15_000 },
  );
  await disableAnimations(page);
}

test.describe('Visual: Login Page (/log-in)', () => {
  test.beforeEach(async ({ page }) => {
    await passGateAndNavigate(page);
  });

  // ── Snapshot tests ──────────────────────────────────────────────────────────

  test('Login page full-viewport snapshot matches baseline', async ({ page }) => {
    await screenshotPage(page, 'login-page-desktop');
  });

  test('Login page on mobile viewport matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'mobile', 'login-page-mobile');
  });

  test('Login page on tablet viewport matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'tablet', 'login-page-tablet');
  });

  test('Login form component snapshot matches baseline', async ({ page }) => {
    // The sign-in-page container wraps the entire form area
    const formLocator = page.locator('[data-test-id="sign-in-page"]');
    await formLocator.waitFor({ state: 'visible' });
    await screenshotComponent(formLocator, 'login-form');
  });

  // ── Design token validation ─────────────────────────────────────────────────

  test('Log In button design tokens are compliant', async ({ page }) => {
    // Button is disabled (and gray) until the form is valid — fill credentials
    // first so Angular enables it and the active-state color token is measurable.
    await page.locator('[data-test-id="sign-in-email-input"]').fill('test@example.com');
    await page.locator('[data-test-id="sign-in-password-input"]').fill('password123');
    const violations = await validateTokens(
      page,
      '[data-test-id="sign-in-submit-button"]',
      {
        color:         COLOR_TOKENS.primaryButtonText,
        'font-weight': TYPOGRAPHY_TOKENS.weightBold,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Email input design tokens are compliant', async ({ page }) => {
    const violations = await validateTokens(
      page,
      '[data-test-id="sign-in-email-input"]',
      {
        'font-size': TYPOGRAPHY_TOKENS.baseFontSize,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Password input design tokens are compliant', async ({ page }) => {
    const violations = await validateTokens(
      page,
      '[data-test-id="sign-in-password-input"]',
      {
        'font-size': TYPOGRAPHY_TOKENS.baseFontSize,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
