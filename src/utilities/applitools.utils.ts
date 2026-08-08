import { Page, test } from '@playwright/test';
import { Eyes, Target, ClassicRunner, Configuration } from '@applitools/eyes-playwright';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

export type { ApplitoolsVisualConfig };

/**
 * Common centralized utility to capture visual checkpoints using Applitools Eyes.
 * Handles configuration, viewport management, session execution, and clean teardown.
 * Contains only execution logic and function definitions (no hardcoded test data).
 *
 * @param page - Playwright Page object
 * @param visualConfigs - Single config or array of configs passed from data files
 * @param checkpointTag - Optional snapshot tag name
 */
export async function captureApplitoolsVisualCheckpoint(
  page: Page,
  visualConfigs?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[],
  checkpointTag?: string,
): Promise<void> {
  const apiKey = process.env.APPLITOOLS_API_KEY || process.env.APPLI_API_KEY;
  if (!apiKey) {
    console.warn('[Applitools] APPLITOOLS_API_KEY is not configured in environment. Skipping Applitools upload.');
    return;
  }

  if (!visualConfigs) {
    console.warn('[Applitools] No visual configuration provided. Skipping Applitools upload.');
    return;
  }

  const initialViewport = page.viewportSize();
  const configsToRun: ApplitoolsVisualConfig[] = Array.isArray(visualConfigs) ? visualConfigs : [visualConfigs];

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
