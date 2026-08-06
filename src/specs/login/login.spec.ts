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

export const loginPageDesktopFigmaConfig: EyesFigmaConfig = {
  appName: 'Login Default',
  testName: 'Log in/Default',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Log in/Default_1440',
  ignoreDisplacement: true,
};

export const loginPageMobileFigmaConfig: EyesFigmaConfig = {
  appName: 'Login Default',
  testName: 'Log in/Default',
  viewport: {
    width: 390,
    height: 844,
  },
  baselineEnvName: 'Log in/Default_390',
  ignoreDisplacement: true,
};

/**
 * Helper function to take screenshots when the login page loads
 * and upload them to the Applitools Eyes dashboard matching Figma baseline details.
 *
 * Automatically detects whether the test is running under mobile or desktop project/viewport context.
 *
 * @param page - Playwright Page object
 * @param customConfigs - Optional explicit Figma Eyes configuration(s) to override auto-detection
 */
export async function uploadLoginPageScreenshotToApplitools(
  page: Page,
  customConfigs?: EyesFigmaConfig | EyesFigmaConfig[],
): Promise<void> {
  const initialViewport = page.viewportSize();
  const projectName = test.info().project.name.toLowerCase();
  const isMobile = projectName.includes('mobile') || (initialViewport ? initialViewport.width < 768 : false);

  const configsToRun: EyesFigmaConfig[] = customConfigs
    ? Array.isArray(customConfigs)
      ? customConfigs
      : [customConfigs]
    : [isMobile ? loginPageMobileFigmaConfig : loginPageDesktopFigmaConfig];

  for (const configDetails of configsToRun) {
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
      console.warn(
        `Applitools visual comparison note (${configDetails.viewport.width}x${configDetails.viewport.height}):`,
        error,
      );
    }
  }

  // Restore appropriate viewport for active project execution (mobile vs desktop)
  if (initialViewport) {
    await page.setViewportSize(initialViewport);
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
