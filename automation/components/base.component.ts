import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import { Logger } from '../utils/logger.utils';
import { TIMEOUTS } from '../constants/timeouts.constants';

/**
 * Abstract base class for UI components.
 *
 * Components sit between BasePage and raw Locator interactions.
 * They model reusable, self-contained UI sections (header, modal, data table)
 * that appear on multiple pages. Each component owns a root locator and all
 * child locators are scoped to it, preventing cross-page selector collisions.
 */
export abstract class BaseComponent {
  protected readonly logger: Logger;

  /**
   * @param page    The Playwright page handle
   * @param root    Root locator that scopes all child locators for this component
   */
  constructor(
    protected readonly page: Page,
    protected readonly root: Locator,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  async isVisible(): Promise<boolean> {
    try {
      await this.root.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
      return true;
    } catch {
      return false;
    }
  }

  async waitForVisible(timeout = TIMEOUTS.ELEMENT): Promise<void> {
    await this.root.waitFor({ state: 'visible', timeout });
  }

  async waitForHidden(timeout = TIMEOUTS.ELEMENT): Promise<void> {
    await this.root.waitFor({ state: 'hidden', timeout });
  }

  async assertVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  async assertHidden(): Promise<void> {
    await expect(this.root).toBeHidden();
  }

  protected locator(selector: string): Locator {
    return this.root.locator(selector);
  }

  protected getByTestId(testId: string): Locator {
    return this.root.getByTestId(testId);
  }

  protected getByRole(
    role: Parameters<Locator['getByRole']>[0],
    options?: Parameters<Locator['getByRole']>[1],
  ): Locator {
    return this.root.getByRole(role, options);
  }
}
