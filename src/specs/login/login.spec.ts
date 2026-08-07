import { logTestCaseData } from '@utilities/test.helper.utils';
import { getLoginData } from '@data/login/login.data';
import { test } from '@fixtures/page.fixtures';
import { Eyes, Target, ClassicRunner, Configuration } from '@applitools/eyes-playwright';
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
 * and upload them to the Applitools Eyes dashboard matching Figma baseline details
 * for both Desktop and Mobile viewports.
 *
 * @param page - Playwright Page object
 * @param customConfigs - Optional explicit Figma Eyes configuration(s)
 */
export async function uploadLoginPageScreenshotToApplitools(
  page: Page,
  customConfigs?: EyesFigmaConfig | EyesFigmaConfig[],
): Promise<void> {
  const apiKey = process.env.APPLITOOLS_API_KEY || process.env.APPLI_API_KEY;
  if (!apiKey) {
    console.warn('[Applitools] APPLITOOLS_API_KEY is not configured in environment. Skipping Applitools upload.');
    return;
  }

  const initialViewport = page.viewportSize();
  const projectName = test.info().project.name.toLowerCase();
  const isMobileProject = projectName.includes('mobile') || (initialViewport ? initialViewport.width < 768 : false);

  const configsToRun: EyesFigmaConfig[] = customConfigs
    ? Array.isArray(customConfigs)
      ? customConfigs
      : [customConfigs]
    : isMobileProject
      ? [loginPageMobileFigmaConfig]
      : [loginPageDesktopFigmaConfig, loginPageMobileFigmaConfig];

  for (const configDetails of configsToRun) {
    const runner = new ClassicRunner();
    const eyes = new Eyes(runner);
    const config = new Configuration();

    config.setApiKey(apiKey);
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
      await page.setViewportSize(configDetails.viewport);
      await page.waitForTimeout(500); // Allow layout to settle

      await eyes.open(page);
      await eyes.check(`Login Page - ${configDetails.viewport.width}x${configDetails.viewport.height}`, Target.window().fully());
      await eyes.close(false);
    } catch (error) {
      await eyes.abortIfNotClosed().catch(() => undefined);
      console.warn(
        `Applitools visual comparison note (${configDetails.viewport.width}x${configDetails.viewport.height}):`,
        error,
      );
    } finally {
      await runner.getAllTestResults(false).catch(() => undefined);
    }
  }

  // Restore initial page viewport so remaining functional test steps complete smoothly
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
