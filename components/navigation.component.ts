import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BaseComponent } from './base.component';
import { ROUTES } from '../constants/routes.constants';
import { TIMEOUTS } from '../constants/timeouts.constants';

/**
 * BlueChew hamburger nav menu (authenticated).
 *
 * Real DOM selectors confirmed via live inspection:
 *   toggle         — button.icon-menu (class: icon-btn icon-menu)
 *   close          — button[aria-label="Close menu"]
 *   profileAccordion — button[aria-label="Toggle profile links"] (text: "Welcome, Ali")
 *   panel          — mat-sidenav (Angular Material side drawer)
 *
 * Account links are scoped inside the panel via href attributes.
 * Info links (About, FAQ, Reviews, Contact) are also href-scoped.
 */
export class NavigationComponent extends BaseComponent {
  // Top-level controls
  readonly toggle           = this.page.locator('button.icon-menu');
  readonly panel            = this.page.locator('mat-sidenav');
  readonly closeButton      = this.page.locator('button[aria-label="Close menu"]');
  readonly profileAccordion = this.page.locator('button[aria-label="Toggle profile links"]');

  // Account links (inside profile accordion — revealed after expansion)
  readonly planLink     = this.page.locator('mat-sidenav a[href*="membership"]');
  readonly ordersLink   = this.page.locator('mat-sidenav a[href*="orders"]');
  readonly profileLink  = this.page.locator('mat-sidenav a[href*="profile"]');
  readonly logoutLink   = this.page.locator('mat-sidenav button:has-text("Log Out"), mat-sidenav a:has-text("Log Out")').first();

  // Info links (always visible in open panel)
  readonly aboutLink    = this.page.locator('mat-sidenav a[href*="about"]');
  readonly faqLink      = this.page.locator('mat-sidenav a[href*="faq"]');
  readonly reviewsLink  = this.page.locator('mat-sidenav a[href*="reviews"]');
  readonly contactLink  = this.page.locator('mat-sidenav a[href*="contact"]');

  constructor(page: Page) {
    super(page, page.locator('mat-sidenav'));
  }

  /** Open the hamburger menu if it isn't already visible. */
  async open(): Promise<void> {
    const isOpen = await this.panel.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);
    if (!isOpen) {
      await this.toggle.click();
      await this.panel.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT });
    }
  }

  /** Expand the profile sub-accordion to reveal account links. */
  async openProfileLinks(): Promise<void> {
    await this.open();
    const isExpanded = await this.planLink.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);
    if (!isExpanded) {
      await this.profileAccordion.click();
      await this.planLink.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT });
    }
  }

  async goToMembership(): Promise<void> {
    await this.openProfileLinks();
    await this.planLink.click();
    await this.page.waitForURL(`**${ROUTES.MEMBERSHIP}`, { timeout: TIMEOUTS.NAVIGATION });
  }

  async goToOrders(): Promise<void> {
    await this.openProfileLinks();
    await this.ordersLink.click();
    await this.page.waitForURL(`**${ROUTES.ORDERS}`, { timeout: TIMEOUTS.NAVIGATION });
  }

  async goToProfile(): Promise<void> {
    await this.openProfileLinks();
    await this.profileLink.click();
    await this.page.waitForURL(`**${ROUTES.PROFILE}`, { timeout: TIMEOUTS.NAVIGATION });
  }

  async logout(): Promise<void> {
    await this.openProfileLinks();
    await this.logoutLink.click();
    await this.page.waitForURL(`**${ROUTES.LOGIN}`, { timeout: TIMEOUTS.NAVIGATION });
  }

  async goToContact(): Promise<void> {
    await this.open();
    await this.contactLink.click();
    await this.page.waitForURL(`**${ROUTES.CONTACT}`, { timeout: TIMEOUTS.NAVIGATION });
  }

  async goToFAQ(): Promise<void> {
    await this.open();
    await this.faqLink.click();
    await this.page.waitForURL(`**${ROUTES.FAQ}`, { timeout: TIMEOUTS.NAVIGATION });
  }

  async assertPanelVisible(): Promise<void> {
    await expect(this.panel).toBeVisible();
  }

  async assertPanelHidden(): Promise<void> {
    await expect(this.panel).toBeHidden();
  }
}
