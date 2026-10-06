import { logTestCaseData } from '@utilities/test.helper.utils';
import { getLoginData } from '@data/login/login.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getLoginData('AQ-02-User-Login');

test.describe('Feature: User Login - Visual & Design System Verification', () => {
  test(
    `Test case: 'LOG-VISUAL-001-Visual-Design-Contract'
    Description: 'Comprehensive Visual & Design Verification: Macro/Component Pixelmatch and Computed Design Tokens'
    Tags: '@visual @regression @login @design-system'
  `,
    { tag: ['@visual', '@login', '@design-system'] },
    async ({ loginPage }) => {
      await logTestCaseData(test.info(), {
        testCase: 'LOG-VISUAL-001',
        testDescription: 'Visual & Design System Verification: Pixelmatch & Computed Design Tokens',
        testSummary: 'Comprehensive Visual Verification: Macro Pixelmatch and Computed Design Tokens',
        tags: '@visual @login @design-system',
      }, {
        feature: 'Design System',
        story: 'Visual & Design Verification Architecture',
      });

      // ── 1. Navigate to Target Screen ─────────────────────────────────────────
      await test.step('Navigate to login screen', async () => {
        await loginPage.navigateToPage(scenario.loginPageDetails);
      });

      // ── Layer A: Macro & Component Pixelmatch Snapshots ──────────────────────
      await test.step('Layer A: Full-Page and Component Pixelmatch Snapshots', async () => {
        await loginPage.captureFullPageInitialBaseline('login-page-fullscreen');
        await loginPage.captureLoginCardElementBaseline('login-card-isolated');
      });

      // ── Layer B: Computed Design System Token Snapshots (JSON) ───────────────
      await test.step('Layer B: Assert Computed Design System Tokens (Colors, Typography, Radii)', async () => {
        await loginPage.assertLoginCardDesignTokens('login-card-tokens');
        await loginPage.assertLoginSubmitButtonDesignTokens('login-submit-button-tokens');
      });

      // ── 2. Authenticate & Verify Post-Login State with Dynamic Masking ────────
      await test.step('Authenticate and verify dashboard with dynamic masking', async () => {
        await loginPage.loginWithCredentials(scenario.loginDetails);
        await loginPage.verifySuccessfulLogin(scenario.loginDetails);
        await loginPage.captureDashboardBaselineWithMasking('account-dashboard-masked');
      });
    },
  );
});


