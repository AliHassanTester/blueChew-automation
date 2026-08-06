import { logTestCaseData } from '@utilities/test.helper.utils';
import { getLoginData } from '@data/login/login.data';
import { test } from '@fixtures/page.fixtures';
import { Eyes, Target, Configuration } from '@applitools/eyes-playwright';
import { Page } from '@playwright/test';

export interface EyesFigmaConfig {
  appName: string;
  testName: string;
  viewport: {
    width: number;
    height: number;
  };
  baselineEnvName?: string;
  ignoreDisplacement?: boolean;
}

export const loginPageFigmaConfig: EyesFigmaConfig = {
  appName: 'Login Default',
  testName: 'Log in/Default',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Log in/Default_1440',
  ignoreDisplacement: true,
};

/**
 * Helper function to take a screenshot when the login page loads
 * and upload it to the Applitools Eyes dashboard matching Figma baseline details.
 *
 * @param page - Playwright Page object
 * @param config - Figma Eyes configuration details matching Figma frame/app definitions
 */
export async function uploadLoginPageScreenshotToApplitools(
  page: Page,
  configDetails: EyesFigmaConfig = loginPageFigmaConfig,
): Promise<void> {
  const eyes = new Eyes();
  const config = new Configuration();

  config.setAppName(configDetails.appName);
  config.setTestName(configDetails.testName);
  config.setViewportSize(configDetails.viewport);

  if (configDetails.baselineEnvName) {
    config.setBaselineEnvName(configDetails.baselineEnvName);
  }
  if (configDetails.ignoreDisplacement !== undefined) {
    config.setIgnoreDisplacements(configDetails.ignoreDisplacement);
  }

  eyes.setConfiguration(config);

  try {
    await eyes.open(page);
    await eyes.check(configDetails.testName, Target.window().fully());
    await eyes.close(false);
  } catch (error) {
    await eyes.abort();
    // Log visual diff error instead of halting functional flow if desired, or rethrow if critical
    console.warn('Applitools visual comparison note:', error);
  }
}

const scenario = getLoginData('AQ-02-User-Login');
test.describe('Feature: User Login', () => {
  test(
    `Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags} @visual'
  `,
    async ({ page, loginPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        feature: 'Authentication',
        story: 'User Login',
      });

      await test.step('Navigate to BlueChew login page', async () => {
        await loginPage.navigateToPage(scenario.loginPageDetails);
        await uploadLoginPageScreenshotToApplitools(page);
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

