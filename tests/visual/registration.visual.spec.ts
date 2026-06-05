import { test, expect } from '@playwright/test';
import { getRegistrationData } from '../../src/data/login/registration.data';
import {
  disableAnimations,
  screenshotAtViewport,
  screenshotComponent,
  validateTokens,
  formatViolations,
} from '../../helpers/visual.helper';
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS } from '../../constants/design-tokens.constants';

test.use({ browserName: 'chromium' });

const scenario = getRegistrationData('AQ-01-Sign-up-To-Approved-Order-E2E');
const { devGateURL, registrationURL } = scenario.registrationDetails;

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

  test('Registration step 1 — iPhone X snapshot matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'iphone-x', 'registration-step1-iphone-x');
  });

  test('Registration step 1 — desktop 1440p snapshot matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'desktop-1440', 'registration-step1-desktop-1440');
  });

  test('Registration step 1 form component snapshot matches baseline', async ({ page }) => {
    const formLocator = page.locator('form').first();
    await formLocator.waitFor({ state: 'visible' });
    await screenshotComponent(formLocator, 'registration-step1-form');
  });

  // ── Design token validation ──────────────────────────────────────────────────

  test('CONTINUE button design tokens are compliant (step 1 enabled after state + terms)', async ({ page }) => {
    await page.selectOption("select[formcontrolname='state']", { label: 'New York' });
    await page.locator('#agree_terms').check();
    const violations = await validateTokens(
      page,
      'button.btn-primary:not([disabled])',
      {
        color:         COLOR_TOKENS.primaryButtonText,
        'font-weight': TYPOGRAPHY_TOKENS.weightBold,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
