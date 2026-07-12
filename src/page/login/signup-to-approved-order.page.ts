import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { RegistrationDetails } from '@interfaces/signup-to-approved-order.interface';
import { passDevGateIfPresent } from '@utilities/dev-gate.utils';

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
      // ── Login page → Create Account CTA (navigates to /register) ──────────
      // Two a[href='/register'] exist (one hidden log-in-link duplicate), so anchor on
      // the visible CTA text.
      signUpLink: {
        description: 'Create an Account CTA (login page → /register)',
        locator: this.page.locator("//a[normalize-space()='Create an account']"),
      },

      // ── Step 1: state + terms (/register) ─────────────────────────────────
      // State is a custom ds-select-simple: a button trigger that opens a listbox of
      // <button> options (not a native <select>).
      stateDropdownTrigger: {
        description: 'State Dropdown Trigger',
        locator: this.page.locator("//button[contains(@class,'ds-select-simple__trigger')]"),
      },
      termsCheckbox: {
        description: 'Terms & Conditions Checkbox',
        locator: this.page.locator("//input[@formcontrolname='agree_terms']"),
      },

      // ── Steps 2 & 3: email + password — ds-input web components ────────────
      // The data-test-id/formcontrolname sit on the <ds-input> host, so target the
      // inner <input> to get an editable element.
      emailInput: {
        description: 'Email Input',
        locator: this.page.locator("//ds-input[@formcontrolname='email']//input"),
      },
      passwordInput: {
        description: 'Password Input',
        locator: this.page.locator("//ds-input[@formcontrolname='pass']//input"),
      },
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Passes the dev-environment gate when it is presented (it no longer appears in every
   * session), and no-ops when absent. Kept here so registration is self-contained — it
   * reaches the login page and its Create-Account CTA without depending on LoginPage.
   */
  private async passDevGate(devGateURL: string): Promise<void> {
    await this.actions.navigateToURL(devGateURL);
    await this.actions.waitForDomLoad();
    await this.verify.waitForLoaderToDisappear();
    await passDevGateIfPresent(this.page);
    await this.verify.waitForLoaderToDisappear();
  }

  /**
   * Each wizard step renders its own CONTINUE button (ds-button--primary); only the
   * active step's is visible + enabled. clickFirstActionable picks it, then we wait
   * for navigation to complete.
   */
  private async clickActiveStepContinue(): Promise<void> {
    await this.actions.clickFirstActionable("//button[normalize-space()='CONTINUE']");
    await this.page.waitForLoadState('load');
  }

  // ── Public step methods ──────────────────────────────────────────────────────

  async navigateToRegistrationPage(details: RegistrationDetails): Promise<void> {
    await test.step('Pass dev gate → login page → Create Account CTA → /register', async () => {
      await this.passDevGate(details.devGateURL);

      // Land on the login page and click the Create Account CTA to reach /register.
      await this.actions.navigateToURL(details.loginURL);
      await this.page.waitForLoadState('load');
      await this.actions.click(this.locators.signUpLink);

      await this.page.waitForLoadState('load');
      await this.actions.waitForVisibility(this.locators.stateDropdownTrigger);
    });
  }

  async completeStateAndTerms(state: string): Promise<void> {
    await test.step('Step 1 — select state and accept terms', async () => {
      await this.actions.waitForVisibility(this.locators.stateDropdownTrigger);
      await this.actions.click(this.locators.stateDropdownTrigger);
      // Options are <button>s labelled by state name, present only while the listbox is open.
      await this.actions.click({
        description: `State Option — ${state}`,
        locator: this.page.locator(`//button[normalize-space()='${state}']`),
      });
      await this.actions.selectRadioButtonOrCheckBox(this.locators.termsCheckbox);
      await this.clickActiveStepContinue();
    });
  }

  async completeEmailStep(email: string): Promise<void> {
    await test.step('Step 2 — enter email address', async () => {
      await this.actions.waitForVisibility(this.locators.emailInput);
      await this.actions.sendKeys(this.locators.emailInput, email);
      await this.actions.pressKey(this.locators.emailInput, 'Tab');
      await this.clickActiveStepContinue();
    });
  }

  async completePasswordStep(password: string): Promise<void> {
    await test.step('Step 3 — set password', async () => {
      await this.actions.waitForVisibility(this.locators.passwordInput);
      await this.actions.sendKeys(this.locators.passwordInput, password);
      await this.actions.pressKey(this.locators.passwordInput, 'Tab');
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
