import { test } from '@fixtures/page.fixtures';
import { logTestCaseData } from '@utilities/test.helper.utils';
import { getLoginData } from '@data/login/login.data';

const allureMeta = { feature: 'Authentication', story: 'Playwright Native Login Page Visual Verification' };

/**
 * Feature: Login Page Visual Regression Verification (Native Playwright)
 * 
 * Demonstrates:
 * 1. Full-page vs. Element-level screenshot captures.
 * 2. Neutralization of animations & loaders via injected CSS (visual-snapshot.css).
 * 3. Dynamic content masking (user emails, tokens, timers).
 * 4. Tolerance management (maxDiffPixelRatio & threshold).
 */
test.describe('Feature: Native Playwright Visual Regression - Login Flow', () => {
  const loginData = getLoginData('AQ-02-User-Login');

  test(
    'LOG-VISUAL-DEMO - End-to-End Visual Baselines for Authentication Screen',
    { tag: ['@visual', '@login', '@regression'] },
    async ({ loginPage }, testInfo) => {
      await logTestCaseData(
        testInfo,
        {
          testCase: 'LOG-VISUAL-DEMO',
          testSummary: 'Playwright Native Visual Regression Demo - Login Flow',
          testDescription: 'Captures full-page, component-level, post-login, and validation error visual baselines.',
          tags: '@visual @login @demo',
        },
        allureMeta,
      );

      // ──────────────────────────────────────────────────────────────────────────
      // Checkpoint 1: Initial Empty Login Page State (Full-Page Baseline)
      // Verifies: Top promo banner, BlueChew logo, SSO buttons, form fields, and CTA
      // ──────────────────────────────────────────────────────────────────────────
      await test.step('Checkpoint 1: Initial Empty Login Page (Full-Page Baseline)', async () => {
        await loginPage.navigateToLoginPage(loginData.loginPageDetails.loginURL);
        await loginPage.verifyLoginPageLoaded();

        // Captures full-page screenshot with animation neutralization and caret hiding
        await loginPage.captureFullPageInitialBaseline('01-login-page-initial-full');
      });

      // ──────────────────────────────────────────────────────────────────────────
      // Checkpoint 2: Isolated Login Card Component Baseline (Element-Level)
      // Verifies: Strict pixel layout of the login form container
      // ──────────────────────────────────────────────────────────────────────────
      await test.step('Checkpoint 2: Isolated Login Card Component Baseline', async () => {
        // Captures only the central sign-in card container, ignoring headers/footers
        await loginPage.captureLoginCardElementBaseline('02-login-card-component');
      });

      // ──────────────────────────────────────────────────────────────────────────
      // Checkpoint 3: Validation Error State Visual Comparison
      // Verifies: Visual styling of inline error banners, field borders, and alerts
      // ──────────────────────────────────────────────────────────────────────────
      await test.step('Checkpoint 3: Validation Error State Baseline', async () => {
        await loginPage.fillLoginCredentials({
          username: 'invalid.user@bluechew-test.invalid',
          password: 'WrongPassword123!',
        });
        await loginPage.submitLogin();

        // Wait for error feedback to render
        await loginPage.locators.errorMessageBanner.locator
          .waitFor({ state: 'visible', timeout: 5000 })
          .catch(() => undefined);

        // Capture isolated validation error visual state
        await loginPage.captureValidationErrorBaseline('03-login-validation-error-card');
      });

      // ──────────────────────────────────────────────────────────────────────────
      // Checkpoint 4: Post-Login / Dashboard Landing Baseline (With Masking)
      // Verifies: Authenticated layout while masking dynamic user email & session data
      // ──────────────────────────────────────────────────────────────────────────
      await test.step('Checkpoint 4: Post-Login Dashboard Baseline (Masking Dynamic Data)', async () => {
        // Re-navigate to clean login form and authenticate with valid credentials
        await loginPage.navigateToLoginPage(loginData.loginPageDetails.loginURL);
        await loginPage.fillLoginCredentials(loginData.loginDetails);
        await loginPage.submitLogin();
        await loginPage.verifySuccessfulLogin();

        // Capture dashboard while masking dynamic user account text
        await loginPage.captureDashboardBaselineWithMasking('04-account-dashboard-landing');
      });
    },
  );
});
