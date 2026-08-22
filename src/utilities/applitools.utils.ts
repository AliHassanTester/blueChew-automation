import { Page } from '@playwright/test';
import { Eyes, Target, Configuration, BatchInfo } from '@applitools/eyes-playwright';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import * as dotenv from 'dotenv';

export type { ApplitoolsVisualConfig };

const envType = process.env.ENV_TYPE || 'dev';
dotenv.config({ path: `.env.${envType}` });

const DEFAULT_BATCH_NAME = 'BlueChew 4.0 - Dev Handoff - Stepped out Medical intake';
const batch = new BatchInfo({ name: DEFAULT_BATCH_NAME });

function resolveVisualConfigForPage(
  page: Page,
  visualConfigs?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[],
): ApplitoolsVisualConfig | undefined {
  const configs = Array.isArray(visualConfigs) ? visualConfigs : visualConfigs ? [visualConfigs] : [];
  if (!configs.length) return undefined;
  const vp = page.viewportSize();
  if (!vp) return configs[0];

  // 1. Exact match (width & height)
  const exact = configs.find((c) => c.viewport.width === vp.width && c.viewport.height === vp.height);
  if (exact) return exact;

  // 2. Exact width match (height may vary due to browser bars)
  const exactWidth = configs.find((c) => c.viewport.width === vp.width);
  if (exactWidth) return exactWidth;

  // 3. Mobile (width <= 768) vs Desktop (width > 768) match
  const isMobileViewport = vp.width <= 768;
  const categorized = configs.find((c) => (isMobileViewport ? c.viewport.width <= 768 : c.viewport.width > 768));
  if (categorized) return categorized;

  // 4. Closest width match fallback
  return [...configs].sort((a, b) => Math.abs(a.viewport.width - vp.width) - Math.abs(b.viewport.width - vp.width))[0];
}

/**
 * Centralized utility to capture visual checkpoints using Applitools Eyes.
 */
export async function captureApplitoolsVisualCheckpoint(
  page: Page,
  visualConfigs?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[],
  checkpointTag: string = 'Page Snapshot',
): Promise<void> {
  const apiKey = process.env.APPLITOOLS_API_KEY || process.env.APPLI_API_KEY;
  if (!apiKey) {
    console.log(`[Applitools] APPLITOOLS_API_KEY not set. Skipping: ${checkpointTag}`);
    return;
  }

  const mainConfig = resolveVisualConfigForPage(page, visualConfigs);
  const eyes = new Eyes();
  const config = new Configuration().setApiKey(apiKey).setBatch(batch);

  if (mainConfig?.appName) config.setAppName(mainConfig.appName);
  if (mainConfig?.testName) config.setTestName(mainConfig.testName);
  if (mainConfig?.viewport) config.setViewportSize(mainConfig.viewport);
  if (mainConfig?.baselineEnvName) config.setBaselineEnvName(mainConfig.baselineEnvName);
  const ignoreDisp = mainConfig?.ignoreDisplacement ?? mainConfig?.ignoreDisplacements;
  if (typeof ignoreDisp === 'boolean') config.setIgnoreDisplacements(ignoreDisp);
  if (mainConfig?.branchName) config.setBranchName(mainConfig.branchName);
  if (mainConfig?.parentBranchName) config.setParentBranchName(mainConfig.parentBranchName);

  eyes.setConfiguration(config);

  try {
    console.log(`[Applitools] Capturing "${checkpointTag}" (app="${mainConfig?.appName || 'BlueChew App'}", test="${mainConfig?.testName || checkpointTag}")...`);
    await eyes.open(page, mainConfig?.appName || 'BlueChew App', mainConfig?.testName || checkpointTag);
    await eyes.check(checkpointTag, Target.window().fully());
    await eyes.close(false);
    console.log(`[Applitools] Snapshot successfully captured for "${checkpointTag}".`);
  } catch (error) {
    console.error(`[Applitools] Error capturing "${checkpointTag}":`, error);
    await eyes.abortIfNotClosed().catch(() => undefined);
  }
}
