import { Page, test } from '@playwright/test';
import { Eyes, Target, ClassicRunner, Configuration } from '@applitools/eyes-playwright';

export interface ApplitoolsVisualConfig {
  appName: string;
  testName: string;
  viewport: {
    width: number;
    height: number;
  };
  baselineEnvName?: string;
  ignoreDisplacement?: boolean;
  ignoreDisplacements?: boolean;
}

export const LOGIN_DESKTOP_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Log in/Default',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Log in/Default_1440',
  ignoreDisplacement: true,
};

export const LOGIN_MOBILE_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Log in/Default',
  viewport: {
    width: 390,
    height: 844,
  },
  baselineEnvName: 'Log in/Default_390',
  ignoreDisplacement: true,
};

export const PRODUCT_MAX_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 9',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Desktop - 9_1440',
  ignoreDisplacement: true,
};

/**
 * Common centralized utility to capture visual checkpoints using Applitools Eyes.
 * Handles configuration, viewport management, session execution, and clean teardown.
 *
 * @param page - Playwright Page object
 * @param customConfigs - Single config or array of configs to capture
 * @param checkpointTag - Optional snapshot tag name
 */
export async function captureApplitoolsVisualCheckpoint(
  page: Page,
  customConfigs?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[],
  checkpointTag?: string,
): Promise<void> {
  const apiKey = process.env.APPLITOOLS_API_KEY || process.env.APPLI_API_KEY;
  if (!apiKey) {
    console.warn('[Applitools] APPLITOOLS_API_KEY is not configured in environment. Skipping Applitools upload.');
    return;
  }

  const initialViewport = page.viewportSize();
  let configsToRun: ApplitoolsVisualConfig[];

  if (customConfigs) {
    configsToRun = Array.isArray(customConfigs) ? customConfigs : [customConfigs];
  } else {
    const testInfo = test.info();
    const projectName = testInfo?.project?.name?.toLowerCase() || '';
    const isMobileProject = projectName.includes('mobile') || (initialViewport ? initialViewport.width < 768 : false);

    configsToRun = isMobileProject ? [LOGIN_MOBILE_FIGMA_CONFIG] : [LOGIN_DESKTOP_FIGMA_CONFIG];
  }

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
    
    const ignoreDisp = configDetails.ignoreDisplacement ?? configDetails.ignoreDisplacements;
    if (ignoreDisp !== undefined) {
      config.setIgnoreDisplacements(ignoreDisp);
    }

    eyes.setConfiguration(config);

    try {
      if (configDetails.viewport) {
        await page.setViewportSize(configDetails.viewport);
        await page.waitForLoadState('load').catch(() => undefined);
      }

      await eyes.open(page);
      const tag = checkpointTag || `${configDetails.testName} - ${configDetails.viewport.width}x${configDetails.viewport.height}`;
      await eyes.check(tag, Target.window().fully());
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

  if (initialViewport) {
    await page.setViewportSize(initialViewport).catch(() => undefined);
  }
}
