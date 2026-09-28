import { logTestCaseData } from '@utilities/test.helper.utils';
import { getLoginData } from '@data/login/login.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getLoginData('AQ-02-User-Login');

test.describe('Feature: User Login - 3-Layer Visual & Design System Verification', () => {
  test(
    `Test case: 'LOG-VISUAL-001-Three-Layer-Design-Contract'
    Description: 'Comprehensive 3-Layer Visual Verification: Macro Pixelmatch, Computed Design Tokens, and ARIA Contract'
    Tags: '@visual @regression @login @design-system'
  `,
    { tag: ['@visual', '@login', '@design-system'] },
    async ({ loginPage, visual }) => {
      await logTestCaseData(test.info(), {
        testCase: 'LOG-VISUAL-001',
        testDescription: '3-Layer Visual Verification: Pixelmatch, Design Tokens & ARIA Contract',
        testSummary: 'Comprehensive 3-Layer Visual Verification: Macro Pixelmatch, Computed Design Tokens, and ARIA Contract',
        tags: '@visual @login @design-system',
      }, {
        feature: 'Design System',
        story: '3-Layer Visual Architecture',
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

      // ── Layer C: Semantic / ARIA Accessibility Tree Contract ─────────────────
      await test.step('Layer C: Assert Semantic ARIA Tree Contract & Role Hierarchy', async () => {
        await loginPage.assertLoginCardAriaContract();
      });

      // ── 2. Authenticate & Verify Post-Login State with Dynamic Masking ────────
      await test.step('Authenticate and verify dashboard with dynamic masking', async () => {
        await loginPage.loginWithCredentials(scenario.loginDetails);
        await loginPage.verifySuccessfulLogin();
        await loginPage.captureDashboardBaselineWithMasking('account-dashboard-masked');
      });
    },
  );
});

