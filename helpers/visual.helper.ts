import { Page, Locator, expect } from '@playwright/test';

export interface TokenViolation {
  selector: string;
  property: string;
  expected: string;
  actual: string;
}

const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
} as const;

/**
 * Injects a CSS block that collapses all animation and transition durations to
 * 0.001ms, stopping Angular/React change-detection flicker from causing false
 * pixel diffs in snapshot comparisons.
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-delay: 0ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
        transition-delay: 0ms !important;
      }
    `,
  });
}

/**
 * Captures a single-element snapshot.
 * Tolerance: 100 max-differing pixels.
 * Baseline is created on the first run with --update-snapshots.
 */
export async function screenshotComponent(locator: Locator, name: string): Promise<void> {
  await disableAnimations(locator.page());
  await expect(locator).toHaveScreenshot(`${name}.png`, { maxDiffPixels: 100 });
}

/**
 * Captures a full-viewport snapshot at the current viewport size.
 * Tolerance: 150 max-differing pixels.
 */
export async function screenshotPage(page: Page, name: string): Promise<void> {
  await disableAnimations(page);
  await expect(page).toHaveScreenshot(`${name}.png`, { maxDiffPixels: 150 });
}

/**
 * Resizes the viewport to the given breakpoint, captures a full-page snapshot,
 * then restores the original viewport.
 * Tolerance: 150 max-differing pixels (same as screenshotPage).
 */
export async function screenshotAtViewport(
  page: Page,
  viewport: 'mobile' | 'tablet' | 'desktop',
  name: string,
): Promise<void> {
  const original = page.viewportSize();
  await page.setViewportSize(VIEWPORTS[viewport]);
  await disableAnimations(page);
  await expect(page).toHaveScreenshot(`${name}.png`, { maxDiffPixels: 150, fullPage: true });
  if (original) {
    await page.setViewportSize(original);
  }
}

/**
 * Reads computed CSS properties for a given selector and compares each against
 * the corresponding token value.  Returns an array of TokenViolation objects
 * (empty array = all tokens pass).
 *
 * Values must match getComputedStyle output exactly (resolved RGB, px, etc.).
 * Use formatViolations() to turn the result into a readable assertion message.
 */
export async function validateTokens(
  page: Page,
  cssSelector: string,
  tokenMap: Record<string, string>,
): Promise<TokenViolation[]> {
  const violations: TokenViolation[] = [];

  for (const [property, expectedValue] of Object.entries(tokenMap)) {
    const actualValue: string | null = await page.evaluate(
      ({ selector, prop }) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        return window.getComputedStyle(el).getPropertyValue(prop).trim();
      },
      { selector: cssSelector, prop: property },
    );

    if (actualValue === null) {
      violations.push({
        selector: cssSelector,
        property,
        expected: expectedValue,
        actual: 'element not found',
      });
    } else if (actualValue !== expectedValue) {
      violations.push({
        selector: cssSelector,
        property,
        expected: expectedValue,
        actual: actualValue,
      });
    }
  }

  return violations;
}

/**
 * Formats an array of TokenViolation objects into a human-readable diff string
 * for use as the assertion message in expect(violations, ...).toHaveLength(0).
 */
export function formatViolations(violations: TokenViolation[]): string {
  if (violations.length === 0) return 'No token violations';
  return (
    `Design token violations (${violations.length}):\n` +
    violations
      .map((v) => `  [${v.selector}] ${v.property}:\n    expected: "${v.expected}"\n    actual:   "${v.actual}"`)
      .join('\n')
  );
}
