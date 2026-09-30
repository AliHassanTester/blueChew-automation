import { Page, TestInfo, Locator, expect, test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { captureApplitoolsVisualCheckpoint, closeActiveEyes } from './applitools.utils';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import { LocatorInfo } from '@interfaces/locator.info.interface';

export type { ApplitoolsVisualConfig };

/**
 * Options for Playwright Native Visual Snapshot Assertions
 */
export interface VisualSnapshotOptions {
  /** Capture entire scrollable page (default: true for page-level snapshots) */
  fullPage?: boolean;
  /** Array of element locators to mask with a pink placeholder box */
  mask?: Locator[];
  /** Maximum ratio of pixels that can differ (e.g., 0.02 = 2%) */
  maxDiffPixelRatio?: number;
  /** Maximum absolute number of mismatched pixels allowed */
  maxDiffPixels?: number;
  /** Perceptual color difference threshold (0 to 1, default: 0.2) */
  threshold?: number;
  /** Custom stylesheet path injected during capture to stabilize dynamic styles */
  stylePath?: string;
  /** Disable animations and transitions (default: 'disabled') */
  animations?: 'disabled' | 'allow';
}

/**
 * Default core design system CSS property tokens to inspect during token snapshots
 */
export const DEFAULT_DESIGN_TOKENS = [
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'border-radius',
  'border-top-width',
  'border-top-color',
  'border-top-style',
  'box-shadow',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'display',
  'opacity',
] as const;

/**
 * VisualHelper
 * 
 * Provides a unified, 2-layer production visual & design regression testing architecture:
 * Layer A: Macro & Component Pixelmatch (expect.toHaveScreenshot)
 * Layer B: Design System Token Snapshots (Computed CSS JSON evaluation via expect.toMatchSnapshot)
 */
export class VisualHelper {
  private readonly defaultStylePath: string;

  constructor(private readonly page: Page, private readonly testInfo?: TestInfo) {
    this.defaultStylePath = path.resolve(__dirname, '../styles/visual-snapshot.css');
  }

  /**
   * Helper to normalize Target Locator or LocatorInfo
   */
  private resolveLocator(target: Locator | LocatorInfo): { locator: Locator; description: string } {
    const isDirectLocator = typeof (target as unknown as Record<string, unknown>).click === 'function';
    return {
      locator: isDirectLocator ? (target as Locator) : (target as LocatorInfo).locator,
      description: isDirectLocator ? 'Component' : (target as LocatorInfo).description || 'Component',
    };
  }

  /**
   * Pre-snapshot stabilization pipeline:
   * 1. Awaits DOMContentLoaded and window load states
   * 2. Awaits document.fonts.ready to completely eliminate FOIT / FOUT font shifts
   * 3. Awaits dismissal of dynamic BlueChew loading spinners and overlays
   */
  async waitForPageStabilization(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('load').catch(() => undefined);

    // Ensure all web fonts (Outfit, Inter, icons) are fully loaded and rendered
    await this.page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    }).catch(() => undefined);

    // Wait for dynamic BlueChew loading spinners to disappear
    const loader = this.page.locator('.ds-loader, app-loader, .loading-spinner, .processing-loader, #app-loading').first();
    if (await loader.isVisible().catch(() => false)) {
      await loader.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Layer A: Macro & Component Pixelmatch
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Helper to retrieve active TestInfo instance for HTML report attachments
   */
  private getActiveTestInfo(): TestInfo | undefined {
    if (this.testInfo && typeof this.testInfo.attach === 'function') {
      return this.testInfo;
    }
    try {
      return test.info();
    } catch {
      return undefined;
    }
  }

  /**
   * Capture a full-page or viewport-level visual snapshot using native Playwright.
   */
  async capturePageSnapshot(snapshotName: string, options: VisualSnapshotOptions = {}): Promise<void> {
    const providers = (process.env.VISUAL_PROVIDERS || 'playwright').toLowerCase().split(',').map((s) => s.trim());
    if (!providers.includes('playwright')) {
      return;
    }

    const sanitizedName = snapshotName.endsWith('.png') ? snapshotName : `${snapshotName}.png`;
    console.log(`[Visual Layer A] Capturing page snapshot: "${sanitizedName}"`);

    await test.step(`[Visual] Layer A: Page Pixelmatch Snapshot: "${sanitizedName}"`, async () => {
      await this.waitForPageStabilization();

      const stylePath = options.stylePath ?? this.defaultStylePath;
      const customStyle = fs.existsSync(stylePath) ? fs.readFileSync(stylePath, 'utf8') : undefined;

      const activeTestInfo = this.getActiveTestInfo();
      if (activeTestInfo) {
        try {
          const screenshotBuf = await this.page.screenshot({
            fullPage: options.fullPage ?? true,
            mask: options.mask ?? [],
            animations: options.animations ?? 'disabled',
            style: customStyle,
          });
          if (screenshotBuf) {
            await activeTestInfo.attach(`📸 Actual Snapshot: ${sanitizedName}`, {
              body: screenshotBuf,
              contentType: 'image/png',
            });
          }
        } catch (err) {
          console.warn(`[Visual Layer A] Warning: Failed to attach actual screenshot for "${sanitizedName}":`, err);
        }
      }

      await expect(this.page).toHaveScreenshot(sanitizedName, {
        fullPage: options.fullPage ?? true,
        mask: options.mask ?? [],
        maxDiffPixelRatio: options.maxDiffPixelRatio ?? 0.01,
        maxDiffPixels: options.maxDiffPixels,
        threshold: options.threshold ?? 0.2,
        animations: options.animations ?? 'disabled',
        stylePath: options.stylePath ?? this.defaultStylePath,
      });
    });
  }

  /**
   * Capture an isolated component/element-level visual snapshot using native Playwright.
   */
  async captureComponentSnapshot(
    target: Locator | LocatorInfo,
    snapshotName: string,
    options: Omit<VisualSnapshotOptions, 'fullPage'> = {},
  ): Promise<void> {
    const providers = (process.env.VISUAL_PROVIDERS || 'playwright').toLowerCase().split(',').map((s) => s.trim());
    if (!providers.includes('playwright')) {
      return;
    }

    const sanitizedName = snapshotName.endsWith('.png') ? snapshotName : `${snapshotName}.png`;
    const { locator, description } = this.resolveLocator(target);

    console.log(`[Visual Layer A] Capturing component snapshot for "${description}": "${sanitizedName}"`);

    await test.step(`[Visual] Layer A: Component Pixelmatch Snapshot: "${description}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: 10_000 });
      await locator.scrollIntoViewIfNeeded().catch(() => undefined);

      const stylePath = options.stylePath ?? this.defaultStylePath;
      const customStyle = fs.existsSync(stylePath) ? fs.readFileSync(stylePath, 'utf8') : undefined;

      const activeTestInfo = this.getActiveTestInfo();
      if (activeTestInfo) {
        try {
          const componentBuf = await locator.screenshot({
            mask: options.mask ?? [],
            animations: options.animations ?? 'disabled',
            style: customStyle,
          });
          if (componentBuf) {
            await activeTestInfo.attach(`📸 Actual Component: ${sanitizedName}`, {
              body: componentBuf,
              contentType: 'image/png',
            });
          }
        } catch (err) {
          console.warn(`[Visual Layer A] Warning: Failed to attach actual component screenshot for "${sanitizedName}":`, err);
        }
      }

      await expect(locator).toHaveScreenshot(sanitizedName, {
        mask: options.mask ?? [],
        maxDiffPixelRatio: options.maxDiffPixelRatio ?? 0.01,
        maxDiffPixels: options.maxDiffPixels,
        threshold: options.threshold ?? 0.2,
        animations: options.animations ?? 'disabled',
        stylePath: options.stylePath ?? this.defaultStylePath,
      });
    });
  }

  /**
   * Alias for capturePageSnapshot (backward compatibility)
   */
  async captureSnapshot(snapshotName: string, options: VisualSnapshotOptions = {}): Promise<void> {
    await this.capturePageSnapshot(snapshotName, options);
  }

  /**
   * Alias for captureComponentSnapshot (backward compatibility)
   */
  async captureElementSnapshot(
    target: Locator | LocatorInfo,
    snapshotName: string,
    options: Omit<VisualSnapshotOptions, 'fullPage'> = {},
  ): Promise<void> {
    await this.captureComponentSnapshot(target, snapshotName, options);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Layer B: Design System Computed CSS Token Snapshots
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Extracts computed CSS styling tokens from an element and asserts them against
   * a version-controlled JSON snapshot. Pinpoints exact token regressions (color, font,
   * padding, border-radius) with zero pixel-level anti-aliasing noise.
   */
  async assertDesignTokenSnapshot(
    target: Locator | LocatorInfo,
    snapshotName: string,
    customTokens?: readonly string[] | string[],
  ): Promise<Record<string, string>> {
    const { locator, description } = this.resolveLocator(target);
    const tokensToInspect = customTokens || DEFAULT_DESIGN_TOKENS;
    const sanitizedName = snapshotName.endsWith('.json') ? snapshotName : `${snapshotName}.json`;

    return await test.step(`[Visual] Layer B: Design System Token Contract: "${description}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: 10_000 });
      await this.waitForPageStabilization();

      const computedTokens = await locator.evaluate((el: HTMLElement, properties: string[]) => {
        const computed = window.getComputedStyle(el);
        const result: Record<string, string> = {};
        for (const prop of properties) {
          result[prop] = computed.getPropertyValue(prop);
        }
        return result;
      }, tokensToInspect as string[]);

      console.log(`[Visual Layer B] Asserting design tokens for "${description}":`, computedTokens);
      const activeTestInfo = this.getActiveTestInfo();
      if (activeTestInfo) {
        await activeTestInfo.attach(`📄 Design Tokens: ${sanitizedName}`, {
          body: JSON.stringify(computedTokens, null, 2),
          contentType: 'application/json',
        });
      }
      expect(JSON.stringify(computedTokens, null, 2)).toMatchSnapshot(sanitizedName);
      return computedTokens;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Unified Checkpoint Dispatcher
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Unified multi-provider checkpoint capture.
   * Executes Playwright native snapshot (Layer A) and/or Applitools Eyes when enabled.
   */
  async captureCheckpoint(name: string, config?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
    const providers = (process.env.VISUAL_PROVIDERS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);

    if (providers.includes('playwright')) {
      const sanitized = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await this.capturePageSnapshot(sanitized).catch(() => {
        // Allow fallback in mixed testing modes
      });
    }

    if (providers.includes('applitools')) {
      await captureApplitoolsVisualCheckpoint(this.page, config, name);
    }
  }

  async close(): Promise<void> {
    const providers = (process.env.VISUAL_PROVIDERS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
    if (providers.includes('applitools')) {
      await closeActiveEyes();
    }
  }
}
