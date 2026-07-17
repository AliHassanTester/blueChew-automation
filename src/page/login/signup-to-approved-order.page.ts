import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { RegistrationDetails } from '@interfaces/signup-to-approved-order.interface';

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

  // ── Dynamic locators ─────────────────────────────────────────────────────────
  // State options only exist while the listbox is open and vary by state name, so
  // they can't be a fixed entry in the locators list above — build them on demand.
  private stateOption(state: string): LocatorInfo {
    return {
      description: `State Option — ${state}`,
      locator: this.page.locator(`//button[normalize-space()='${state}']`),
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * Each wizard step renders its own CONTINUE button (ds-button--primary); only the
   * active step's is visible + enabled. clickFirstActionable picks it, then we wait
   * for navigation to complete.
   */
  private async clickActiveStepContinue(): Promise<void> {
    await this.actions.clickFirstActionable("//button[normalize-space()='CONTINUE']");
    await this.page.waitForLoadState('load');
  }

  /**
   * Shared flow for the single-input wizard steps (email, password): wait for the
   * field, fill it, Tab to trigger validation/blur, then advance to the next step.
   */
  private async fillInputStep(input: LocatorInfo, value: string): Promise<void> {
    await this.actions.waitForVisibility(input);
    await this.actions.sendKeys(input, value);
    await this.actions.pressKey(input, 'Tab');
    await this.clickActiveStepContinue();
  }

  // ── Public step methods ──────────────────────────────────────────────────────

  async navigateToRegistrationPage(details: RegistrationDetails): Promise<void> {
    await test.step('Open login page → Create Account CTA → /register', async () => {
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
      await this.actions.click(this.stateOption(state));
      await this.actions.selectRadioButtonOrCheckBox(this.locators.termsCheckbox);
      await this.clickActiveStepContinue();
    });
  }

  async completeEmailStep(email: string): Promise<void> {
    await test.step('Step 2 — enter email address', () =>
      this.fillInputStep(this.locators.emailInput, email));
  }

  async completePasswordStep(password: string): Promise<void> {
    await test.step('Step 3 — set password', () =>
      this.fillInputStep(this.locators.passwordInput, password));
  }

  async verifyRegistrationSuccess(quizURL: string): Promise<void> {
    await test.step('Verify registration succeeded — redirected to quiz', async () => {
      // Match the quiz PATH on any host — the quiz has moved between the marketing and app
      // domains, so key off the /quiz path rather than a fixed origin.
      const quizPath = new URL(quizURL).pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await this.actions.waitForURL(new RegExp(`${quizPath}(?:[/?#]|$)`));
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

  /** Full registration journey: login page → wizard → landed on the quiz. */
  async completeRegistration(details: RegistrationDetails): Promise<void> {
    await test.step('Register new customer (login → wizard → quiz)', async () => {
      await this.navigateToRegistrationPage(details);
      await this.completeRegistrationWizard(details);
      await this.verifyRegistrationSuccess(details.quizURL);
    });
  }
}
