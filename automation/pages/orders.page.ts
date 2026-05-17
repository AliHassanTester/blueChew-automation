import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import { NavigationComponent } from '../components/navigation.component';
import { ROUTES } from '../constants/routes.constants';

/**
 * Orders page — /account/orders
 *
 * Shows the user's order history. Each order card contains:
 *   - Product name (e.g., "DAILY TADALAFIL - 9MG TADALAFIL - 30 CHEWABLES / 1 Tin")
 *   - Order number
 *   - "Contact Support" and "Email Receipt" buttons per order
 *
 * Page-level controls: "Select All" checkbox, "Print" button (in header area).
 * The plan hold banner appears at the top if the subscription is paused.
 */
export class OrdersPage extends BasePage {
  readonly pageUrl = ROUTES.ORDERS;

  readonly nav = new NavigationComponent(this.page);

  // Page controls
  readonly selectAllCheckbox = this.page.locator('button:has-text("Select All"), input[type="checkbox"]').first();
  readonly printButton       = this.page.locator('button:has-text("Print")');

  // Order cards (repeating elements)
  readonly orderCards        = this.page.locator('[class*="order-card"], [class*="order-item"], [class*="order-row"]');
  readonly contactSupportButtons = this.page.locator('button:has-text("Contact Support")');
  readonly emailReceiptButtons   = this.page.locator('button:has-text("Email Receipt")');

  // Hold banner (shown when plan is paused)
  readonly holdBanner        = this.page.locator('[class*="hold"], [class*="banner"], [class*="alert"]').filter({ hasText: /hold/i }).first();

  constructor(page: Page) {
    super(page);
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertFullyLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/account\/orders/);
    await expect(this.nav.toggle).toBeVisible();
  }

  async assertAtLeastOneOrder(): Promise<void> {
    await expect(this.orderCards.first()).toBeVisible();
  }

  async assertOrderCount(expectedCount: number): Promise<void> {
    await expect(this.orderCards).toHaveCount(expectedCount);
  }

  async assertContactSupportVisible(): Promise<void> {
    await expect(this.contactSupportButtons.first()).toBeVisible();
  }

  async assertEmailReceiptVisible(): Promise<void> {
    await expect(this.emailReceiptButtons.first()).toBeVisible();
  }

  async assertHoldBannerVisible(): Promise<void> {
    await expect(this.holdBanner).toBeVisible();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async clickContactSupport(orderIndex = 0): Promise<void> {
    this.logger.step(`Clicking Contact Support for order ${orderIndex}`);
    await this.click(this.contactSupportButtons.nth(orderIndex));
  }

  async clickEmailReceipt(orderIndex = 0): Promise<void> {
    this.logger.step(`Clicking Email Receipt for order ${orderIndex}`);
    await this.click(this.emailReceiptButtons.nth(orderIndex));
  }

  async clickPrint(): Promise<void> {
    this.logger.step('Clicking Print');
    await this.click(this.printButton);
  }

  async getOrderCount(): Promise<number> {
    return this.orderCards.count();
  }
}
