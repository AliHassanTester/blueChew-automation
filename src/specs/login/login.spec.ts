import { logTestCaseData } from '@utilities/test.helper.utils';
import { getLoginData } from '@data/login/login.data';
import { test } from '@fixtures/page.fixtures';
import {
  LOGIN_DESKTOP_FIGMA_CONFIG,
  LOGIN_MOBILE_FIGMA_CONFIG,
  ApplitoolsVisualConfig,
} from '@utilities/applitools.utils';

export type { ApplitoolsVisualConfig as EyesFigmaConfig };
export const loginPageDesktopFigmaConfig = LOGIN_DESKTOP_FIGMA_CONFIG;
export const loginPageMobileFigmaConfig = LOGIN_MOBILE_FIGMA_CONFIG;

const scenario = getLoginData('AQ-02-User-Login');

test.describe('Feature: User Login', () => {
  test(
    `Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags} @visual'
  `,
    async ({ loginPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        feature: 'Authentication',
        story: 'User Login',
      });

      await test.step('Navigate to BlueChew login page', async () => {
        await loginPage.navigateToPage(scenario.loginPageDetails);
        await loginPage.captureLoginPageSnapshot();
      });

      await test.step('Log in with registered credentials', async () => {
        await loginPage.loginWithCredentials(scenario.loginDetails);
      });

      await test.step('Open the navigation menu and verify the main links', async () => {
        await loginPage.verifyNavLinksVisible();
      });

      await test.step('Verify successful login — account page rendered', async () => {
        await loginPage.verifySuccessfulLogin();
      });
    },
  );
});
