import { Page, TestInfo, test, BrowserContext } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';

export class AdminPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
  }

  async navigateAndLogin(adminURL: string, email: string, password: string): Promise<void> {
    await test.step('Navigate to admin portal and log in', async () => {
      await this.page.goto(adminURL, { waitUntil: 'domcontentloaded' });
      await this.page.waitForTimeout(1_500);

      // Fill login form
      const emailField = this.page.locator('input[type="email"], input[name="email"]').first();
      const passwordField = this.page.locator('input[type="password"]').first();
      await emailField.waitFor({ state: 'visible', timeout: 15_000 });
      await emailField.fill(email);
      await passwordField.fill(password);

      // Submit
      const submitBtn = this.page.locator(
        'button[type="submit"], button:has-text("Log in"), button:has-text("Login"), button:has-text("Sign in")',
      ).first();
      await submitBtn.waitFor({ state: 'visible', timeout: 5_000 });
      await submitBtn.click();

      // Wait for dashboard
      await this.page.waitForURL(/\/(?!auth)/, { timeout: 20_000 });
      await this.page.waitForTimeout(1_500);
    });
  }

  async navigateToUsers(): Promise<void> {
    await test.step('Navigate to Users section', async () => {
      const usersNav = this.page.locator('mat-list-option:has-text("Users")').first();
      await usersNav.waitFor({ state: 'visible', timeout: 10_000 });
      await usersNav.click();
      await this.page.waitForTimeout(2_000);
      await this.actions.waitForDomLoad();
    });
  }

  async searchUser(email: string): Promise<void> {
    await test.step(`Search for user: ${email}`, async () => {
      const searchInput = this.page
        .locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="email" i], mat-form-field input')
        .first();
      await searchInput.waitFor({ state: 'visible', timeout: 15_000 });
      await searchInput.fill(email);
      await searchInput.press('Enter');
      await this.page.waitForTimeout(2_000);
      await this.actions.waitForDomLoad();
    });
  }
}
