import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Soft assertion helpers — failures are collected and reported together at the
 * end of the test rather than stopping execution immediately. Use these when
 * you want to verify multiple independent properties in a single test.
 */
export const softExpect = expect.configure({ soft: true });

/**
 * Asserts that an API response has the expected HTTP status code and
 * optionally that the body contains the expected keys.
 */
export function assertApiResponse<T extends object>(
  status: number,
  body: T,
  expectedStatus: number,
  requiredKeys: readonly (keyof T)[] = [],
): void {
  expect(status, `Expected HTTP ${expectedStatus} but got ${status}`).toBe(expectedStatus);
  for (const key of requiredKeys) {
    expect(Object.prototype.hasOwnProperty.call(body, key)).toBe(true);
  }
}

/** Asserts that a locator is visible and has the expected text content. */
export async function assertTextContent(
  locator: Locator,
  expectedText: string | RegExp,
): Promise<void> {
  await expect(locator).toBeVisible();
  await expect(locator).toHaveText(expectedText);
}

/** Asserts the current URL matches the expected path or pattern. */
export async function assertCurrentUrl(page: Page, expected: string | RegExp): Promise<void> {
  await expect(page).toHaveURL(expected);
}

/** Asserts an element has a specific attribute value. */
export async function assertAttribute(
  locator: Locator,
  attribute: string,
  expected: string | RegExp,
): Promise<void> {
  await expect(locator).toHaveAttribute(attribute, expected);
}

/** Asserts that a list of locators are all visible simultaneously. */
export async function assertAllVisible(...locators: Locator[]): Promise<void> {
  await Promise.all(locators.map((l) => expect(l).toBeVisible()));
}
