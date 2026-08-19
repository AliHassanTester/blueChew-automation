import { Page, TestInfo } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import * as dotenv from 'dotenv';

const envType = process.env.ENV_TYPE || 'dev';
dotenv.config({ path: `.env.${envType}` });

async function isPercyAgentRunning(): Promise<boolean> {
  try {
    const address = process.env.PERCY_SERVER_ADDRESS || 'http://localhost:5338';
    const res = await fetch(`${address}/percy/healthcheck`, { method: 'GET' });
    return res.ok;
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
  options?: any,
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
      `[Percy] Percy CLI server not active on port 5338. Skipping Percy snapshot for "${snapshotName}". (Use a visual script like "npm run test:product:tadalafil:visual" to capture Percy builds)`,
    );
    return;
  }

  const projectName = testInfo?.project?.name ? `[${testInfo.project.name}] ` : '';
  const fullName = `${projectName}${snapshotName}`;

  try {
    console.log(`[Percy] Capturing visual snapshot "${fullName}"...`);
    await percySnapshot(page, fullName, options);
    console.log(`[Percy] Visual snapshot captured successfully for "${fullName}".`);
  } catch (error) {
    console.warn(`[Percy] Warning capturing snapshot "${fullName}":`, error);
  }
}
