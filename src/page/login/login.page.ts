import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { LoginDetails } from '@interfaces/login.interface';
import { LoginPageDetails } from '@interfaces/login.page.interface';

export class LoginPage {
  public readonly page: Page;
  private readonly playwrightActionsFactory: PlaywrightActionFactory;
  private readonly playwrightVerificationsFactory: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.playwrightActionsFactory = new PlaywrightActionFactory(page, testInfo);
    this.playwrightVerificationsFactory = new PlaywrightVerificationFactory(page, testInfo);

    this.locators = {
      // ── Dev environment gate (/dev-login) ──────────────────────────────────
      devGatePasswordInput: {
        description: 'Dev Gate Password Input',
        locator: this.page.locator("input[formcontrolname='password']"),
      },
      devGateSubmitButton: {
        description: 'Dev Gate Submit Button',
        locator: this.page.locator("//button[normalize-space()='Submit']"),
      },

      // ── Login page (/log-in) ───────────────────────────────────────────────
      loginPageContainer: {
        description: 'Login Page Container',
        locator: this.page.locator('[data-test-id="sign-in-page"]'),
      },
      emailInput: {
        description: 'Email Address Input',
        // data-test-id is the most stable selector; formcontrolname='email' as backup
        locator: this.page.locator('[data-test-id="sign-in-email-input"]'),
      },
      passwordInput: {
        description: 'Password Input',
        // formcontrolname is 'pass' (not 'password') — verified from live DOM
        locator: this.page.locator('[data-test-id="sign-in-password-input"]'),
      },
      submitButton: {
        description: 'Log In Submit Button',
        locator: this.page.locator('[data-test-id="sign-in-submit-button"]'),
      },
      forgotEmailLink: {
        description: 'Forgot Email Link',
        locator: this.page.locator("//a[normalize-space()='Forgot Email?']"),
      },
      forgotPasswordLink: {
        description: 'Forgot Password Link',
        locator: this.page.locator("//a[normalize-space()='Forgot Password?']"),
      },
      signUpLink: {
        description: 'Sign Up Navigation Link',
        locator: this.page.locator("//a[normalize-space()='Sign Up'][@href='/register']"),
      },
      googleSSOButton: {
        description: 'Sign In with Google Button',
        locator: this.page.locator("//button[normalize-space()='Google']"),
      },
      appleSSOButton: {
        description: 'Sign In with Apple Button',
        locator: this.page.locator("//button[normalize-space()='Apple']"),
      },

      // ── Post-login indicators (/account/membership) ────────────────────────
      // The navbar renders a page-title <p class="text"> in its centre; the text
      // changes per route and is only present for authenticated users.
      dashboardPageTitle: {
        description: 'Dashboard Page Title in Navbar (My Plan)',
        locator: this.page.locator("#navbar p.text"),
      },
      // These nav links are inside the hamburger slide-out panel and are
      // CSS-hidden on desktop until the menu is opened.
      myPlanLink: {
        description: 'My Plan Navigation Link (inside hamburger menu)',
        locator: this.page.locator('[data-test-id="nav-link-plan"]'),
      },
      profileNavLink: {
        description: 'Profile Navigation Link (inside hamburger menu)',
        locator: this.page.locator('[data-test-id="nav-link-profile"]'),
      },
      medicalNavLink: {
        description: 'Medical Navigation Link (inside hamburger menu)',
        locator: this.page.locator('[data-test-id="nav-link-medical"]'),
      },
      navMenuToggle: {
        description: 'Hamburger Menu Toggle Button',
        locator: this.page.locator('[data-test-id="nav-menu-toggle"]'),
      },
      logoutLink: {
        description: 'Logout Link (inside hamburger menu)',
        locator: this.page.locator('[data-test-id="nav-link-logout"]'),
      },
    };
  }

  /**
   * Passes the dev-environment password gate at /dev-login.
   * Must be called once per browser context before navigating to /log-in.
   */
  async passDevGate(devGateURL: string): Promise<void> {
    await test.step('Pass dev environment gate', async () => {
      await this.playwrightActionsFactory.navigateToURL(devGateURL);
      await this.playwrightActionsFactory.waitForDomLoad();
      await this.playwrightVerificationsFactory.waitForLoaderToDisappear();

      await this.playwrightActionsFactory.sendKeys(
        this.locators.devGatePasswordInput,
        process.env.DEV_GATE_PASSWORD || 'dev',
      );
      await this.playwrightActionsFactory.click(this.locators.devGateSubmitButton);
      await this.playwrightActionsFactory.waitForDomLoad();
      await this.playwrightVerificationsFactory.waitForLoaderToDisappear();
    });
  }

  async navigateToLoginPage(loginURL: string): Promise<void> {
    await test.step('Navigate to login page', async () => {
      await this.playwrightActionsFactory.navigateToURL(loginURL);
      await this.playwrightActionsFactory.waitForDomLoad();
      await this.playwrightVerificationsFactory.waitForLoaderToDisappear();
    });
  }

  async verifyLoginPageLoaded(): Promise<void> {
    await test.step('Verify login page is loaded', async () => {
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.loginPageContainer);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.emailInput);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.passwordInput);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.submitButton);
    });
  }

  async fillLoginCredentials(loginDetails: LoginDetails): Promise<void> {
    await test.step('Fill login credentials', async () => {
      await this.playwrightActionsFactory.sendKeys(this.locators.emailInput, loginDetails.username);
      await this.playwrightActionsFactory.sendKeys(this.locators.passwordInput, loginDetails.password);
    });
  }

  async submitLogin(): Promise<void> {
    await test.step('Submit login form', async () => {
      await this.playwrightActionsFactory.click(this.locators.submitButton);
    });
  }

  async verifyLoginSuccess(expectedURL: string): Promise<void> {
    await test.step('Verify login succeeded and dashboard loaded', async () => {
      await this.playwrightVerificationsFactory.waitForLoaderToDisappear();
      await this.playwrightVerificationsFactory.waitForProcessingLoaderToDisappear();
      await this.playwrightActionsFactory.waitForURL(
        new RegExp(expectedURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        30_000,
      );
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.dashboardPageTitle);
    });
  }

  async verifyNavLinksVisible(): Promise<void> {
    await test.step('Open hamburger menu and verify navigation links', async () => {
      await this.playwrightActionsFactory.click(this.locators.navMenuToggle);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.myPlanLink);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.profileNavLink);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.medicalNavLink);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.logoutLink);
    });
  }

  // ── Composite methods for spec-level orchestration ─────────────────────────

  async navigateToPage(loginPageDetails: LoginPageDetails): Promise<void> {
    await this.passDevGate(loginPageDetails.devGateURL);
    await this.navigateToLoginPage(loginPageDetails.loginURL);
    await this.verifyLoginPageLoaded();
  }

  async loginWithCredentials(loginDetails: LoginDetails): Promise<void> {
    await this.fillLoginCredentials(loginDetails);
    await this.submitLogin();
  }

  async verifySuccessfulLogin(postLoginURL: string): Promise<void> {
    await this.verifyLoginSuccess(postLoginURL);
  }
}
