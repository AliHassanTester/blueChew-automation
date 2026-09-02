import { Page } from '@playwright/test';
import { Eyes, Target, Configuration, BatchInfo } from '@applitools/eyes-playwright';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import * as dotenv from 'dotenv';

export type { ApplitoolsVisualConfig };

const envType = process.env.ENV_TYPE || 'dev';
dotenv.config({ path: `.env.${envType}` });

export const DEFAULT_BATCH_NAME = 'BlueChew 4.0 - Dev Handoff - Stepped out Medical intake';
export const batch = new BatchInfo({ name: DEFAULT_BATCH_NAME });

// Persistent Eyes session state at module level
let activeEyes: Eyes | undefined = undefined;
let isEyesOpen = false;
let currentAppName: string | undefined = undefined;
let currentTestName: string | undefined = undefined;

export function resolveVisualConfigForPage(
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
 * Closes the active Eyes session if open.
 */
export async function closeActiveEyes(): Promise<void> {
  if (activeEyes && isEyesOpen) {
    try {
      console.log(`[Applitools] Closing active Eyes session (app="${currentAppName}", test="${currentTestName}")...`);
      await activeEyes.close(false);
      console.log('[Applitools] Eyes session closed successfully.');
    } catch (error) {
      console.error('[Applitools] Error closing Eyes session:', error);
      await activeEyes.abortIfNotClosed().catch(() => undefined);
    } finally {
      isEyesOpen = false;
      currentAppName = undefined;
      currentTestName = undefined;
    }
  }
}

/**
 * Centralized utility to capture visual checkpoints using Applitools Eyes.
 * Switches session dynamically if appName or testName changes, preserving grouping for same-test steps.
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
  const targetAppName = mainConfig?.appName || 'BlueChew App';
  const targetTestName = mainConfig?.testName || checkpointTag;

  // If a session is open for a different test name, close it first
  if (isEyesOpen && (currentAppName !== targetAppName || currentTestName !== targetTestName)) {
    await closeActiveEyes();
  }

  if (!activeEyes) {
    activeEyes = new Eyes();
  }

  if (!isEyesOpen) {
    const config = new Configuration().setApiKey(apiKey).setBatch(batch);

    if (mainConfig?.appName) config.setAppName(mainConfig.appName);
    if (mainConfig?.testName) config.setTestName(mainConfig.testName);
    if (mainConfig?.viewport) config.setViewportSize(mainConfig.viewport);
    if (mainConfig?.baselineEnvName) config.setBaselineEnvName(mainConfig.baselineEnvName);
    const ignoreDisp = mainConfig?.ignoreDisplacement ?? mainConfig?.ignoreDisplacements;
    if (typeof ignoreDisp === 'boolean') config.setIgnoreDisplacements(ignoreDisp);
    if (mainConfig?.branchName) config.setBranchName(mainConfig.branchName);
    if (mainConfig?.parentBranchName) config.setParentBranchName(mainConfig.parentBranchName);

    activeEyes.setConfiguration(config);

    try {
      console.log(`[Applitools] Opening Eyes session (app="${targetAppName}", test="${targetTestName}")...`);
      await activeEyes.open(page, targetAppName, targetTestName);
      isEyesOpen = true;
      currentAppName = targetAppName;
      currentTestName = targetTestName;
    } catch (error: any) {
      console.error(`[Applitools] Failed to open Eyes session: ${error.message || error}`);
      return;
    }
  }

  if (isEyesOpen) {
    try {
      console.log(`[Applitools] Capturing checkpoint: "${checkpointTag}"`);
      await activeEyes.check(checkpointTag, Target.window().fully());
    } catch (error) {
      console.error(`[Applitools] Error capturing checkpoint "${checkpointTag}":`, error);
    }
  }
}
