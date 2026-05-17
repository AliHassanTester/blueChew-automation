import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import { ROUTES } from '../constants/routes.constants';
import { TIMEOUTS } from '../constants/timeouts.constants';
import { appConfig } from '../config/environment.config';

export class LoginPage extends BasePage {
  readonly pageUrl = ROUTES.LOGIN;

  // ── Locators — real DOM selectors (no data-testids on this app) ──────────
  readonly emailInput    = this.page.locator('input[type="email"]');
  readonly passwordInput = this.page.locator('input[type="password"]');
  readonly loginButton   = this.page.locator('button[type="submit"]');

  // Angular Material or generic error text rendered after a failed login
  readonly errorMessage  = this.page.locator('mat-error, [class*="error"], .alert-danger, [role="alert"]').first();

  // Secondary actions
  readonly forgotEmailLink    = this.page.getByText('Forgot Email?');
  readonly forgotPasswordLink = this.page.getByText('Forgot Password?');
  readonly signUpTab          = this.page.getByRole('tab', { name: 'Sign Up' });
  readonly appleSignInButton  = this.page.getByRole('button', { name: 'Apple' });

  constructor(page: Page) {
    super(page);
  }

  override async waitForPageLoad(): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: TIMEOUTS.NAVIGATION });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<void> {
    this.logger.step(`Login: ${email}`);
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.loginButton);
    await this.waitForLoginResponse();
  }

  async loginAsAdmin(): Promise<void> {
    const { adminEmail, adminPassword } = appConfig.credentials;
    await this.login(adminEmail, adminPassword);
  }

  async loginAsUser(): Promise<void> {
    const { userEmail, userPassword } = appConfig.credentials;
    await this.login(userEmail, userPassword);
  }

  async clickForgotEmail(): Promise<void> {
    await this.click(this.forgotEmailLink);
  }

  async clickForgotPassword(): Promise<void> {
    await this.click(this.forgotPasswordLink);
  }

  async clickSignUp(): Promise<void> {
    await this.click(this.signUpTab);
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertErrorVisible(expectedText?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (expectedText) {
      await expect(this.errorMessage).toContainText(expectedText);
    }
  }

  async assertLoginButtonVisible(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }

  async assertOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/log-in/);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async getErrorText(): Promise<string> {
    await this.waitForVisible(this.errorMessage);
    return (await this.errorMessage.textContent()) ?? '';
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private async waitForLoginResponse(): Promise<void> {
    // Success → navigates away from /log-in to /account/membership
    // Failure → error message appears on the same page
    await Promise.race([
      this.page.waitForURL((url) => !url.pathname.includes('/log-in'), {
        timeout: TIMEOUTS.NAVIGATION,
      }),
      this.errorMessage.waitFor({ state: 'visible', timeout: TIMEOUTS.NAVIGATION }),
    ]);
  }
}
