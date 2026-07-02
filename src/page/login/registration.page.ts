import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { RegistrationDetails } from '@interfaces/registration.interface';

export class RegistrationPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);

    this.locators = {
      // ── Dev gate (/dev-login) ──────────────────────────────────────────────
      devGatePasswordInput: {
        description: 'Dev Gate Password Input',
        locator: this.page.locator("input[formcontrolname='password']"),
      },
      devGateSubmitButton: {
        description: 'Dev Gate Submit Button',
        locator: this.page.locator("//button[normalize-space()='Submit']"),
      },

      // ── Step 1: state + terms (/register) ─────────────────────────────────
      stateDropdown: {
        description: 'State Selection Dropdown',
        locator: this.page.locator("select[formcontrolname='state']"),
      },
      termsCheckbox: {
        description: 'Terms & Conditions Checkbox',
        locator: this.page.locator('#agree_terms'),
      },

      // ── Step 2: email (/register) ──────────────────────────────────────────
      emailInput: {
        description: 'Email Input',
        locator: this.page.locator("input[formcontrolname='email']"),
      },

      // ── Step 3: password (/register) ──────────────────────────────────────
      passwordInput: {
        description: 'Password Input',
        locator: this.page.locator("input[formcontrolname='pass']"),
      },
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async passDevGate(devGateURL: string): Promise<void> {
    await this.actions.navigateToURL(devGateURL);
    await this.page.waitForLoadState('load');
    await this.actions.sendKeys(this.locators.devGatePasswordInput, process.env.DEV_GATE_PASSWORD || 'dev');
    await this.actions.click(this.locators.devGateSubmitButton);
    await this.page.waitForLoadState('load');
  }

  /**
   * Angular's wizard keeps all 3 step CONTINUE buttons in the DOM simultaneously,
   * but only the active step's button is visible. clickFirstActionable auto-waits
   * for that button to be visible AND enabled (Angular enables it once the step's
   * validation passes). After click, wait for navigation to complete.
   */
  private async clickActiveStepContinue(): Promise<void> {
    await this.actions.clickFirstActionable('button.btn-primary');
    await this.page.waitForLoadState('load');
  }

  // ── Public step methods ──────────────────────────────────────────────────────

  async navigateToRegistrationPage(details: RegistrationDetails): Promise<void> {
    await test.step('Pass dev gate → login page → click Sign Up CTA → /register', async () => {
      await this.passDevGate(details.devGateURL);

      // Land on the login page and click the Sign Up CTA to test that link
      await this.actions.navigateToURL(details.loginURL);
      await this.page.waitForLoadState('load');

      const signUpCTA = this.page.locator(
        "a[href='/register']:has-text('Sign Up'), a[href='/register'], button:has-text('Sign Up')"
      ).first();
      await this.actions.clickFirstActionable("a[href='/register']:has-text('Sign Up'), a[href='/register'], button:has-text('Sign Up')");

      // Wait for navigation and state dropdown to become visible
      await this.page.waitForLoadState('load');
      await this.locators.stateDropdown.locator.waitFor({ state: 'visible' });
    });
  }

  async completeStateAndTerms(state: string): Promise<void> {
    await test.step('Step 1 — select state and accept terms', async () => {
      await this.locators.stateDropdown.locator.waitFor({ state: 'visible' });
      await this.page.selectOption("select[formcontrolname='state']", { label: state });
      await this.actions.selectRadioButtonOrCheckBox(this.locators.termsCheckbox);
      await this.clickActiveStepContinue();
    });
  }

  async completeEmailStep(email: string): Promise<void> {
    await test.step('Step 2 — enter email address', async () => {
      await this.locators.emailInput.locator.waitFor({ state: 'visible' });
      await this.actions.sendKeys(this.locators.emailInput, email);
      await this.locators.emailInput.locator.press('Tab');
      await this.clickActiveStepContinue();
    });
  }

  async completePasswordStep(password: string): Promise<void> {
    await test.step('Step 3 — set password', async () => {
      await this.locators.passwordInput.locator.waitFor({ state: 'visible' });
      await this.actions.sendKeys(this.locators.passwordInput, password);
      await this.locators.passwordInput.locator.press('Tab');
      await this.clickActiveStepContinue();
    });
  }

  async verifyRegistrationSuccess(quizURL: string): Promise<void> {
    await test.step('Verify registration succeeded — redirected to quiz', async () => {
      // Escape special chars for regex — matches the quiz URL regardless of query params
      const escapedBase = quizURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await this.actions.waitForURL(new RegExp(escapedBase));
    });
  }

  // ── Composite ────────────────────────────────────────────────────────────────

  async completeRegistrationWizard(details: RegistrationDetails): Promise<void> {
    await test.step('Complete registration wizard (state → email → password)', async () => {
      await this.completeStateAndTerms(details.state);
      await this.completeEmailStep(details.email);
      await this.completePasswordStep(details.password);
    });
  }
}
