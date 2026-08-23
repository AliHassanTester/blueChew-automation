import { test } from '@fixtures/page.fixtures';
import { logTestCaseData } from '@utilities/test.helper.utils';
import {
  LOGIN_INITIAL_FIGMA_CONFIGS,
  LOGIN_CREDENTIALS_ENTERED_FIGMA_CONFIGS,
  LOGIN_ERROR_FIGMA_CONFIGS,
  LOGIN_FORGOT_PASSWORD_FIGMA_CONFIGS,
} from '@data/visual/figma.visual.data';

const allureMeta = { feature: 'Authentication', story: 'Login Page Visual Verification' };

test.describe('Feature: Login Page Visual Verification', () => {
  test.only(
    'Test case: LOG-VISUAL-001 - Login Page Visual Flow (6 Checkpoints)',
    async ({ loginPage, page }) => {
      await logTestCaseData(
        test.info(),
        {
          testCase: 'LOG-VISUAL-001',
          testSummary: 'Login Page Visual Verification',
          testDescription: 'Sequentially verify 6 distinct visual states of the Login flow using Applitools and Percy across Desktop & Mobile.',
          tags: '@visual @login',
        },
        allureMeta,
      );

      // ── Step 1: Initial Login Page Loaded ──────────────────────────────────────
      await test.step('Step 1: Land on Login Page & Capture Initial State', async () => {
        await page.goto('/log-in');
        await page.waitForLoadState('load');
        await loginPage.captureVisualCheckpoint('01 - Login Page Initial State', LOGIN_INITIAL_FIGMA_CONFIGS);
      });

      // ── Step 2: Enter Username & Password (Continue Enabled) ───────────────────
      await test.step('Step 2: Enter Username & Password (Continue Enabled)', async () => {
        await loginPage.fillLoginCredentials({ username: 'patient@bluechew.com', password: 'Password123!' });
        await page.waitForLoadState('load');
        await loginPage.captureVisualCheckpoint('02 - Credentials Entered and Submit Enabled', LOGIN_CREDENTIALS_ENTERED_FIGMA_CONFIGS);
      });

      // ── Step 3: Enter Invalid Email Validation Error ───────────────────────────
      await test.step('Step 3: Enter Invalid Email & Capture Validation Error', async () => {
        await loginPage.fillLoginCredentials({ username: 'invalid-email-format', password: 'Password123!' });
        await loginPage.submitLogin().catch(() => undefined);
        await page.waitForLoadState('load');
        await loginPage.captureVisualCheckpoint('03 - Invalid Email Validation Error', LOGIN_ERROR_FIGMA_CONFIGS);
      });

      // ── Step 4: Enter Invalid Password Authentication Error ────────────────────
      await test.step('Step 4: Enter Invalid Password & Capture Authentication Error', async () => {
        await loginPage.fillLoginCredentials({ username: 'patient@bluechew.com', password: 'WrongPassword999!' });
        await loginPage.submitLogin().catch(() => undefined);
        await page.waitForLoadState('load');
        await loginPage.captureVisualCheckpoint('04 - Invalid Password Authentication Error', LOGIN_ERROR_FIGMA_CONFIGS);
      });

      // ── Step 5: Click Forgot Password & Load Forgot Password Page ─────────────
      await test.step('Step 5: Click Forgot Password & Capture Forgot Password Page State', async () => {
        await loginPage.clickForgotPasswordLink();
        await page.waitForLoadState('load');
        await loginPage.captureVisualCheckpoint('05 - Forgot Password Page Initial State', LOGIN_FORGOT_PASSWORD_FIGMA_CONFIGS);
      });
    },
  );
});
