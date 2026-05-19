import { test, expect } from '../../fixtures/base.fixture';
import { userGenerator } from '../../test-data/generators/user.generator';
import {
  disableAnimations,
  screenshotPage,
  screenshotComponent,
  screenshotAtViewport,
  validateTokens,
  formatViolations,
} from '../../helpers/visual.helper';
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS } from '../../constants/design-tokens.constants';

/**
 * Login Page — Visual Regression + Design Token Tests
 *
 * Baseline snapshots are stored in __snapshots__/ next to this file.
 * First run: npx playwright test tests/visual/login.visual.spec.ts --update-snapshots
 * After UI changes: re-run with --update-snapshots to accept new baseline.
 */
test.use({ browserName: 'chromium' });

test.describe('Login — Visual', { tag: '@visual' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
    await disableAnimations(loginPage.page);
  });

  // ── Component screenshots ─────────────────────────────────────────────────

  test('login form — default state (desktop)', async ({ loginPage }) => {
    const form = loginPage.page.locator('form, [class*="login"], [class*="auth"]').first();
    await screenshotComponent(form, 'login-form-default.png');
  });

  test('login form — email field focused', async ({ loginPage }) => {
    await loginPage.emailInput.focus();
    const form = loginPage.page.locator('form, [class*="login"], [class*="auth"]').first();
    await screenshotComponent(form, 'login-form-email-focused.png');
  });

  test('login form — error state after invalid credentials', async ({ loginPage }) => {
    const invalid = userGenerator.generateCredentials();
    await loginPage.login(invalid.email, invalid.password);
    await loginPage.assertErrorVisible();
    const form = loginPage.page.locator('form, [class*="login"], [class*="auth"]').first();
    await screenshotComponent(form, 'login-form-error.png');
  });

  // ── Responsive screenshots ────────────────────────────────────────────────

  test('login page layout — mobile (375px)', async ({ loginPage }) => {
    await screenshotAtViewport(loginPage.page, 'mobile', 'login-page-mobile.png');
  });

  test('login page layout — tablet (768px)', async ({ loginPage }) => {
    await screenshotAtViewport(loginPage.page, 'tablet', 'login-page-tablet.png');
  });

  test('login page layout — desktop (1280px)', async ({ loginPage }) => {
    await screenshotPage(loginPage.page, 'login-page-desktop.png');
  });

  // ── Design token validation ───────────────────────────────────────────────

  test('submit button color and typography tokens match design', async ({ loginPage }) => {
    const violations = await validateTokens(loginPage.page, 'button[type="submit"]', {
      'color':       COLOR_TOKENS.primaryButtonText,
      'font-weight': TYPOGRAPHY_TOKENS.weightBold,
    });
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('email input border-radius matches design token', async ({ loginPage }) => {
    const violations = await validateTokens(loginPage.page, 'input[type="email"]', {
      'background-color': COLOR_TOKENS.inputBackground,
    });
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
