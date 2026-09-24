import { Page, TestInfo } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import * as dotenv from 'dotenv';
import { resolveVisualConfigForPage } from './applitools.utils';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

const envType = process.env.ENV_TYPE || 'dev';
dotenv.config({ path: `.env.${envType}` });

async function isPercyAgentRunning(): Promise<boolean> {
  try {
    const address = process.env.PERCY_SERVER_ADDRESS || 'http://localhost:5338';
    const res = await fetch(`${address}/percy/healthcheck`, { method: 'GET' }).catch(() =>
      fetch(`${address}/percy/health`, { method: 'GET' }),
    );
    return !!(res && res.ok);
  } catch {
    return false;
  }
}

/**
 * Centralized utility to capture visual checkpoints using Percy.
 */
export async function capturePercyVisualCheckpoint(
  page: Page,
  snapshotName: string,
  testInfo?: TestInfo,
  config?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[] | any,
): Promise<void> {
  const percyToken = process.env.PERCY_TOKEN;
  const isEnabledFlag = process.env.PERCY_ENABLED !== 'false' && process.env.PERCY_ENABLED !== '0';

  if (!isEnabledFlag || !percyToken) {
    console.log(
      `[Percy] Skipping snapshot "${snapshotName}": PERCY_TOKEN not set or PERCY_ENABLED=false.`,
    );
    return;
  }

  const isRunning = await isPercyAgentRunning();
  if (!isRunning) {
    console.log(
      `[Percy] Percy CLI server not active on port 5338. Skipping Percy snapshot for "${snapshotName}". (Run via "npx percy exec -- ..." or visual npm scripts to start the Percy agent)`,
    );
    return;
  }

  const projectName = testInfo?.project?.name ? `[${testInfo.project.name}] ` : '';
  const fullName = `${projectName}${snapshotName}`;

  // Resolve custom width for Percy rendering: 1440 (desktop) or 390 (mobile)
  let width = 1440;
  const vp = page.viewportSize();

  if (config) {
    if (config.widths && Array.isArray(config.widths)) {
      const firstWidth = config.widths[0];
      width = firstWidth <= 768 ? 390 : 1440;
    } else {
      const activeConfig = resolveVisualConfigForPage(page, config);
      if (activeConfig?.viewport?.width) {
        width = activeConfig.viewport.width <= 768 ? 390 : 1440;
      }
    }
  } else if (vp) {
    width = vp.width <= 768 ? 390 : 1440;
  }

  let testCaseName: string | undefined = undefined;
  if (testInfo?.title) {
    const match = testInfo.title.match(/Test case:\s*['"]?([^'"\n\r]+)['"]?/i);
    if (match && match[1]) {
      testCaseName = match[1].trim();
    } else {
      testCaseName = testInfo.title.replace(/\s+/g, ' ').trim();
    }
  }

  const percyOptions: any = {
    ...(config && !Array.isArray(config) && !config.viewport ? config : {}),
    widths: [width],
    ...(testCaseName ? { testCase: testCaseName, test_case: testCaseName } : {}),
  };

  try {
    console.log(`[Percy] Capturing visual snapshot "${fullName}" with width: ${width}...`);
    await percySnapshot(page, fullName, percyOptions);
    console.log(`[Percy] Visual snapshot captured successfully for "${fullName}".`);
  } catch (error) {
    console.warn(`[Percy] Warning capturing snapshot "${fullName}":`, error);
  }
}
