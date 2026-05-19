import { test, expect } from '@playwright/test';
import { RegistrationPage } from '../../src/page/login/registration.page';
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

// All visual specs are pinned to Chromium so cross-browser rendering differences
// never contaminate the PNG baselines.
test.use({ browserName: 'chromium' });

const scenario = getRegistrationData('AQ-01-User-Registration');

test.describe('Visual: Registration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(scenario.registrationDetails.mainURL);
    await page.waitForLoadState('domcontentloaded');
    await disableAnimations(page);
  });

  test('Registration page full-viewport snapshot matches baseline', async ({ page }) => {
    await screenshotPage(page, 'registration-page-desktop');
  });

  test('Registration page on mobile viewport matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'mobile', 'registration-page-mobile');
  });

  test('Registration page on tablet viewport matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'tablet', 'registration-page-tablet');
  });

  test('Registration form component snapshot matches baseline', async ({ page }) => {
    const formLocator = page.locator('form').first();
    await formLocator.waitFor({ state: 'visible' });
    await screenshotComponent(formLocator, 'registration-form');
  });

  test('Submit button design tokens are compliant', async ({ page }) => {
    const violations = await validateTokens(page, 'button[type="submit"]', {
      color: COLOR_TOKENS.primaryButtonText,
      'font-weight': TYPOGRAPHY_TOKENS.weightBold,
    });
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Email input design tokens are compliant', async ({ page }) => {
    const violations = await validateTokens(page, "input[type='email']", {
      'font-size': TYPOGRAPHY_TOKENS.baseFontSize,
      'border-radius': TYPOGRAPHY_TOKENS.weightRegular,
    });
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Registration page heading typography tokens are compliant', async ({ page }) => {
    const registrationPage = new RegistrationPage(page, test.info());
    void registrationPage; // RegistrationPage exposes .page for token helpers when needed

    const headingSelector =
      "h1:is(:has-text('Create'), :has-text('Sign Up'), :has-text('Register'), :has-text('Get Started'))";

    const violations = await validateTokens(page, headingSelector, {
      color: COLOR_TOKENS.headingText,
      'font-weight': TYPOGRAPHY_TOKENS.weightBold,
    });
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
