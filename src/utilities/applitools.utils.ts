import { Page } from '@playwright/test';
import { Eyes, Target, Configuration, BatchInfo } from '@applitools/eyes-playwright';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import * as dotenv from 'dotenv';

export type { ApplitoolsVisualConfig };

// Ensure environment variables from .env.dev are loaded even if process.env wasn't populated yet
const envType = process.env.ENV_TYPE || 'dev';
dotenv.config({ path: `.env.${envType}` });

const DEFAULT_BATCH_NAME = 'BlueChew 4.0 - Dev Handoff - Stepped out Medical intake';
const batch = new BatchInfo({ name: DEFAULT_BATCH_NAME });

/**
 * Centralized utility to capture visual checkpoints using Applitools Eyes.
 * Configures Applitools Eyes to match against Figma baselines by aligning:
 * - App Name & Test Name
 * - Viewport dimensions
 * - Baseline Environment Name
 * - Displacements & Branching
 */
export async function captureApplitoolsVisualCheckpoint(
  page: Page,
  visualConfigs?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[],
  checkpointTag?: string,
): Promise<void> {
  const apiKey = process.env.APPLITOOLS_API_KEY || process.env.APPLI_API_KEY;
  if (!apiKey) {
    console.log(`[Applitools] APPLITOOLS_API_KEY not set in process.env. Skipping visual checkpoint: ${checkpointTag || 'Snapshot'}`);
    return;
  }

  console.log(`[Applitools] Starting visual capture for "${checkpointTag || 'Snapshot'}" with API Key: ${apiKey.substring(0, 6)}...`);

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
  if (mainConfig?.baselineEnvName) {
    config.setBaselineEnvName(mainConfig.baselineEnvName);
  }
  const ignoreDisp = mainConfig?.ignoreDisplacement ?? mainConfig?.ignoreDisplacements;
  if (typeof ignoreDisp === 'boolean') {
    config.setIgnoreDisplacements(ignoreDisp);
  }
  if (mainConfig?.branchName) {
    config.setBranchName(mainConfig.branchName);
  }
  if (mainConfig?.parentBranchName) {
    config.setParentBranchName(mainConfig.parentBranchName);
  }

  eyes.setConfiguration(config);

  try {
    console.log(
      `[Applitools] Opening Eyes session for app="${mainConfig?.appName}", test="${mainConfig?.testName}", env="${mainConfig?.baselineEnvName || 'default'}"...`,
    );
    await eyes.open(page, mainConfig?.appName || 'BlueChew App', mainConfig?.testName || checkpointTag || 'Visual Checkpoint');
    console.log(`[Applitools] Capturing snapshot "${checkpointTag}"...`);
    await eyes.check(checkpointTag || 'Page Snapshot', Target.window().fully());
    console.log(`[Applitools] Snapshot captured successfully! Closing session...`);
    await eyes.close(false);
    console.log(`[Applitools] Eyes session closed cleanly for "${checkpointTag}".`);
  } catch (error) {
    console.error(`[Applitools] Error capturing checkpoint "${checkpointTag}":`, error);
    await eyes.abortIfNotClosed().catch(() => undefined);
  }
}
