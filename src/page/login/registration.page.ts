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

      // ── Login page header nav ──────────────────────────────────────────────
      // Visible header link (class="nav-link"), NOT the hamburger "Sign Up/Login"
      signUpNavLink: {
        description: 'Sign Up Header Nav Link',
        locator: this.page.locator("a.nav-link[href='/register']"),
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
      // This is the same element re-used in step 3 (Angular keeps it in DOM)
      emailInput: {
        description: 'Email Input',
        locator: this.page.locator("input[formcontrolname='email']"),
      },

      // ── Step 3: password (/register) ──────────────────────────────────────
      // formcontrolname='pass' — confirmed from live DOM (same convention as login)
      passwordInput: {
        description: 'Password Input',
        locator: this.page.locator("input[formcontrolname='pass']"),
      },
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async passDevGate(devGateURL: string): Promise<void> {
    await this.actions.navigateToURL(devGateURL);
    await this.actions.waitForDomLoad();
    await this.verify.waitForLoaderToDisappear();
    await this.actions.sendKeys(this.locators.devGatePasswordInput, process.env.DEV_GATE_PASSWORD || 'dev');
    await this.actions.click(this.locators.devGateSubmitButton);
    await this.actions.waitForDomLoad();
    await this.verify.waitForLoaderToDisappear();
  }

  /**
   * Angular's wizard keeps all 3 step CONTINUE buttons in the DOM simultaneously.
   * The active step's button is the only one that is both visible AND not disabled.
   * Iterates through all btn-primary elements to find it.
   */
  private async clickActiveStepContinue(label: string): Promise<void> {
    const allBtns = this.page.locator('button.btn-primary');
    let clicked = false;

    for (let attempt = 0; attempt < 30 && !clicked; attempt++) {
      const count = await allBtns.count();
      for (let i = 0; i < count && !clicked; i++) {
        const btn = allBtns.nth(i);
        const visible = await btn.isVisible().catch(() => false);
        const disabled = await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
        if (visible && !disabled) {
          await btn.click();
          clicked = true;
        }
      }
      if (!clicked) await this.page.waitForTimeout(200);
    }

    if (!clicked) throw new Error(`No visible+enabled btn-primary after ${label}`);
    await this.actions.waitForDomLoad();
    await this.verify.waitForLoaderToDisappear();
  }

  // ── Public step methods ──────────────────────────────────────────────────────

  async navigateToRegistrationPage(details: RegistrationDetails): Promise<void> {
    await test.step('Pass dev gate and navigate to /register via Sign Up nav link', async () => {
      await this.passDevGate(details.devGateURL);
      await this.actions.navigateToURL(details.loginURL);
      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();
      await this.page.waitForSelector('[data-test-id="sign-in-page"]', { timeout: 15_000 });
      await this.actions.click(this.locators.signUpNavLink);
      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();
      // Confirm step 1 is loaded — state dropdown must be visible
      await this.locators.stateDropdown.locator.waitFor({ state: 'visible', timeout: 15_000 });
    });
  }

  async completeStateAndTerms(state: string): Promise<void> {
    await test.step('Step 1 — select state and accept terms', async () => {
      await this.locators.stateDropdown.locator.waitFor({ state: 'visible', timeout: 10_000 });
      await this.page.selectOption("select[formcontrolname='state']", { label: state });
      await this.actions.selectRadioButtonOrCheckBox(this.locators.termsCheckbox);
      await this.page.waitForTimeout(300); // allow Angular validation to settle
      await this.clickActiveStepContinue('step1-state-terms');
    });
  }

  async completeEmailStep(email: string): Promise<void> {
    await test.step('Step 2 — enter email address', async () => {
      await this.locators.emailInput.locator.waitFor({ state: 'visible', timeout: 10_000 });
      await this.actions.sendKeys(this.locators.emailInput, email);
      await this.locators.emailInput.locator.press('Tab'); // trigger Angular blur validation
      await this.page.waitForTimeout(300);
      await this.clickActiveStepContinue('step2-email');
    });
  }

  async completePasswordStep(password: string): Promise<void> {
    await test.step('Step 3 — set password', async () => {
      await this.locators.passwordInput.locator.waitFor({ state: 'visible', timeout: 10_000 });
      await this.actions.sendKeys(this.locators.passwordInput, password);
      await this.locators.passwordInput.locator.press('Tab');
      await this.page.waitForTimeout(300);
      await this.clickActiveStepContinue('step3-password');
    });
  }

  async verifyRegistrationSuccess(postRegistrationURL: string): Promise<void> {
    await test.step('Verify registration succeeded and quiz page loaded', async () => {
      await this.verify.waitForLoaderToDisappear();
      await this.verify.waitForProcessingLoaderToDisappear();
      await this.actions.waitForURL(
        new RegExp(postRegistrationURL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        30_000,
      );
    });
  }

  // ── Composite ────────────────────────────────────────────────────────────────

  async completeRegistrationWizard(details: RegistrationDetails): Promise<void> {
    await this.completeStateAndTerms(details.state);
    await this.completeEmailStep(details.email);
    await this.completePasswordStep(details.password);
  }
}
