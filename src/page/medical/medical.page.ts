import { Page, TestInfo, test, expect, Locator } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { MedicalDetails } from '@interfaces/registration.interface';

/**
 * Medical-profile wizard (/medical). Stable fields expose aria-labels / formcontrolname,
 * the multi-select question groups expose `data-test-id` containers, and every CONTINUE/SUBMIT
 * is a `ds-button--primary`. The per-step question controls (option tiles, radiogroups,
 * checkboxes) are matched dynamically by role/text because the step sequence is data-driven.
 */
export class MedicalPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);

    this.locators = {
      // ── Step 1: legal name ─────────────────────────────────────────────────
      firstNameInput: {
        description: 'Legal First Name Input',
        locator: this.page.locator('input[aria-label="Legal First Name"]'),
      },
      lastNameInput: {
        description: 'Legal Last Name Input',
        locator: this.page.locator('input[aria-label="Legal Last Name"]'),
      },

      // ── Step 2: date of birth ──────────────────────────────────────────────
      birthdayInput: {
        description: 'Date of Birth Input',
        locator: this.page.locator('input[formcontrolname="birthday"]'),
      },

      // ── Active-step primary action — the single visible CONTINUE / SUBMIT ───
      continueButton: {
        description: 'Active Step CONTINUE / SUBMIT Button',
        locator: this.page.locator('button[class*="ds-button--primary"]').filter({ visible: true }).first(),
      },
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * True only if CONTINUE is present AND enabled. isVisible() is checked first
   * (it returns instantly) so we never block on isEnabled() — which would otherwise
   * auto-wait up to the action timeout when the button isn't rendered yet.
   */
  private async isContinueEnabled(): Promise<boolean> {
    const cont = this.locators.continueButton.locator;
    if (!(await cont.isVisible().catch(() => false))) return false;
    return cont.isEnabled().catch(() => false);
  }

  /**
   * Clicks CONTINUE. Playwright auto-waits for the button to be visible AND enabled
   * (DS steps keep it disabled until the step is satisfied). A transient "danger"
   * snackbar toast can overlay the button and intercept the click, so we first wait
   * for any such toast to auto-dismiss.
   */
  private async clickContinue(): Promise<void> {
    await this.page.locator('#snackbar').waitFor({ state: 'detached' }).catch(() => undefined);
    await this.actions.click(this.locators.continueButton);
  }

  /** Option tiles a step can render — DS option buttons (sex/patient) and ARIA radios (walk/climb). */
  private optionTiles(text?: string): Locator {
    const base = this.page.locator('button.ds-option-selector__option, [role="radio"]');
    return text ? base.filter({ hasText: new RegExp(`^${text}$`, 'i') }) : base;
  }

  /** Picks the answer for a single-select question from its page text. */
  private answerFor(bodyText: string): 'Yes' | 'No' {
    // Capability / clearance / agreement questions → "Yes" (healthy user);
    // restriction / condition questions → "No".
    return /can you|are you able|without chest pain|do you agree|good physical fitness/.test(bodyText)
      ? 'Yes'
      : 'No';
  }

  /**
   * Auto-advancing single-question step (no CONTINUE) — clicking an option advances
   * to the next step, so we just click the best option and let the outer loop pick up
   * the next question. No toBeChecked() here: the option detaches as the page advances.
   */
  private async answerAutoAdvanceStep(bodyText: string): Promise<void> {
    const preferred = this.optionTiles(this.answerFor(bodyText));
    if (await preferred.count() > 0) {
      await preferred.first().click();
    } else {
      // Non Yes/No question (e.g. "How long to climb 2 flights?") — first option is
      // the healthiest ("About 10 seconds").
      await this.optionTiles().first().click();
    }
  }

  /**
   * Multi-select checkbox step (has CONTINUE). Prefers the "I have NONE of these"
   * option so no follow-up required fields are triggered; falls back to the first
   * option for steps without a "none" choice (e.g. the Reason step).
   */
  private async selectSafeCheckboxOption(): Promise<void> {
    // The CONTINUE button sits below the option list, so its presence means the full
    // list (incl. the safe option, which renders last) has rendered.
    await this.verify.waitForVisibility(this.locators.continueButton);

    // The "none" option is worded differently per step: "I have NONE of these",
    // "I DO NOT take any of these", etc. Match any of them — selecting it avoids the
    // follow-up required fields that ticking a real option would trigger.
    const noneCheckbox = this.page.getByRole('checkbox', { name: /none|do not|don'?t/i });
    if (await noneCheckbox.count() > 0) {
      // Hidden inputs are positioned off-screen — DOM .click() bypasses coordinate
      // checks and still triggers Angular's change detection.
      await noneCheckbox.first().evaluate((el: HTMLElement) => el.click());
    } else {
      await this.page.locator('label:not(.ds-input__label)').filter({ visible: true }).first().click();
    }
    await this.clickContinue();
  }

  /**
   * Multi-question radiogroup step (has CONTINUE). Answers every unanswered group
   * from the page text, confirming each with toBeChecked() (safe here — these pages
   * don't auto-advance), then clicks CONTINUE if it has enabled. If more questions
   * disclose progressively, CONTINUE stays disabled and the outer loop re-enters.
   */
  private async answerRadiogroupStep(bodyText: string): Promise<void> {
    const name = this.answerFor(bodyText);
    const groups = this.page.getByRole('radiogroup');
    const total = await groups.count();

    for (let i = 0; i < total; i++) {
      const group = groups.nth(i);
      if (await group.getByRole('radio', { checked: true }).count() > 0) continue;

      const target = group.getByRole('radio', { name, exact: true });
      const radio  = (await target.count() > 0) ? target.first() : group.getByRole('radio').first();
      await radio.click();
      await expect(radio).toBeChecked();
    }

    // The CONTINUE click can race with an auto-advance/re-render that detaches the
    // button — that's fine, the answers registered and the step moved on. The outer
    // loop re-evaluates the next step either way, so a detach here is non-fatal.
    if (await this.isContinueEnabled()) await this.clickContinue().catch(() => undefined);
  }

  /**
   * Clicks whatever "proceed" control a transition / info page shows. Most steps use
   * the DS CONTINUE button, but transition pages (e.g. "Meet Gold") use a generic
   * element styled as a CONTINUE link. Dismisses any blocking snackbar first.
   */
  private async clickProceed(): Promise<void> {
    await this.page.locator('#snackbar').waitFor({ state: 'detached' }).catch(() => undefined);
    if (await this.verify.isElementVisible(this.locators.continueButton).catch(() => false)) {
      await this.actions.click(this.locators.continueButton);
    } else {
      await this.page.locator(':text-is("CONTINUE")').filter({ visible: true }).first().click();
    }
  }

  /**
   * Drives the remaining health questions and transitions. Each step is one of:
   *   • auto-advancing single question (options, no CONTINUE) → click best option
   *   • checkbox step (has CONTINUE)                          → safe option + CONTINUE
   *   • multi-question radiogroup (has CONTINUE)              → answer all + CONTINUE
   *   • transition / info page (only a CONTINUE)              → click CONTINUE
   * Loops until the flow leaves /medical.
   */
  private async completeRemainingMedicalSteps(): Promise<void> {
    const stepControl = this.page
      .locator('button.ds-option-selector__option, [role="radio"], [role="checkbox"], :text-is("CONTINUE")')
      .first();

    for (let step = 0; step < 40; step++) {
      if (!this.page.url().includes('/medical')) break;
      await stepControl.waitFor({ state: 'visible' }).catch(() => undefined);
      if (!this.page.url().includes('/medical')) break;

      const bodyText      = (await this.page.locator('body').innerText().catch(() => '')).toLowerCase();
      const hasDsContinue = await this.verify.isElementVisible(this.locators.continueButton).catch(() => false);
      const hasCheckbox   = (await this.page.getByRole('checkbox').count()) > 0;
      const hasRadiogroup = (await this.page.getByRole('radiogroup').count()) > 0;
      const hasOptions    = (await this.optionTiles().count()) > 0;

      if (hasCheckbox && hasDsContinue) {
        await this.selectSafeCheckboxOption();
      } else if (hasRadiogroup && hasDsContinue) {
        await this.answerRadiogroupStep(bodyText);
      } else if (hasOptions && !hasDsContinue) {
        await this.answerAutoAdvanceStep(bodyText);
      } else {
        // Transition / info page (e.g. "Meet Gold") — just proceed.
        await this.clickProceed();
      }
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  async completeMedicalProfile(details: MedicalDetails): Promise<void> {
    await test.step('Complete medical profile', async () => {

      // ── Step 1: Legal name ─────────────────────────────────────────────────
      await test.step('Enter legal name', async () => {
        await this.actions.sendKeys(this.locators.firstNameInput, details.firstName);
        await this.actions.sendKeys(this.locators.lastNameInput, details.lastName);
        await this.clickContinue();
      });

      // ── Step 2: Date of birth ──────────────────────────────────────────────
      await test.step('Enter date of birth', async () => {
        await this.actions.click(this.locators.birthdayInput);
        // Type digits only — the field auto-formats to MM/DD/YYYY
        await this.locators.birthdayInput.locator.pressSequentially(details.birthday.replace(/\//g, ''), { delay: 50 });
        await this.clickContinue();
      });

      // ── Step 3: Sex → Male (auto-advances) ────────────────────────────────
      await test.step('Select biological sex', async () => {
        await this.optionTiles('Male').first().click();
      });

      // ── Step 4: Patient → Yes (auto-advances) ─────────────────────────────
      await test.step('Confirm patient status', async () => {
        await this.optionTiles('Yes').first().click();
      });

      // ── Step 5: Reason for choosing BlueChew — checkboxes ─────────────────
      await test.step('Select reason for choosing BlueChew', async () => {
        await this.selectSafeCheckboxOption();
      });

      // ── Steps 6+: remaining health questions ──────────────────────────────
      await test.step('Complete remaining health questions', async () => {
        await this.completeRemainingMedicalSteps();
      });

      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();
      await this.verify.waitForProcessingLoaderToDisappear();
    });
  }

  async verifyNavigatedToCheckout(): Promise<void> {
    await test.step('Verify navigation to checkout', async () => {
      await this.actions.waitForURL(/\/checkout/);
    });
  }
}
