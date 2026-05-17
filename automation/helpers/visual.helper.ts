import { expect, type Page, type Locator } from '@playwright/test';
import { Logger } from '../utils/logger.utils';

const logger = new Logger('VisualHelper');

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScreenshotOptions {
  /** Mask locators to hide dynamic content (usernames, timestamps, etc.) */
  mask?: Locator[];
  /** Crop to this region instead of the full page/element */
  clip?: { x: number; y: number; width: number; height: number };
  /** Max number of differing pixels before the assertion fails. Default: 150 */
  maxDiffPixels?: number;
  /** Per-pixel brightness difference tolerance 0–1. Default: 0.2 */
  threshold?: number;
  /** Take a full-page screenshot (scrolled). Default: false (viewport only) */
  fullPage?: boolean;
}

export interface TokenViolation {
  selector: string;
  property: string;
  expected: string;
  actual: string;
}

// ── Viewport presets ──────────────────────────────────────────────────────────

/**
 * Standard responsive viewports aligned with common design system breakpoints.
 * Use these in screenshotAtViewport() to verify layout at each breakpoint.
 */
export const VIEWPORTS = {
  mobile:  { width: 375,  height: 812  },
  tablet:  { width: 768,  height: 1024 },
  desktop: { width: 1280, height: 900  },
  wide:    { width: 1440, height: 900  },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

// ── Animation control ─────────────────────────────────────────────────────────

/**
 * Injects CSS that freezes all animations and transitions.
 * Must be called before any screenshot to prevent flaky pixel diffs
 * caused by in-flight CSS animations or Angular change-detection cycles.
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration:       0.001ms !important;
        animation-delay:          0.001ms !important;
        transition-duration:      0.001ms !important;
        transition-delay:         0.001ms !important;
        scroll-behavior:          auto    !important;
      }
    `,
  });
}

// ── Screenshot helpers ────────────────────────────────────────────────────────

/**
 * Takes a viewport-level screenshot and compares it to the stored baseline.
 *
 * First run: generate baselines with  npx playwright test --update-snapshots
 * Subsequent runs: compare against baseline; fail on visual regression.
 *
 * Prefer screenshotComponent() for component-level regression — it is more
 * stable and less sensitive to unrelated page changes.
 */
export async function screenshotPage(
  page: Page,
  name: string,
  options: ScreenshotOptions = {},
): Promise<void> {
  logger.info(`Page screenshot: "${name}"`);
  await page.evaluate(() => window.scrollTo(0, 0));

  await expect(page).toHaveScreenshot(name, {
    animations:    'disabled',
    fullPage:      options.fullPage ?? false,
    maxDiffPixels: options.maxDiffPixels ?? 150,
    threshold:     options.threshold     ?? 0.2,
    ...(options.mask && { mask: options.mask }),
    ...(options.clip && { clip: options.clip }),
  });
}

/**
 * Takes a screenshot scoped to a specific component or element.
 * This is the preferred approach — more stable than full-page screenshots
 * because changes outside the component don't affect the baseline.
 */
export async function screenshotComponent(
  locator: Locator,
  name: string,
  options: ScreenshotOptions = {},
): Promise<void> {
  logger.info(`Component screenshot: "${name}"`);
  await locator.scrollIntoViewIfNeeded();

  await expect(locator).toHaveScreenshot(name, {
    animations:    'disabled',
    maxDiffPixels: options.maxDiffPixels ?? 100,
    threshold:     options.threshold     ?? 0.2,
    ...(options.mask && { mask: options.mask }),
  });
}

/**
 * Resizes the viewport, disables animations, then takes a page screenshot.
 * Use this for responsive/breakpoint layout regression tests.
 */
export async function screenshotAtViewport(
  page: Page,
  viewport: ViewportName | { width: number; height: number },
  name: string,
  options: ScreenshotOptions = {},
): Promise<void> {
  const size = typeof viewport === 'string' ? VIEWPORTS[viewport] : viewport;
  logger.info(`Responsive screenshot at ${size.width}px: "${name}"`);
  await page.setViewportSize(size);
  await disableAnimations(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await screenshotPage(page, name, options);
}

// ── Design token validation ───────────────────────────────────────────────────

/**
 * Reads computed CSS properties for a DOM element and compares them against
 * the expected token values.
 *
 * Returns an array of violations. An empty array means all tokens pass.
 *
 * Usage:
 *   const violations = await validateTokens(page, 'button[type="submit"]', {
 *     'color':         'rgb(255, 255, 255)',
 *     'border-radius': '100px',
 *   });
 *   expect(violations, formatViolations(violations)).toHaveLength(0);
 */
export async function validateTokens(
  page: Page,
  selector: string,
  tokens: Record<string, string>,
): Promise<TokenViolation[]> {
  const violations: TokenViolation[] = [];

  for (const [property, expectedValue] of Object.entries(tokens)) {
    const actual = await page.evaluate(
      ([sel, prop]: [string, string]) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        return window.getComputedStyle(el).getPropertyValue(prop).trim();
      },
      [selector, property] as [string, string],
    );

    if (actual === null) {
      logger.debug(`validateTokens: selector "${selector}" not found for property "${property}"`);
      continue;
    }

    if (actual !== expectedValue) {
      violations.push({ selector, property, expected: expectedValue, actual });
    }
  }

  return violations;
}

/** Formats token violations into a human-readable diff for assertion messages. */
export function formatViolations(violations: TokenViolation[]): string {
  if (violations.length === 0) return 'All design tokens matched.';
  return (
    `Design token violations (${violations.length}):\n` +
    violations
      .map((v) => `  [${v.selector}] ${v.property}:\n    expected: "${v.expected}"\n    actual:   "${v.actual}"`)
      .join('\n')
  );
}
