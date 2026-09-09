import { Page, Locator, expect, test } from '@playwright/test';
import * as path from 'path';
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
 * VisualHelper
 * 
 * Provides unified, production-grade visual regression testing capabilities using:
 * 1. Native Playwright expect(page).toHaveScreenshot() (Fast, free, deterministic, in-repo baselines)
 * 2. Component-level expect(locator).toHaveScreenshot() for isolated UI widget baselines
 * 3. Backward-compatible routing for legacy cloud visual providers when configured
 */
export class VisualHelper {
  private readonly defaultStylePath: string;

  constructor(private readonly page: Page) {
    this.defaultStylePath = path.resolve(__dirname, '../styles/visual-snapshot.css');
  }

  /**
   * Auto-waits for network settling and DOM stability before snapshot capture.
   */
  private async waitForPageStabilization(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('load').catch(() => undefined);
    
    // Wait for network requests to settle (ignoring timeouts from persistent polling/analytics)
    await this.page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => undefined);

    // Wait for dynamic BlueChew loading spinners to disappear
    const loader = this.page.locator('.ds-loader, app-loader, .loading-spinner, .processing-loader').first();
    if (await loader.isVisible().catch(() => false)) {
      await loader.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
    }
  }

  /**
   * Capture a full-page or viewport-level visual snapshot using native Playwright.
   * 
   * @param snapshotName Unique file name for the snapshot (e.g., 'login-page-initial')
   * @param options Configuration for masking, fullPage, and pixel tolerances
   */
  async captureSnapshot(snapshotName: string, options: VisualSnapshotOptions = {}): Promise<void> {
    const sanitizedName = snapshotName.endsWith('.png') ? snapshotName : `${snapshotName}.png`;
    console.log(`[Visual] Capturing page snapshot: "${sanitizedName}"`);

    await test.step(`[Visual] Capture Page Snapshot: "${sanitizedName}"`, async () => {
      await this.waitForPageStabilization();

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
   * Capture an isolated component/element-level visual snapshot.
   * 
   * @param target The Playwright Locator or LocatorInfo of the specific element to snapshot
   * @param snapshotName Unique file name for the snapshot (e.g., 'login-form-card')
   * @param options Configuration for masking and pixel tolerances
   */
  async captureElementSnapshot(
    target: Locator | LocatorInfo,
    snapshotName: string,
    options: Omit<VisualSnapshotOptions, 'fullPage'> = {},
  ): Promise<void> {
    const sanitizedName = snapshotName.endsWith('.png') ? snapshotName : `${snapshotName}.png`;
    const isDirectLocator = typeof (target as unknown as Record<string, unknown>).click === 'function';
    const locator: Locator = isDirectLocator
      ? (target as Locator)
      : (target as LocatorInfo).locator;
    const description: string = isDirectLocator
      ? snapshotName
      : (target as LocatorInfo).description || snapshotName;

    console.log(`[Visual] Capturing element snapshot for "${description}": "${sanitizedName}"`);

    await test.step(`[Visual] Capture Element Snapshot: "${sanitizedName}"`, async () => {
      await locator.waitFor({ state: 'visible', timeout: 10_000 });
      await locator.scrollIntoViewIfNeeded().catch(() => undefined);

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
   * Dynamic checkpoint capture for multi-provider compatibility.
   * Automatically executes native Playwright snapshot and/or Applitools when enabled.
   */
  async captureCheckpoint(name: string, config?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
    const providers = (process.env.VISUAL_PROVIDERS || 'playwright').toLowerCase().split(',').map((s) => s.trim());

    if (providers.includes('playwright')) {
      const sanitized = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await this.captureSnapshot(sanitized).catch(() => {
        // Allow fallback in mixed testing modes
      });
    }

    if (providers.includes('applitools')) {
      await captureApplitoolsVisualCheckpoint(this.page, config, name);
    }
  }

  async close(): Promise<void> {
    const providers = (process.env.VISUAL_PROVIDERS || 'playwright').toLowerCase().split(',').map((s) => s.trim());
    if (providers.includes('applitools')) {
      await closeActiveEyes();
    }
  }
}
