import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { appConfig } from '../config/environment.config';
import { TIMEOUTS } from '../constants/timeouts.constants';
import { Logger } from '../utils/logger.utils';
import { retryAction } from '../utils/retry.utils';
import { captureFullPage } from '../utils/screenshot.utils';
import { handleDevGateIfPresent } from '../helpers/auth.helper';

/**
 * Abstract base class for all page objects.
 *
 * Provides:
 *  • Typed constructor that binds the Playwright Page
 *  • Common navigation and interaction helpers
 *  • Built-in retry for flaky click/fill operations
 *  • Consistent screenshot naming
 *
 * Every page object must declare its relative `pageUrl` and can optionally
 * override `waitForPageLoad` for pages that need non-standard load signals.
 */
export abstract class BasePage {
  protected readonly logger: Logger;

  constructor(readonly page: Page) {
    this.logger = new Logger(this.constructor.name);
  }

  /** Route path relative to BASE_URL (e.g. '/login') */
  abstract readonly pageUrl: string;

  // ── Navigation ────────────────────────────────────────────────────────────

  async navigate(): Promise<void> {
    const url = `${appConfig.baseUrl}${this.pageUrl}`;
    this.logger.step(`Navigating to ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await handleDevGateIfPresent(this.page);
    await this.waitForPageLoad();
  }

  // Base implementation is a no-op — goto already waits for domcontentloaded.
  // Override in page objects that need a specific ready signal (e.g. wait for a key element).
  async waitForPageLoad(): Promise<void> {}

  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'load' });
  }

  async getTitle(): Promise<string> {
    return this.page.title();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  // ── Element interactions ───────────────────────────────────────────────────

  /**
   * Clicks a locator with automatic retry on transient failures
   * (element detachment, interception by overlays).
   */
  async click(locator: Locator): Promise<void> {
    this.logger.debug(`Clicking ${await this.describeLocator(locator)}`);
    await retryAction(async () => {
      await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT });
      await locator.click();
    });
  }

  /** Clears a field and fills it with the given value. */
  async fill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT });
    await locator.clear();
    await locator.fill(value);
  }

  /** Selects an option in a <select> element by its visible label. */
  async selectOption(locator: Locator, label: string): Promise<void> {
    await locator.selectOption({ label });
  }

  // ── Visibility helpers ─────────────────────────────────────────────────────

  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
      return true;
    } catch {
      return false;
    }
  }

  async waitForVisible(locator: Locator, timeout = TIMEOUTS.ELEMENT): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  async waitForHidden(locator: Locator, timeout = TIMEOUTS.ELEMENT): Promise<void> {
    await locator.waitFor({ state: 'hidden', timeout });
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  async assertUrl(expected: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expected);
  }

  async assertTitle(expected: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expected);
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  async scrollTo(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  async screenshot(name: string): Promise<string> {
    return captureFullPage(this.page, name);
  }

  async hover(locator: Locator): Promise<void> {
    await locator.hover();
  }

  // Returns a human-readable locator description for log messages
  private async describeLocator(locator: Locator): Promise<string> {
    try {
      return String(locator);
    } catch {
      return 'unknown locator';
    }
  }
}
