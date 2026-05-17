import type { Page, Locator } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const screenshotsDir = path.resolve(process.cwd(), 'screenshots');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Captures a full-page screenshot to the screenshots/ directory. */
export async function captureFullPage(page: Page, name: string): Promise<string> {
  ensureDir(screenshotsDir);
  const filePath = path.join(screenshotsDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

/** Captures a screenshot of a single element. */
export async function captureElement(locator: Locator, name: string): Promise<string> {
  ensureDir(screenshotsDir);
  const filePath = path.join(screenshotsDir, `${name}-element-${Date.now()}.png`);
  await locator.screenshot({ path: filePath });
  return filePath;
}

/**
 * Captures a screenshot and attaches it to the Playwright test report.
 * Call this from within a test step for inline report visibility.
 */
export async function captureAndAttach(
  page: Page,
  name: string,
  testInfo: { attach: (name: string, options: { body: Buffer; contentType: string }) => Promise<void> },
): Promise<void> {
  const buffer = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, { body: buffer, contentType: 'image/png' });
}
