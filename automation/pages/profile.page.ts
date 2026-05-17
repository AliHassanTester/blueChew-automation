import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import { NavigationComponent } from '../components/navigation.component';
import { ROUTES } from '../constants/routes.constants';

/**
 * Profile page — /account/profile
 *
 * Displays user account settings and links to sub-pages for changing contact
 * details, security, and payment info.
 *
 * data-test-id: `account-profile-page`
 * Form fields found in live exploration: smsToggle, emailToggle (checkboxes)
 * Sub-page links: change-email-otp, change-phone, change-password,
 *                 enable-mfa, update-shipping-address, billing/update
 */
export class ProfilePage extends BasePage {
  readonly pageUrl = ROUTES.PROFILE;

  readonly nav = new NavigationComponent(this.page);

  // Page root
  readonly pageRoot = this.page.getByTestId('account-profile-page');

  // User identity
  readonly userNameHeading = this.page.locator('h1, h2').filter({ hasText: /[A-Z]/ }).first();

  // Notification preferences
  readonly smsToggle   = this.page.locator('input[name="smsToggle"]');
  readonly emailToggle = this.page.locator('input[name="emailToggle"]');

  // Sub-page navigation links
  readonly changeEmailLink    = this.page.locator(`a[href*="change-email-otp"]`);
  readonly changePhoneLink    = this.page.locator(`a[href*="change-phone"]`);
  readonly changePasswordLink = this.page.locator(`a[href*="change-password"]`);
  readonly enableMfaLink      = this.page.locator(`a[href*="enable-mfa"]`);
  readonly shippingAddressLink = this.page.locator(`a[href*="update-shipping-address"]`);
  readonly billingUpdateLink  = this.page.locator(`a[href*="billing/update"]`);

  constructor(page: Page) {
    super(page);
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertFullyLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/account\/profile/);
    await expect(this.pageRoot).toBeVisible();
    await expect(this.nav.toggle).toBeVisible();
  }

  async assertUserName(name: string | RegExp): Promise<void> {
    await expect(this.userNameHeading).toContainText(name);
  }

  async assertSmsToggleChecked(checked: boolean): Promise<void> {
    if (checked) {
      await expect(this.smsToggle).toBeChecked();
    } else {
      await expect(this.smsToggle).not.toBeChecked();
    }
  }

  async assertEmailToggleChecked(checked: boolean): Promise<void> {
    if (checked) {
      await expect(this.emailToggle).toBeChecked();
    } else {
      await expect(this.emailToggle).not.toBeChecked();
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async toggleSms(): Promise<void> {
    this.logger.step('Toggling SMS notifications');
    await this.smsToggle.click();
  }

  async toggleEmail(): Promise<void> {
    this.logger.step('Toggling email notifications');
    await this.emailToggle.click();
  }

  async clickChangeEmail(): Promise<void> {
    await this.click(this.changeEmailLink);
    await this.page.waitForURL(/change-email-otp/, { timeout: 15000 });
  }

  async clickChangePhone(): Promise<void> {
    await this.click(this.changePhoneLink);
    await this.page.waitForURL(/change-phone/, { timeout: 15000 });
  }

  async clickChangePassword(): Promise<void> {
    await this.click(this.changePasswordLink);
    await this.page.waitForURL(/change-password/, { timeout: 15000 });
  }

  async clickUpdateShippingAddress(): Promise<void> {
    await this.click(this.shippingAddressLink);
    await this.page.waitForURL(/update-shipping-address/, { timeout: 15000 });
  }

  async clickUpdateBilling(): Promise<void> {
    await this.click(this.billingUpdateLink);
    await this.page.waitForURL(/billing\/update/, { timeout: 15000 });
  }
}
