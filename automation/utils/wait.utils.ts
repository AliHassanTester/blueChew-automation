import type { Page, Locator } from '@playwright/test';
import { TIMEOUTS } from '../constants/timeouts.constants';

/**
 * Waits until a network request matching the URL pattern completes.
 * Useful for asserting API calls triggered by UI actions.
 */
export async function waitForload(page: Page, timeout = TIMEOUTS.NAVIGATION): Promise<void> {
  await page.waitForLoadState('load', { timeout });
}

/**
 * Waits for a specific API response matching the URL pattern.
 * Returns the response so callers can assert on status/body.
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>,
  timeout = TIMEOUTS.API_REQUEST,
) {
  const [response] = await Promise.all([
    page.waitForResponse(urlPattern, { timeout }),
    action(),
  ]);
  return response;
}

/**
 * Polls a condition function until it returns true or the timeout elapses.
 * Prefer Playwright's built-in waitFor when possible; use this for
 * conditions that can't be expressed as locator states.
 */
export async function waitUntil(
  condition: () => Promise<boolean>,
  options: { timeout?: number; interval?: number; message?: string } = {},
): Promise<void> {
  const { timeout = TIMEOUTS.ELEMENT, interval = TIMEOUTS.POLL_INTERVAL, message = 'Condition not met' } = options;

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout: ${message} (waited ${timeout}ms)`);
}

/**
 * Waits for a locator to reach a stable bounding box (no layout shifts).
 * Helpful before toHaveScreenshot() or pixel-sensitive assertions.
 */
export async function waitForStableLayout(locator: Locator, stabilityMs = 300): Promise<void> {
  let previousBox = await locator.boundingBox();
  await new Promise((resolve) => setTimeout(resolve, stabilityMs));
  const currentBox = await locator.boundingBox();

  const isStable =
    previousBox?.x === currentBox?.x &&
    previousBox?.y === currentBox?.y &&
    previousBox?.width === currentBox?.width &&
    previousBox?.height === currentBox?.height;

  if (!isStable) {
    // One recursive retry — avoids infinite loops
    previousBox = currentBox;
    await waitForStableLayout(locator, stabilityMs);
  }
}
