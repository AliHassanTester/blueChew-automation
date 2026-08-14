import { Page } from '@playwright/test';
import { Eyes, Target, Configuration, BatchInfo } from '@applitools/eyes-playwright';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

export type { ApplitoolsVisualConfig };

const batch = new BatchInfo({ name: 'BlueChew Visual Baseline Automation Suite' });

/**
 * Centralized utility to capture visual checkpoints using Applitools Eyes.
 * Runs when APPLITOOLS_API_KEY is present in environment variables.
 */
export async function captureApplitoolsVisualCheckpoint(
  page: Page,
  visualConfigs?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[],
  checkpointTag?: string,
): Promise<void> {
  const apiKey = process.env.APPLITOOLS_API_KEY;
  if (!apiKey) {
    console.log(`[Applitools] APPLITOOLS_API_KEY not set. Skipping visual checkpoint: ${checkpointTag || 'Snapshot'}`);
    return;
  }

  const configs = Array.isArray(visualConfigs) ? visualConfigs : visualConfigs ? [visualConfigs] : [];
  const mainConfig = configs[0];

  const eyes = new Eyes();
  const config = new Configuration();
  config.setApiKey(apiKey);
  config.setBatch(batch);

  if (mainConfig?.appName) config.setAppName(mainConfig.appName);
  if (mainConfig?.testName) config.setTestName(mainConfig.testName);
  if (mainConfig?.viewport) {
    config.setViewportSize({ width: mainConfig.viewport.width, height: mainConfig.viewport.height });
  }

  eyes.setConfiguration(config);

  try {
    await eyes.open(page, mainConfig?.appName || 'BlueChew App', mainConfig?.testName || checkpointTag || 'Visual Checkpoint');
    await eyes.check(checkpointTag || 'Page Snapshot', Target.window().fully());
    await eyes.close(false);
  } catch (error) {
    console.error(`[Applitools] Error capturing checkpoint "${checkpointTag}":`, error);
    await eyes.abortIfNotClosed().catch(() => undefined);
  }
}
