import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { LoginDetails } from '@interfaces/login.interface';
import { LoginPageDetails } from '@interfaces/login.page.interface';
import { VisualHelper, VisualSnapshotOptions } from '@utilities/visual.helper';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import {
  LOGIN_DESKTOP_FIGMA_CONFIG,
  LOGIN_MOBILE_FIGMA_CONFIG,
} from '@data/visual/figma.visual.data';

/**
 * LoginPage Object Model
 * 
 * Encapsulates UI locators and user interactions for the BlueChew Authentication screen (/log-in).
 * Supports both full-page and element-level visual regression baselines with dynamic masking.
 */
export class LoginPage {
  public readonly page: Page;
  private readonly playwrightActionsFactory: PlaywrightActionFactory;
  private readonly playwrightVerificationsFactory: PlaywrightVerificationFactory;
  public readonly visual: VisualHelper;
  public readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo, visual: VisualHelper) {
    this.page = page;
    this.playwrightActionsFactory = new PlaywrightActionFactory(page, testInfo);
    this.playwrightVerificationsFactory = new PlaywrightVerificationFactory(page, testInfo);
    this.visual = visual;

    // Locators anchored on stable semantic attributes and data-test-ids
    this.locators = {
      // ── Promotional Header Banner ──────────────────────────────────────────
      promoBanner: {
        description: 'Promotional Top Banner (e.g. Try 2 months of Gold)',
        locator: this.page.locator("//div[contains(@class,'banner') or contains(@class,'promo')] | //p[contains(text(),'Gold')]").first(),
      },

      // ── Login Card & Container (/log-in) ───────────────────────────────────
      loginPageContainer: {
        description: 'Login Page Container / Sign-in wrapper',
        locator: this.page.locator("//div[@data-test-id='sign-in-page'] | //main | //form").first(),
      },
      welcomeHeading: {
        description: 'Welcome Back Header',
        locator: this.page.locator("//*[contains(normalize-space(),'Welcome back!')]").first(),
      },
      googleSSOButton: {
        description: 'Continue with Google Button',
        locator: this.page.locator("//button[contains(normalize-space(),'Continue with google') or contains(normalize-space(),'Continue With Google')]"),
      },
      appleSSOButton: {
        description: 'Continue with Apple Button',
        locator: this.page.locator("//button[contains(normalize-space(),'Continue with apple') or contains(normalize-space(),'Continue With Apple')]"),
      },
      emailInput: {
        description: 'Email Address Input',
        locator: this.page.locator("//input[@data-test-id='sign-in-email-input'] | //input[@type='email'] | //input[@placeholder='Email your email']").first(),
      },
      passwordInput: {
        description: 'Password Input',
        locator: this.page.locator("//input[@data-test-id='sign-in-password-input'] | //input[@type='password']").first(),
      },
      submitButton: {
        description: 'Login Submit Button (CONTINUE)',
        locator: this.page.locator("//button[@data-test-id='sign-in-submit-button'] | //button[normalize-space()='CONTINUE']").first(),
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
        locator: this.page.locator("//a[@href='/register'] | //a[contains(normalize-space(),'Create an account')]").first(),
      },
      errorMessageBanner: {
        description: 'Validation Error Alert Banner',
        locator: this.page.locator("//div[contains(@class,'alert--danger') or contains(@class,'error') or @role='alert'] | //p[contains(@class,'error')]").first(),
      },

      // ── Forgot Password Modal / View ───────────────────────────────────────
      forgotPasswordEmailInput: {
        description: 'Forgot Password Email Input',
        locator: this.page.getByRole('textbox').first(),
      },
      forgotPasswordSubmitButton: {
        description: 'Forgot Password Submit Button (SEND)',
        locator: this.page.locator("//button[contains(normalize-space(),'Send') or contains(normalize-space(),'SEND')]"),
      },

      // ── Post-login account shell (/account) ────────────────────────────────
      accountTabMyPlan: {
        description: 'Account Nav Tab — My Plan',
        locator: this.page.locator("//button[@data-test-id='navbar-sub-menu-tab-membership'] | //a[contains(@href,'/account')]").first(),
      },
      accountMembershipPage: {
        description: 'Account Content Section — My Plan page container',
        locator: this.page.locator("//div[@data-test-id='account-membership-page'] | //div[contains(@class,'account')]").first(),
      },
      userEmailDisplay: {
        description: 'Dynamic user email / name display (masked in snapshots)',
        locator: this.page.locator("//div[contains(@class,'user-info')] | //p[contains(@class,'user-email')] | //span[contains(@class,'email')]").first(),
      },

      // ── Hamburger navigation menu ──────────────────────────────────────────
      navMenuToggle: {
        description: 'Hamburger Menu Toggle Button',
        locator: this.page.locator("//*[@data-test-id='nav-menu-toggle'] | //button[contains(@class,'menu-toggle')]").first(),
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

  // ── Navigation & Interactions ──────────────────────────────────────────────

  async navigateToLoginPage(loginURL: string = '/log-in'): Promise<void> {
    await test.step(`Navigate to login page: ${loginURL}`, async () => {
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
      await this.playwrightActionsFactory.waitForURL(/\/account\//);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.accountTabMyPlan);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.accountMembershipPage);
    });
  }

  // ── Playwright Native Visual Checkpoint Methods ────────────────────────────

  /**
   * Checkpoint 1: Full-Page Initial Login Baseline
   * Captures the entire page in pristine state.
   */
  async captureFullPageInitialBaseline(snapshotName: string = 'login-page-initial'): Promise<void> {
    await test.step('Capture Full-Page Initial Login Baseline', async () => {
      await this.visual.captureSnapshot(snapshotName, {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  }

  /**
   * Checkpoint 2: Isolated Login Card Component Baseline
   * Focuses strictly on the authentication form container, eliminating extraneous page variations.
   */
  async captureLoginCardElementBaseline(snapshotName: string = 'login-card-component'): Promise<void> {
    await test.step('Capture Isolated Login Card Component Baseline', async () => {
      await this.visual.captureElementSnapshot(this.locators.loginPageContainer.locator, snapshotName, {
        maxDiffPixelRatio: 0.01,
      });
    });
  }

  /**
   * Checkpoint 3: Post-Login Dashboard Baseline with Dynamic Masking
   * Overlays mask boxes across dynamic elements (e.g. user emails, active session tokens, timestamps).
   */
  async captureDashboardBaselineWithMasking(snapshotName: string = 'login-dashboard-landing'): Promise<void> {
    await test.step('Capture Post-Login Dashboard Baseline with Dynamic Masking', async () => {
      const dynamicElements = [
        this.locators.userEmailDisplay?.locator,
      ].filter(Boolean);

      await this.visual.captureSnapshot(snapshotName, {
        fullPage: true,
        mask: dynamicElements,
        maxDiffPixelRatio: 0.02,
      });
    });
  }

  /**
   * Checkpoint 4: Validation Error State Baseline
   * Captures the visual styling of inline alerts, red borders, and error messages.
   */
  async captureValidationErrorBaseline(snapshotName: string = 'login-validation-error'): Promise<void> {
    await test.step('Capture Login Validation Error State Baseline', async () => {
      await this.visual.captureElementSnapshot(this.locators.loginPageContainer.locator, snapshotName, {
        maxDiffPixelRatio: 0.01,
      });
    });
  }

  // ── Legacy / Multi-Provider Visual Checkpoint Routing ──────────────────────

  async captureLoginPageSnapshot(configs?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
    await test.step('Capture visual baseline for Login Page (Desktop & Mobile)', async () => {
      await this.captureVisualCheckpoint(
        'Login Page Snapshot',
        configs || [LOGIN_DESKTOP_FIGMA_CONFIG, LOGIN_MOBILE_FIGMA_CONFIG],
      );
    });
  }

  async captureVisualCheckpoint(tag: string, config?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
    await test.step(`Capture visual checkpoint: ${tag}`, async () => {
      await this.page.waitForLoadState('load').catch(() => undefined);
      await this.playwrightVerificationsFactory.waitForLoaderToDisappear().catch(() => undefined);
      if (this.visual) {
        await this.visual.captureCheckpoint(tag, config);
      }
    });
  }

  // ── Composite Test Orchestration Methods ───────────────────────────────────

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

  async clickForgotPasswordLink(): Promise<void> {
    await test.step('Click Forgot Password link', async () => {
      await this.playwrightActionsFactory.click(this.locators.forgotPasswordLink);
      await this.page.waitForLoadState('load');
    });
  }

  async fillForgotPasswordEmail(email: string): Promise<void> {
    await test.step('Fill email on Forgot Password page', async () => {
      await this.playwrightActionsFactory.sendKeys(this.locators.forgotPasswordEmailInput, email);
    });
  }

  async submitForgotPassword(): Promise<void> {
    await test.step('Submit Forgot Password form', async () => {
      await this.playwrightActionsFactory.click(this.locators.forgotPasswordSubmitButton).catch(() => undefined);
      await this.page.waitForLoadState('load').catch(() => undefined);
    });
  }

  async verifyNavLinksVisible(): Promise<void> {
    await test.step('Open hamburger menu and verify navigation links', async () => {
      if (await this.locators.navMenuToggle.locator.isVisible().catch(() => false)) {
        await this.playwrightActionsFactory.click(this.locators.navMenuToggle);
      }
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.myPlanLink);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.profileNavLink);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.logoutLink);
    });
  }
}
