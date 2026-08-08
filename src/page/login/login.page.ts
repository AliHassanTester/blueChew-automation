import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { LoginDetails } from '@interfaces/login.interface';
import { LoginPageDetails } from '@interfaces/login.page.interface';
import { VisualHelper } from '@utilities/visual.helper';
import { captureApplitoolsVisualCheckpoint } from '@utilities/applitools.utils';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import {
  LOGIN_DESKTOP_FIGMA_CONFIG,
  LOGIN_MOBILE_FIGMA_CONFIG,
} from '@data/login/login.data';

export class LoginPage {
  public readonly page: Page;
  private readonly playwrightActionsFactory: PlaywrightActionFactory;
  private readonly playwrightVerificationsFactory: PlaywrightVerificationFactory;
  private readonly visual: VisualHelper;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo, visual: VisualHelper) {
    this.page = page;
    this.playwrightActionsFactory = new PlaywrightActionFactory(page, testInfo);
    this.playwrightVerificationsFactory = new PlaywrightVerificationFactory(page, testInfo);
    this.visual = visual;

    // Locators are XPath, anchored on stable attributes (data-test-id) and semantic
    // text, and were derived from a live DOM capture of /log-in.
    this.locators = {
      // ── Login page (/log-in) ───────────────────────────────────────────────
      loginPageContainer: {
        description: 'Login Page Container',
        locator: this.page.locator("//div[@data-test-id='sign-in-page']"),
      },
      emailInput: {
        description: 'Email Address Input',
        locator: this.page.locator("//input[@data-test-id='sign-in-email-input']"),
      },
      passwordInput: {
        description: 'Password Input',
        locator: this.page.locator("//input[@data-test-id='sign-in-password-input']"),
      },
      submitButton: {
        description: 'Login Submit Button (CONTINUE)',
        locator: this.page.locator("//button[@data-test-id='sign-in-submit-button']"),
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
        description: 'Create an Account Link (→ /register)',
        locator: this.page.locator("//a[@href='/register']"),
      },
      googleSSOButton: {
        description: 'Continue with Google Button',
        locator: this.page.locator("//button[contains(normalize-space(),'Continue with google')]"),
      },
      appleSSOButton: {
        description: 'Continue with Apple Button',
        locator: this.page.locator("//button[contains(normalize-space(),'Continue with apple')]"),
      },

      // ── Post-login account shell — verified from live /account DOM ─────────
      accountTabMyPlan: {
        description: 'Account Nav Tab — My Plan (nav-bar section marker)',
        locator: this.page.locator("//button[@data-test-id='navbar-sub-menu-tab-membership']"),
      },
      accountMembershipPage: {
        description: 'Account Content Section — My Plan page container',
        locator: this.page.locator("//div[@data-test-id='account-membership-page']"),
      },

      // ── Hamburger slide-out menu ───────────────────────────────────────────
      navMenuToggle: {
        description: 'Hamburger Menu Toggle Button',
        locator: this.page.locator("//*[@data-test-id='nav-menu-toggle']"),
      },
      myPlanLink: {
        description: 'My Plan Link (hamburger menu)',
        locator: this.page.locator("//a[@data-test-id='nav-link-plan']"),
      },
      profileNavLink: {
        description: 'Profile Link (hamburger menu)',
        locator: this.page.locator("//a[@data-test-id='nav-link-profile']"),
      },
      logoutLink: {
        description: 'Logout Link (hamburger menu)',
        locator: this.page.locator("//a[@data-test-id='nav-link-logout']"),
      },
    };
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
      await this.page.waitForLoadState('load');
      await this.visual.captureCheckpoint('Login page loaded');
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.loginPageContainer);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.emailInput);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.passwordInput);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.submitButton);
    });
  }

  async captureLoginPageSnapshot(configs?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
    await test.step('Capture Applitools visual baseline for Login Page (Desktop & Mobile)', async () => {
      await captureApplitoolsVisualCheckpoint(
        this.page,
        configs || [LOGIN_DESKTOP_FIGMA_CONFIG, LOGIN_MOBILE_FIGMA_CONFIG],
      );
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

  async verifyLoginSuccess(): Promise<void> {
    await test.step('Verify login succeeded — account page rendered', async () => {
      await this.page.waitForLoadState();
      await this.playwrightActionsFactory.waitForURL(/\/account\//);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.accountTabMyPlan);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.accountMembershipPage);
      await this.visual.captureCheckpoint('Login success — account page rendered');
    });
  }

  async verifyNavLinksVisible(): Promise<void> {
    await test.step('Open hamburger menu and verify navigation links', async () => {
      await this.playwrightActionsFactory.click(this.locators.navMenuToggle);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.myPlanLink);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.profileNavLink);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.logoutLink);
      await this.visual.captureCheckpoint('member page slide menu  — account page rendered');
    });
  }

  // ── Composite methods for spec-level orchestration ─────────────────────────

  async navigateToPage(loginPageDetails: LoginPageDetails): Promise<void> {
    await this.navigateToLoginPage(loginPageDetails.loginURL);
    await this.verifyLoginPageLoaded();
  }

  async loginWithCredentials(loginDetails: LoginDetails): Promise<void> {
    await this.fillLoginCredentials(loginDetails);
    await this.submitLogin();
  }

  async verifySuccessfulLogin(): Promise<void> {
    await this.verifyLoginSuccess();
  }
}
