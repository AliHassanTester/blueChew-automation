import { Page, TestInfo, test, Locator } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { MedicalDetails } from '@interfaces/signup-to-approved-order.interface';

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
  private readonly testInfo: TestInfo;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
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
      // Generic CONTINUE link on transition / info pages that lack the DS button.
      proceedLink: {
        description: 'Generic CONTINUE Link (transition pages)',
        locator: this.page.locator(':text-is("CONTINUE")'),
      },

      // ── Overlays ────────────────────────────────────────────────────────────
      // Transient "danger" snackbar toast that can overlay CONTINUE and intercept clicks.
      snackbar: {
        description: 'Snackbar Toast (overlay)',
        locator: this.page.locator('#snackbar'),
      },

      // ── Data-driven question controls (base locators; scoped by text/role at use) ──
      // Option tiles: DS option buttons (sex/patient) and ARIA radios (walk/climb).
      optionTiles: {
        description: 'Option Tiles (DS options / ARIA radios)',
        locator: this.page.locator('button.ds-option-selector__option, [role="radio"]'),
      },
      radioGroups: {
        description: 'Question Radiogroups',
        locator: this.page.getByRole('radiogroup'),
      },
      checkboxes: {
        description: 'Question Checkboxes',
        locator: this.page.getByRole('checkbox'),
      },
      // "I have NONE of these" / "I DO NOT take any of these" — safe multi-select opt-out.
      noneCheckbox: {
        description: 'Multi-select "none / do not" opt-out checkbox',
        locator: this.page.getByRole('checkbox', { name: /none|do not|don'?t/i }),
      },
      // Fallback option for checkbox steps without a "none" choice (e.g. the Reason step).
      fallbackCheckboxLabel: {
        description: 'First selectable checkbox label (fallback)',
        locator: this.page.locator('label:not(.ds-input__label)'),
      },
      // First actionable control of whatever step is showing — used to await step render.
      stepControl: {
        description: 'Active Step First Control',
        locator: this.page.locator(
          'button.ds-option-selector__option, [role="radio"], [role="checkbox"], :text-is("CONTINUE")',
        ),
      },
      // Page body — read as text to classify the current question.
      pageBody: {
        description: 'Page Body Text',
        locator: this.page.locator('body'),
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

  /** Waits for any blocking snackbar toast to auto-dismiss before interacting. */
  private async dismissSnackbar(): Promise<void> {
    await this.locators.snackbar.locator.waitFor({ state: 'detached' }).catch(() => undefined);
  }

  /**
   * Clicks CONTINUE. Playwright auto-waits for the button to be visible AND enabled
   * (DS steps keep it disabled until the step is satisfied). A transient "danger"
   * snackbar toast can overlay the button and intercept the click, so we first wait
   * for any such toast to auto-dismiss.
   */
  private async clickContinue(): Promise<void> {
    await this.dismissSnackbar();
    await this.actions.click(this.locators.continueButton);
  }

  /** Option tiles a step can render, optionally narrowed to an exact (case-insensitive) label. */
  private optionTiles(text?: string): Locator {
    const base = this.locators.optionTiles.locator;
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

    // Selecting the "none" option avoids the follow-up required fields that ticking a
    // real option would trigger.
    const noneCheckbox = this.locators.noneCheckbox.locator;
    if (await noneCheckbox.count() > 0) {
      // Hidden inputs are positioned off-screen — DOM .click() bypasses coordinate
      // checks and still triggers Angular's change detection.
      await noneCheckbox.first().evaluate((el: HTMLElement) => el.click());
    } else {
      await this.locators.fallbackCheckboxLabel.locator.filter({ visible: true }).first().click();
    }
    await this.clickContinue();
  }

  /**
   * Answers every unanswered radiogroup on the page. Covers both single yes/no questions
   * (which auto-advance on selection with no CONTINUE) and the progressive multi-question
   * pages (e.g. walk-mile + climb-stairs + fitness-statement) that reveal more groups —
   * and their CONTINUE — only once earlier groups are answered. Per group: pick "Yes" when
   * the page calls for it and the group offers it, else the first radio (the healthiest
   * option, e.g. "About 10 seconds"). No toBeChecked(): single-question pages detach the
   * radio as they auto-advance. Clicks CONTINUE only once it has enabled; otherwise the
   * page auto-advances (or reveals more groups) and the outer loop re-enters.
   */
  private async answerAllRadiogroups(bodyText: string): Promise<void> {
    const preferYes = this.answerFor(bodyText) === 'Yes';
    const groups = this.locators.radioGroups.locator;
    const total = await groups.count();

    for (let i = 0; i < total; i++) {
      const group = groups.nth(i);
      if (await group.getByRole('radio', { checked: true }).count() > 0) continue;

      const yes = group.getByRole('radio', { name: 'Yes', exact: true });
      const radio = (preferYes && (await yes.count()) > 0) ? yes.first() : group.getByRole('radio').first();
      await radio.click().catch(() => undefined);
    }

    if (await this.isContinueEnabled()) await this.clickContinue().catch(() => undefined);
  }

  /**
   * Clicks whatever "proceed" control a transition / info page shows. Most steps use
   * the DS CONTINUE button, but transition pages (e.g. "Meet Gold") use a generic
   * element styled as a CONTINUE link. Dismisses any blocking snackbar first.
   */
  private async clickProceed(): Promise<void> {
    await this.dismissSnackbar();
    if (await this.verify.isElementVisible(this.locators.continueButton).catch(() => false)) {
      await this.actions.click(this.locators.continueButton);
    } else {
      await this.locators.proceedLink.locator.filter({ visible: true }).first().click();
    }
  }

  /**
   * Drives the remaining health questions and transitions. Each step is one of:
   *   • multi-select checkbox page (vitamins/meds/conditions) → safe "none" option + CONTINUE
   *   • radiogroup page (yes/no + progressive multi-question)  → answer all groups (+ CONTINUE)
   *   • single ds-option page (sex/patient/other-meds)         → click best option (auto-advance)
   *   • transition / info page (only a CONTINUE)               → click CONTINUE
   * Radiogroup is matched regardless of whether CONTINUE is present yet, because the
   * progressive pages reveal CONTINUE only after all their groups are answered.
   * Loops until the flow leaves /medical.
   */
  private async completeRemainingMedicalSteps(): Promise<void> {
    const stepControl = this.locators.stepControl.locator.first();

    for (let step = 0; step < 50; step++) {
      if (!this.page.url().includes('/medical')) break;
      await stepControl.waitFor({ state: 'visible' }).catch(() => undefined);
      if (!this.page.url().includes('/medical')) break;

      const bodyText      = (await this.locators.pageBody.locator.innerText().catch(() => '')).toLowerCase();
      const hasCheckbox   = (await this.locators.checkboxes.locator.count()) > 0;
      const hasRadiogroup = (await this.locators.radioGroups.locator.count()) > 0;
      const hasOptions    = (await this.optionTiles().count()) > 0;

      if (hasCheckbox) {
        await this.selectSafeCheckboxOption();
      } else if (hasRadiogroup) {
        await this.answerAllRadiogroups(bodyText);
      } else if (hasOptions) {
        await this.answerAutoAdvanceStep(bodyText);
      } else {
        // Transition / info page (e.g. "Meet Gold") — just proceed.
        await this.clickProceed();
      }
    }
  }

  private isMobileProject(): boolean {
    const viewport = this.testInfo.project.use.viewport;
    return this.testInfo.project.name.includes('mobile') || (typeof viewport?.width === 'number' && viewport.width < 800);
  }

  private async runWithDesktopViewport<T>(action: () => Promise<T>): Promise<T> {
    if (!this.isMobileProject()) {
      return action();
    }

    const originalViewport = this.page.viewportSize();
    await this.page.setViewportSize({ width: 1440, height: 900 });

    try {
      return await action();
    } finally {
      if (originalViewport) {
        await this.page.setViewportSize(originalViewport);
      }
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  async completeMedicalProfile(details: MedicalDetails): Promise<void> {
    await test.step('Complete medical profile', async () => {
      await this.runWithDesktopViewport(async () => {
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

        await this.page.waitForLoadState('load');
        await this.verify.waitForLoaderToDisappear();
        await this.verify.waitForProcessingLoaderToDisappear();
      });
    });
  }

  async verifyNavigatedToCheckout(): Promise<void> {
    await test.step('Verify navigation to checkout', async () => {
      await this.actions.waitForURL(/\/checkout/);
    });
  }

  /** Complete the whole medical profile, then confirm the flow reached checkout. */
  async completeMedicalAndProceed(details: MedicalDetails): Promise<void> {
    await test.step('Complete medical profile and reach checkout', async () => {
      await this.completeMedicalProfile(details);
      await this.verifyNavigatedToCheckout();
    });
  }
}
