import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { LoginDetails } from '@interfaces/login.interface';
import { LoginPageDetails } from '@interfaces/login.page.interface';
import { ApplitoolsVisualHelper } from '@utilities/applitools.utils';

export class LoginPage {
  public readonly page: Page;
  private readonly playwrightActionsFactory: PlaywrightActionFactory;
  private readonly visualHelper?: ApplitoolsVisualHelper;
  private readonly playwrightVerificationsFactory: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo, visualHelper?: ApplitoolsVisualHelper) {
    this.page = page;
    this.playwrightActionsFactory = new PlaywrightActionFactory(page, testInfo);
    this.visualHelper = visualHelper;
    this.playwrightVerificationsFactory = new PlaywrightVerificationFactory(page, testInfo);

    // Locators are XPath, anchored on stable attributes (data-test-id) and semantic
    // text, and were derived from a live DOM capture of /log-in.
    this.locators = {
      // ── Login page (/log-in) ───────────────────────────────────────────────
      // The form is built from <ds-input> web components; the data-test-id sits on
      // BOTH the host and the inner <input>, so we anchor on the <input> tag to get
      // an editable element that fill() accepts.
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
      // The three tabs render on every /account tab, so they are the least-fragile
      // proof that login reached the authenticated area with navigation intact.
      // One locator per section is enough to prove the whole account page rendered:
      // a tab header (nav-bar section) + the page content container (content section).
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

  async verifyLoginSuccess(): Promise<void> {
    await test.step('Verify login succeeded — account page rendered', async () => {
      await this.page.waitForLoadState();
      // Login redirects into /account (default landing tab is /membership).
      await this.playwrightActionsFactory.waitForURL(/\/account\//);
      // One locator per section — the nav tab bar and the page content — confirms the
      // whole page rendered without over-coupling to any single element.
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.accountTabMyPlan);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.accountMembershipPage);
    });
  }

  async verifyNavLinksVisible(): Promise<void> {
    await test.step('Open hamburger menu and verify navigation links', async () => {
      await this.playwrightActionsFactory.click(this.locators.navMenuToggle);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.myPlanLink);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.profileNavLink);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.logoutLink);
    });
  }

  // ── Composite methods for spec-level orchestration ─────────────────────────

  async navigateToPage(loginPageDetails: LoginPageDetails): Promise<void> {
    await this.navigateToLoginPage(loginPageDetails.loginURL);
    await this.verifyLoginPageLoaded();
    await this.visualHelper?.captureCheckpoint('Login flow', 'Log in/Default');
  }

  async loginWithCredentials(loginDetails: LoginDetails): Promise<void> {
    await this.fillLoginCredentials(loginDetails);
    await this.submitLogin();
  }

  async verifySuccessfulLogin(): Promise<void> {
    await this.verifyLoginSuccess();
    await this.visualHelper?.captureCheckpoint('Login flow', 'Log in/Default_1440');
  }
}
