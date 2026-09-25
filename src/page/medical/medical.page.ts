import { Page, TestInfo, test, expect, Locator } from '@playwright/test';
import * as path from 'path';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { MedicalDetails } from '@interfaces/signup-to-approved-order.interface';
import { MedicalEdgeCasesDetails, MedicalSymptomDetails } from '@interfaces/medical-edge-cases.interface';
import { MedicalNegativeDetails, MedicalNegativeStepDetails } from '@interfaces/medical-negative.interface';
import { VisualHelper } from '@utilities/visual.helper';
import { ApplitoolsVisualConfig, MEDICAL_FIGMA_CONFIG, GOLD_MEDICAL_STEPS_FIGMA_CONFIGS } from '@data/visual/figma.visual.data';

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
  private readonly visual?: VisualHelper;
  private readonly locators: { [key: string]: LocatorInfo };
  private readonly testInfo: TestInfo;
  private checkpointIndex = 0;

  constructor(page: Page, testInfo: TestInfo, visual?: VisualHelper) {
    this.page = page;
    this.testInfo = testInfo;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
    this.visual = visual;

    this.locators = {
      // ── Step 1: legal name ─────────────────────────────────────────────────
      firstNameInput: {
        description: 'Legal First Name Input',
        locator: this.page
          .locator(
            "//input[contains(@placeholder,'First Name') or @formcontrolname='first_name' or @formcontrolname='firstName'] | //ds-input[contains(@label,'First Name')]//input | //*[contains(text(),'Legal First Name')]/preceding-sibling::input | //*[contains(text(),'Legal First Name')]/following-sibling::input | //label[contains(.,'First Name')]//input | //input[@id='first_name' or @name='first_name']",
          )
          .first(),
      },
      lastNameInput: {
        description: 'Legal Last Name Input',
        locator: this.page
          .locator(
            "//input[contains(@placeholder,'Last Name') or @formcontrolname='last_name' or @formcontrolname='lastName'] | //ds-input[contains(@label,'Last Name')]//input | //*[contains(text(),'Legal Last Name')]/preceding-sibling::input | //*[contains(text(),'Legal Last Name')]/following-sibling::input | //label[contains(.,'Last Name')]//input | //input[@id='last_name' or @name='last_name']",
          )
          .first(),
      },

      // ── Step 2: date of birth ──────────────────────────────────────────────
      birthdayInput: {
        description: 'Date of Birth Input',
        locator: this.page
          .locator(
            "//input[@formcontrolname='birthday' or @formcontrolname='dob' or contains(@placeholder,'MM/DD/YYYY') or contains(@placeholder,'Birth')] | //*[contains(text(),'Birth Date')]/preceding-sibling::input | //*[contains(text(),'Birth Date')]/following-sibling::input | //label[contains(.,'Birth')]//input",
          )
          .first(),
      },

      // ── Active-step primary action — the single visible CONTINUE / SUBMIT ───
      continueButton: {
        description: 'Active Step CONTINUE / SUBMIT Button',
        locator: this.page.locator('button').filter({ hasText: /^(?:CONTINUE|SUBMIT)$/i }).filter({ visible: true }).first(),
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

      // ── Edge & Negative Case Locators ──────────────────────────────────────
      nonPatientWarning: {
        description: 'Non-patient Disqualification Warning Box',
        locator: this.page.locator('text=/This medical profile must be completed by the patient/i'),
      },
      explanationTextarea: {
        description: 'Mandatory Explanation Textarea',
        locator: this.page.locator('textarea'),
      },
      drugNameInput: {
        description: 'Prescription Drug Name Input',
        locator: this.page.locator('input[placeholder*="Drug Name" i], ds-input[label*="Drug Name" i] input'),
      },
      addMedicationBtn: {
        description: 'Add Medication Action Button',
        locator: this.page.locator('button:has-text("ADD"), button:has-text("+ ADD MORE MEDICATIONS")').first(),
      },
      nitricOxideAcknowledgmentCheckbox: {
        description: 'Nitric Oxide 36-Hour Safety Confirmation Checkbox',
        locator: this.page.locator('label:has-text("Please confirm you will NOT take Nitric Oxide within 36 hours"), [role="checkbox"]:near(:text("Nitric Oxide"))').last(),
      },
      contraindicatedWarningBanner: {
        description: 'Contraindicated Nitrates Safety Alert Banner',
        locator: this.page.locator('text=/combination of AMYL NITRITE|cause a dangerous drop in blood pressure/i'),
      },
      fileUploadInput: {
        description: 'Medical Attachment File Upload Input',
        locator: this.page.locator('input[type="file"]'),
      },
      fileSizeExceededError: {
        description: 'File Size Exceeded (5MB Limit) Error Text',
        locator: this.page.locator('text=/File size exceeds the limit of 5 MB/i'),
      },
      offLabelDenyWarning: {
        description: 'Off-label / Pregnancy Disqualification Warning Banner',
        locator: this.page.locator('text=/We cannot proceed|primary care provider/i'),
      },
      tryGoldHeading: {
        description: 'Try Gold / Match Heading on Checkout Page',
        locator: this.page
          .getByRole('heading', { name: /Your #1 Match Gold|Gold/i })
          .or(this.page.locator('h1, h2, h3, .ds-heading, [class*="heading"]').filter({ hasText: /Your #1 Match Gold|Gold|Checkout/i }))
          .filter({ visible: true })
          .first(),
      },
      tryGoldContinueBtn: {
        description: 'Continue Action on Checkout Landing Page',
        locator: this.page
          .getByText('CONTINUE', { exact: true })
          .or(this.page.locator('button, [role="button"], div, a').filter({ hasText: /^CONTINUE$/i }))
          .filter({ visible: true })
          .first(),
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

    // If an open empty medication form with CANCEL is blocking CONTINUE, cancel it
    const cancelButtons = this.page
      .getByRole('button', { name: /^CANCEL$/i })
      .or(this.page.locator('button:has-text("CANCEL")'))
      .or(this.page.locator('xpath=//button[normalize-space()="CANCEL"]'))
      .filter({ visible: true });
    const cancelCount = await cancelButtons.count();
    for (let i = 0; i < cancelCount; i++) {
      const c = cancelButtons.nth(i);
      if (await c.isVisible().catch(() => false)) {
        await c.click().catch(() => undefined);
        await this.page.waitForTimeout(300);
      }
    }

    const btn = this.locators.continueButton.locator;
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.scrollIntoViewIfNeeded().catch(() => undefined);
    await btn.click({ timeout: 10000 });
    await this.page.waitForTimeout(500);
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
  private async completeRemainingMedicalSteps(captureCheckpoints = false): Promise<void> {
    const stepControl = this.locators.stepControl.locator.first();
    let walk1MileCount = 0;

    for (let step = 0; step < 50; step++) {
      if (!this.page.url().includes('/medical')) break;
      await stepControl.waitFor({ state: 'visible' }).catch(() => undefined);
      if (!this.page.url().includes('/medical')) break;

      const bodyText      = (await this.locators.pageBody.locator.innerText().catch(() => '')).toLowerCase();
      const hasCheckbox   = (await this.locators.checkboxes.locator.count()) > 0;
      const hasRadiogroup = (await this.locators.radioGroups.locator.count()) > 0;
      const hasOptions    = (await this.optionTiles().count()) > 0;

      if (captureCheckpoints) {
        // Extract a clean segment from the bodyText or title for the snapshot tag
        const titleLine = bodyText.split('\n')[0] || `Step ${step + 6}`;
        const tag = `Gold Medical - ${titleLine.substring(0, 45)}`;

        let skipCheckpoint = false;
        if (tag.toLowerCase().includes('walk 1 mile')) {
          walk1MileCount++;
          if (walk1MileCount > 2) {
            skipCheckpoint = true;
          }
        }

        if (!skipCheckpoint) {
          await this.captureGoldMedicalCheckpoint(tag);
        }
      }

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

  /** Completes all 16 questions when the medical intake renders as a single-page form rather than step-by-step. */
  private async completeSinglePageMedicalForm(details: MedicalDetails): Promise<void> {
    console.log('[MedicalPage] Detected Unified Single-Page Medical Form. Completing all 16 questions...');

    // Q1: Personal info
    await this.actions.sendKeys(this.locators.firstNameInput, details.firstName);
    await this.actions.sendKeys(this.locators.lastNameInput, details.lastName);

    // Birthday field
    const birthdayLocator = this.page
      .locator(
        "//input[@formcontrolname='birthday' or @formcontrolname='dob' or contains(@placeholder,'MM/DD/YYYY') or contains(@placeholder,'Birth')] | //*[contains(text(),'Birth Date')]/preceding-sibling::input | //*[contains(text(),'Birth Date')]/following-sibling::input | //label[contains(.,'Birth')]//input",
      )
      .first();
    await birthdayLocator.click();
    await birthdayLocator.pressSequentially(details.birthday.replace(/\//g, ''), { delay: 50 });

    // Q2: Sex -> Male
    const sexMale = this.page
      .locator('//h6[contains(text(),"2.")]/following::*[@role="radio" or @type="radio" or self::label][contains(.,"Male") or @value="Male"][1]')
      .first();
    if ((await sexMale.count()) > 0) {
      await sexMale.click().catch(() => undefined);
    } else {
      await this.page.getByRole('radio', { name: 'Male', exact: true }).first().click().catch(() => undefined);
    }

    // Q3: Patient -> Yes
    const patientYes = this.page
      .locator('//h6[contains(text(),"3.")]/following::*[@role="radio" or @type="radio" or self::label][contains(.,"Yes") or @value="Yes"][1]')
      .first();
    if ((await patientYes.count()) > 0) {
      await patientYes.click().catch(() => undefined);
    }

    // Q4: Reason -> Select first option
    const reasonCb = this.page
      .locator('//h6[contains(text(),"4.")]/following::*[@role="checkbox" or @type="checkbox" or self::label][1]')
      .first();
    if ((await reasonCb.count()) > 0) {
      await reasonCb.click().catch(() => undefined);
    }

    // Q5: Walk 1 mile -> Yes
    const walkYes = this.page
      .locator('//h6[contains(text(),"5.")]/following::*[@role="radio" or @type="radio" or self::label][contains(.,"Yes") or @value="Yes"][1]')
      .first();
    if ((await walkYes.count()) > 0) {
      await walkYes.click().catch(() => undefined);
    }

    // Q6: Climb 2 flights -> About 10 seconds
    const climb10 = this.page
      .locator('//h6[contains(text(),"6.")]/following::*[@role="radio" or @type="radio" or self::label][contains(.,"10 seconds")][1]')
      .first();
    if ((await climb10.count()) > 0) {
      await climb10.click().catch(() => undefined);
    } else {
      const firstClimb = this.page
        .locator('//h6[contains(text(),"6.")]/following::*[@role="radio" or @type="radio" or self::label][1]')
        .first();
      await firstClimb.click().catch(() => undefined);
    }

    // Q7: Told NOT to have sex -> No
    const q7No = this.page
      .locator('//h6[contains(text(),"7.")]/following::*[@role="radio" or @type="radio" or self::label][contains(.,"No") or @value="No"][1]')
      .first();
    if ((await q7No.count()) > 0) {
      await q7No.click().catch(() => undefined);
    }

    // Q8: Low blood pressure -> No
    const q8No = this.page
      .locator('//h6[contains(text(),"8.")]/following::*[@role="radio" or @type="radio" or self::label][contains(.,"No") or @value="No"][1]')
      .first();
    if ((await q8No.count()) > 0) {
      await q8No.click().catch(() => undefined);
    }

    // Q9: High blood pressure -> No
    const q9No = this.page
      .locator('//h6[contains(text(),"9.")]/following::*[@role="radio" or @type="radio" or self::label][contains(.,"No") or @value="No"][1]')
      .first();
    if ((await q9No.count()) > 0) {
      await q9No.click().catch(() => undefined);
    }

    // Q10: Vitamins/supplements -> "I DO NOT take any of these"
    const q10None = this.page
      .locator('//h6[contains(text(),"10.")]/following::*[contains(normalize-space(),"DO NOT take any of these") or contains(.,"I DO NOT")][1]')
      .first();
    if ((await q10None.count()) > 0) {
      await q10None.click().catch(() => undefined);
    }

    // Q11: Medications -> "I DO NOT take any of these"
    const q11None = this.page
      .locator('//h6[contains(text(),"11.")]/following::*[contains(normalize-space(),"DO NOT take any of these") or contains(.,"I DO NOT")][1]')
      .first();
    if ((await q11None.count()) > 0) {
      await q11None.click().catch(() => undefined);
    }

    // Q12: Allergies -> No
    const q12No = this.page
      .locator('//h6[contains(text(),"12.")]/following::*[@role="radio" or @type="radio" or self::label][contains(.,"No") or @value="No"][1]')
      .first();
    if ((await q12No.count()) > 0) {
      await q12No.click().catch(() => undefined);
    }

    // Q13: Medical conditions -> "I have NONE of these"
    const q13None = this.page
      .locator('//h6[contains(text(),"13.")]/following::*[contains(normalize-space(),"I have NONE of these") or contains(.,"NONE")][1]')
      .first();
    if ((await q13None.count()) > 0) {
      await q13None.click().catch(() => undefined);
    }

    // Q14: Other medical conditions -> No
    const q14No = this.page
      .locator('//h6[contains(text(),"14.")]/following::*[@role="radio" or @type="radio" or self::label][contains(.,"No") or @value="No"][1]')
      .first();
    if ((await q14No.count()) > 0) {
      await q14No.click().catch(() => undefined);
    }

    // Q15: Other medications -> "I am NOT taking any other medication."
    const q15None = this.page
      .locator('//h6[contains(text(),"15.")]/following::*[contains(normalize-space(),"NOT taking any other medication")][1]')
      .first();
    if ((await q15None.count()) > 0) {
      await q15None.click().catch(() => undefined);
    }

    // Q16: Anything else -> No
    const q16No = this.page
      .locator('//h6[contains(text(),"16.")]/following::*[@role="radio" or @type="radio" or self::label][contains(.,"No") or @value="No"][1]')
      .first();
    if ((await q16No.count()) > 0) {
      await q16No.click().catch(() => undefined);
    }

    // Click Submit
    const submitBtn = this.page
      .locator('//button[normalize-space()="Submit" or contains(.,"Submit") or @type="submit"]')
      .first();
    await submitBtn.scrollIntoViewIfNeeded().catch(() => undefined);
    await submitBtn.click();
    await this.page.waitForLoadState('load').catch(() => undefined);
    await this.verify.waitForLoaderToDisappear().catch(() => undefined);
    await this.verify.waitForProcessingLoaderToDisappear().catch(() => undefined);
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  async completeMedicalProfile(details: MedicalDetails, captureCheckpoints = false): Promise<void> {
    await test.step('Complete medical profile', async () => {
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);

      // Check if this is the all-in-one / single-page medical form
      const isSinglePage =
        (await this.page.locator('//button[normalize-space()="Submit" or contains(.,"Submit")]').count() > 0) ||
        (await this.page.locator('text=1. Enter your personal information').count() > 0) ||
        (await this.page.locator('text=16. Is there anything else').count() > 0);

      if (isSinglePage) {
        await this.completeSinglePageMedicalForm(details);
        return;
      }

      // ── Step 1: Legal name ─────────────────────────────────────────────────
      await test.step('Enter legal name', async () => {
        if (captureCheckpoints) {
          await this.captureGoldMedicalCheckpoint('Gold Medical - Step 1 Legal Name');
        }
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
        if (captureCheckpoints) {
          await this.captureGoldMedicalCheckpoint('Gold Medical - Step 3 Sex');
        }
        await this.optionTiles('Male').first().click();
      });

      // ── Step 4: Patient → Yes (auto-advances) ─────────────────────────────
      await test.step('Confirm patient status', async () => {
        if (captureCheckpoints) {
          await this.captureGoldMedicalCheckpoint('Gold Medical - Step 4 Patient Status');
        }
        await this.optionTiles('Yes').first().click();
      });

      // ── Step 5: Reason for choosing BlueChew — checkboxes ─────────────────
      await test.step('Select reason for choosing BlueChew', async () => {
        if (captureCheckpoints) {
          await this.captureGoldMedicalCheckpoint('Gold Medical - Step 5 Reason');
        }
        await this.selectSafeCheckboxOption();
      });

      // ── Steps 6+: remaining health questions ──────────────────────────────
      await test.step('Complete remaining health questions', async () => {
        await this.completeRemainingMedicalSteps(captureCheckpoints);
      });

      await this.page.waitForLoadState('load');
      await this.verify.waitForLoaderToDisappear();
      await this.verify.waitForProcessingLoaderToDisappear();
    });
  }

  async verifyNavigatedToCheckout(): Promise<void> {
    await test.step('Verify navigation to checkout page and assert Try Gold match landing header', async () => {
      await this.actions.waitForURL(/\/checkout/);
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);

      // Assert visible Try Gold / Checkout landing heading (clearly visible to user at first glance)
      await this.verify.waitForVisibility(this.locators.tryGoldHeading);
      const isHeadingVisible = await this.verify.isElementVisible(this.locators.tryGoldHeading);
      expect(isHeadingVisible).toBeTruthy();

      // Assert primary checkout / Try Gold CONTINUE CTA is visible
      await this.verify.waitForVisibility(this.locators.tryGoldContinueBtn);
      const isContinueVisible = await this.verify.isElementVisible(this.locators.tryGoldContinueBtn);
      expect(isContinueVisible).toBeTruthy();
    });
  }

  /** Complete the whole medical profile, then confirm the flow reached checkout. */
  async completeMedicalAndProceed(details: MedicalDetails): Promise<void> {
    await test.step('Complete medical profile and reach checkout', async () => {
      await this.completeMedicalProfile(details);
      await this.verifyNavigatedToCheckout();
    });
  }

  async captureGoldMedicalCheckpoint(tag: string): Promise<void> {
    const config = GOLD_MEDICAL_STEPS_FIGMA_CONFIGS[this.checkpointIndex] || GOLD_MEDICAL_STEPS_FIGMA_CONFIGS[GOLD_MEDICAL_STEPS_FIGMA_CONFIGS.length - 1];
    await this.captureMedicalSnapshot(config, tag);
    this.checkpointIndex++;
  }

  async captureMedicalSnapshot(visualConfig: ApplitoolsVisualConfig = MEDICAL_FIGMA_CONFIG, tag: string = 'Medical page loaded'): Promise<void> {
    await test.step(`Capture the fully loaded ${tag} state`, async () => {
      await this.page.waitForLoadState('load').catch(() => undefined);
      if (this.visual) {
        await this.visual.captureCheckpoint(tag, visualConfig);
      }
    });
  }

  /**
   * Complete medical profile with initial snapshot capture.
   */
  async completeMedicalWithVisual(visualConfig: ApplitoolsVisualConfig = MEDICAL_FIGMA_CONFIG, details: MedicalDetails, captureStepByStep = false): Promise<void> {
    await this.page.waitForURL(/\/medical/);
    await this.captureMedicalSnapshot(visualConfig, 'Gold Medical Page');
    await this.completeMedicalProfile(details, captureStepByStep);
  }

  /**
   * Complete medical questionnaire with step-by-step progressive visual checkpoints.
   */
  async completeGoldMedicalVisual(details: MedicalDetails): Promise<void> {
    await this.page.waitForURL(/\/medical/);
    await this.captureGoldMedicalCheckpoint('Gold Medical Page');
    await this.completeMedicalProfile(details, true);
  }

  // ── Edge & Negative Case Methods ──────────────────────────────────────────

  /**
   * Enter legal name on step 1 of medical wizard.
   */
  async enterLegalName(firstName: string, lastName: string): Promise<void> {
    await test.step(`Enter legal name: ${firstName} ${lastName}`, async () => {
      await this.actions.sendKeys(this.locators.firstNameInput, firstName);
      await this.actions.sendKeys(this.locators.lastNameInput, lastName);
      await this.clickContinue();
    });
  }

  /**
   * Enter date of birth on step 2 of medical wizard.
   */
  async enterDateOfBirth(birthday: string): Promise<void> {
    await test.step(`Enter date of birth: ${birthday}`, async () => {
      await this.actions.click(this.locators.birthdayInput);
      await this.locators.birthdayInput.locator.pressSequentially(birthday.replace(/\//g, ''), { delay: 50 });
      await this.clickContinue();
    });
  }

  /**
   * Select biological sex on step 3 of medical wizard.
   */
  async selectBiologicalSex(sex: 'Male' | 'Female' = 'Male'): Promise<void> {
    await test.step(`Select biological sex: ${sex}`, async () => {
      await this.optionTiles(sex).first().click();
    });
  }

  /**
   * Negative Test: Select 'No' on patient status to verify disqualification warning,
   * then select 'Yes' to recover and continue.
   */
  async testPatientStatusDisqualification(warningText: string): Promise<void> {
    await test.step('Verify non-patient disqualification alert', async () => {
      // Step 1: Select "No"
      await this.optionTiles('No').first().click();

      // Step 2: Verify disqualification warning appears
      await this.verify.waitForVisibility(this.locators.nonPatientWarning);
      const isWarningVisible = await this.verify.isElementVisible(this.locators.nonPatientWarning);
      if (!isWarningVisible) {
        throw new Error(`Expected non-patient warning to be visible with text: ${warningText}`);
      }

      // Step 3: Switch to "Yes" to satisfy requirement and proceed
      await this.optionTiles('Yes').first().click();
    });
  }

  /**
   * Select reason for choosing BlueChew.
   */
  async selectReasonForBlueChew(): Promise<void> {
    await test.step('Select reason for choosing BlueChew', async () => {
      await this.selectSafeCheckboxOption();
    });
  }

  /**
   * Edge Case: Physical capability with symptoms.
   * Answering 'No' opens mandatory explanation textarea.
   */
  async answerPhysicalActivityWithChestPain(explanation: string): Promise<void> {
    await test.step('Answer physical activity chest pain question and provide required explanation', async () => {
      const noOption = this.optionTiles('No');
      if (await noOption.count() > 0) {
        await noOption.first().click();
      } else {
        const noRadio = this.page.getByRole('radio', { name: 'No', exact: true });
        if (await noRadio.count() > 0) await noRadio.first().click();
      }

      // Verify explanation textarea appears and fill it
      await this.verify.waitForVisibility(this.locators.explanationTextarea);
      await this.actions.sendKeys(this.locators.explanationTextarea, explanation);
      await this.clickContinue();
    });
  }

  /**
   * Edge Case: High Blood Pressure medication form.
   * Selecting 'Yes, I take medication to treat it' requires entering drug name and adding it.
   */
  async answerHighBloodPressureWithMedication(drugName: string): Promise<void> {
    await test.step(`Enter blood pressure medication: ${drugName}`, async () => {
      const medOption = this.page.locator('button.ds-option-selector__option, [role="radio"]')
        .filter({ hasText: /take medication to treat it/i }).first();
      
      if (await medOption.count() > 0) {
        await medOption.click();
      }

      if (await this.locators.drugNameInput.locator.count() > 0 && await this.locators.drugNameInput.locator.first().isVisible()) {
        await this.actions.sendKeys(this.locators.drugNameInput, drugName);
        if (await this.locators.addMedicationBtn.locator.count() > 0) {
          await this.locators.addMedicationBtn.locator.first().click();
        }
      }

      if (await this.isContinueEnabled()) {
        await this.clickContinue();
      }
    });
  }

  /**
   * Edge Case: Nitric Oxide safety confirmation.
   * Selecting 'Nitric Oxide' displays mandatory 36-hour safety checkbox.
   */
  async selectNitricOxideWithSafetyAcknowledgment(): Promise<void> {
    await test.step('Select Nitric Oxide and confirm 36-hour safety requirement', async () => {
      const nitricCheckbox = this.page.getByRole('checkbox', { name: /nitric oxide/i }).first();
      if (await nitricCheckbox.count() > 0) {
        await nitricCheckbox.evaluate((el: HTMLElement) => el.click());
      } else {
        const nitricLabel = this.page.locator('label:has-text("Nitric Oxide")').first();
        if (await nitricLabel.count() > 0) await nitricLabel.click();
      }

      // Acknowledge the 36-hour safety confirmation
      const ackCheckbox = this.page.locator('text=/confirm you will NOT take Nitric Oxide within 36 hours/i').first();
      if (await ackCheckbox.count() > 0) {
        await ackCheckbox.click().catch(() => undefined);
      }

      await this.clickContinue();
    });
  }

  /**
   * Edge Case: Contraindicated medications (Nitrates / Poppers).
   * Verifies critical warning banner and enters mandatory reason.
   */
  async selectContraindicatedNitratesAndVerifySafetyWarning(reason: string): Promise<void> {
    await test.step('Select contraindicated nitrates and verify dangerous combination warning', async () => {
      const poppersCheckbox = this.page.getByRole('checkbox', { name: /amyl nitrite|poppers|isosorbide/i }).first();
      if (await poppersCheckbox.count() > 0) {
        await poppersCheckbox.evaluate((el: HTMLElement) => el.click());
      } else {
        const poppersLabel = this.page.locator('label:has-text("Amyl Nitrite"), label:has-text("Isosorbide")').first();
        if (await poppersLabel.count() > 0) await poppersLabel.click();
      }

      // Verify safety warning banner is displayed
      await this.verify.waitForVisibility(this.locators.contraindicatedWarningBanner);

      // Provide required reason
      if (await this.locators.explanationTextarea.locator.count() > 0) {
        await this.actions.sendKeys(this.locators.explanationTextarea, reason);
      }

      await this.clickContinue();
    });
  }

  /**
   * Edge Case: Nausea / IBS medication with explanation.
   */
  async selectNauseaMedicationWithReason(reason: string): Promise<void> {
    await test.step('Select nausea medication and provide reason', async () => {
      const nauseaMedCheckbox = this.page.getByRole('checkbox', { name: /granisetron|ondansetron/i }).first();
      if (await nauseaMedCheckbox.count() > 0) {
        await nauseaMedCheckbox.evaluate((el: HTMLElement) => el.click());
      }

      if (await this.locators.explanationTextarea.locator.count() > 0) {
        await this.actions.sendKeys(this.locators.explanationTextarea, reason);
      }

      await this.clickContinue();
    });
  }

  /**
   * Edge Case: Symptom assessment with frequency and physician monitoring branching.
   */
  async answerSymptomAssessment(symptomDetails: MedicalSymptomDetails): Promise<void> {
    await test.step('Complete symptom assessment with frequency and provider monitoring', async () => {
      const symptomCheckbox = this.page.getByRole('checkbox', { name: /fainting|lightheadedness|neurological/i }).first();
      if (await symptomCheckbox.count() > 0) {
        await symptomCheckbox.evaluate((el: HTMLElement) => el.click());
      }

      // Enter symptom description
      if (await this.locators.explanationTextarea.locator.count() > 0) {
        await this.actions.sendKeys(this.locators.explanationTextarea, symptomDetails.explainSymptoms);
      }

      // Select frequency (e.g. Rarely)
      const freqOption = this.page.locator('button, [role="radio"], label').filter({ hasText: new RegExp(`^${symptomDetails.frequency}$`, 'i') }).first();
      if (await freqOption.count() > 0) {
        await freqOption.click().catch(() => undefined);
      }

      if (await this.isContinueEnabled()) {
        await this.clickContinue();
      }
    });
  }

  /**
   * Edge Case: File upload size limit validation (> 5MB reject).
   */
  async testFileUploadSizeLimit(notes: string, oversizedFilePath: string, expectedErrorText: string): Promise<void> {
    await test.step('Verify 5MB file upload limit rejection', async () => {
      // Select "Yes" to provide additional information
      const yesOption = this.optionTiles('Yes').first();
      if (await yesOption.count() > 0) {
        await yesOption.click();
      }

      // Fill additional notes
      if (await this.locators.explanationTextarea.locator.count() > 0) {
        await this.actions.sendKeys(this.locators.explanationTextarea, notes);
      }

      // Upload oversized file
      const fileInput = this.locators.fileUploadInput.locator.first();
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles(oversizedFilePath);
        
        // Verify file size error appears
        await this.verify.waitForVisibility(this.locators.fileSizeExceededError);
        const isErrorVisible = await this.verify.isElementVisible(this.locators.fileSizeExceededError);
        if (!isErrorVisible) {
          throw new Error(`Expected file size limit error: "${expectedErrorText}" to be displayed.`);
        }
      }

      // Complete submission / continue
      const noOption = this.optionTiles('No').first();
      if (await noOption.count() > 0) {
        await noOption.click();
      } else if (await this.isContinueEnabled()) {
        await this.clickContinue();
      }
    });
  }

  /**
   * Master execution method for medical negative and edge cases flow.
   */
  async completeMedicalWithEdgeCases(data: MedicalEdgeCasesDetails | MedicalNegativeDetails): Promise<void> {
    await test.step('Complete medical questionnaire covering negative validations and edge cases', async () => {
      const reg = data.registration.medical;

      // ── Step 1: Legal Name ────────────────────────────────────────────────
      await this.enterLegalName(reg.firstName, reg.lastName);

      // ── Step 2: Date of Birth ─────────────────────────────────────────────
      await this.enterDateOfBirth(reg.birthday);

      // ── Step 3: Biological Sex ────────────────────────────────────────────
      await this.selectBiologicalSex('Male');

      // ── Step 4: Disqualification Negative Test ────────────────────────────
      await this.testPatientStatusDisqualification(data.nonPatientWarningText);

      // ── Step 5: Reason for choosing BlueChew ──────────────────────────────
      await this.selectReasonForBlueChew();

      // ── Steps 6+: Drive remaining questions including edge cases ───────────
      await this.completeRemainingMedicalSteps();

      await this.page.waitForLoadState('load');
      await this.verify.waitForLoaderToDisappear();
      await this.verify.waitForProcessingLoaderToDisappear();
    });
  }

  /**
   * Helper to select a radio/button option for a specific question text.
   */
  async selectOptionForQuestion(questionPattern: RegExp, optionPattern: RegExp): Promise<boolean> {
    const questionTextEl = this.page.getByText(questionPattern).first();
    if ((await questionTextEl.count()) > 0) {
      const option = questionTextEl
        .locator('xpath=following::*[self::label or self::button or @role="radio" or contains(@class,"custom-multi-option-select") or contains(@class,"ds-option-selector__option") or contains(@class,"ds-checkbox")]')
        .filter({ hasText: optionPattern })
        .first();
      if ((await option.count()) > 0 && (await option.isVisible().catch(() => false))) {
        await option.scrollIntoViewIfNeeded().catch(() => undefined);
        await option.click().catch(() => undefined);
        return true;
      }
    }

    return false;
  }

  /**
   * Helper to select a radio/button option for ALL instances of matching question text on the page.
   */
  async selectAllOptionsForQuestion(questionPattern: RegExp, optionPattern: RegExp): Promise<number> {
    const questionTextEls = this.page.getByText(questionPattern);
    const count = await questionTextEls.count();
    let selected = 0;
    for (let i = 0; i < count; i++) {
      const qEl = questionTextEls.nth(i);
      if (!(await qEl.isVisible().catch(() => false))) continue;

      const option = qEl
        .locator('xpath=following::*[self::label or self::button or @role="radio" or contains(@class,"custom-multi-option-select") or contains(@class,"ds-option-selector__option") or contains(@class,"ds-checkbox")]')
        .filter({ hasText: optionPattern })
        .first();

      if ((await option.count()) > 0 && (await option.isVisible().catch(() => false))) {
        await option.scrollIntoViewIfNeeded().catch(() => undefined);
        await option.click().catch(() => undefined);
        await this.page.waitForTimeout(200);
        selected++;
      }
    }
    return selected;
  }

  /**
   * Helper to fill and submit the inline Drug Name / Reason medication form.
   */
  /**
   * Helper to fill and submit the inline Drug Name / Reason medication form.
   * Immediately selects from dropdown when it opens to prevent overlay blocking.
   */
  async addMedicationForm(drugName: string, reason?: string): Promise<void> {
    const drugInput = this.page
      .locator('input[placeholder*="Drug Name" i], ds-input[label*="Drug Name" i] input, input[aria-label*="Drug Name" i]')
      .or(this.page.getByRole('textbox', { name: /drug name/i }))
      .filter({ visible: true })
      .first();

    await drugInput.waitFor({ state: 'visible', timeout: 5000 });
    await drugInput.scrollIntoViewIfNeeded().catch(() => undefined);
    await drugInput.click();
    await drugInput.fill(drugName);

    // Look for autocomplete dropdown suggestions and click immediately
    const dropdownOptions = this.page
      .locator(
        'button.option, .ds-autocomplete__option, .ds-autocomplete__item, .ds-typeahead__option, .ds-typeahead__item, ' +
        '.cdk-overlay-pane [role="option"], .cdk-overlay-pane button, .cdk-overlay-pane li, .cdk-overlay-pane span, ' +
        '[role="listbox"] [role="option"], [role="listbox"] button, [role="listbox"] li, [role="listbox"] div, ' +
        '[role="option"], li.option, div.option, ul.dropdown-menu li, .dropdown-item, .item'
      )
      .filter({ visible: true });

    try {
      await dropdownOptions.first().waitFor({ state: 'visible', timeout: 1500 });
      const matchingOpt = dropdownOptions.filter({ hasText: new RegExp(drugName.trim(), 'i') }).first();
      if ((await matchingOpt.count()) > 0 && (await matchingOpt.isVisible().catch(() => false))) {
        await matchingOpt.click({ force: true });
      } else {
        await dropdownOptions.first().click({ force: true });
      }
      await this.page.waitForTimeout(200);
    } catch {
      // If no dropdown appeared, press Enter to submit text
      await drugInput.press('Enter').catch(() => undefined);
    }

    if (reason) {
      const reasonInput = this.page
        .locator('input[placeholder*="Reason" i], textarea[placeholder*="Reason" i], input[formcontrolname="reason"], textarea[formcontrolname="reason"]')
        .or(drugInput.locator('xpath=following::textarea[1] | following::input[1]'))
        .filter({ visible: true })
        .first();
      if ((await reasonInput.count()) > 0 && (await reasonInput.isVisible().catch(() => false))) {
        await reasonInput.scrollIntoViewIfNeeded().catch(() => undefined);
        await reasonInput.click().catch(() => undefined);
        await reasonInput.fill(reason).catch(() => undefined);
      }
    }

    const addBtn = this.page
      .getByRole('button', { name: 'ADD', exact: true })
      .or(this.page.locator('//button[normalize-space()="ADD" or contains(normalize-space(),"ADD")]'))
      .filter({ visible: true })
      .first();

    if ((await addBtn.count()) > 0) {
      await addBtn.scrollIntoViewIfNeeded().catch(() => undefined);
      await addBtn.click({ force: true }).catch(() => undefined);
      await this.page.waitForTimeout(500);

      // If ADD is still visible, press Enter and click again
      if (await addBtn.isVisible().catch(() => false)) {
        await this.page.keyboard.press('Enter').catch(() => undefined);
        await addBtn.click({ force: true }).catch(() => undefined);
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Helper to click an option tile, checkbox, or radio matching a text pattern.
   */
  async clickOptionTile(textPattern: RegExp | string): Promise<void> {
    let pattern: RegExp;
    if (typeof textPattern === 'string') {
      const escaped = textPattern
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/["“”]/g, '["“”]')
        .replace(/['‘’]/g, "['‘’]");
      pattern = new RegExp(escaped, 'i');
    } else {
      pattern = textPattern;
    }

    const checkbox = this.page.getByRole('checkbox', { name: pattern }).first();
    if ((await checkbox.count()) > 0 && (await checkbox.isVisible().catch(() => false))) {
      await checkbox.scrollIntoViewIfNeeded().catch(() => undefined);
      await checkbox.click().catch(() => undefined);
      await this.page.waitForTimeout(300);
      return;
    }

    const radio = this.page.getByRole('radio', { name: pattern }).first();
    if ((await radio.count()) > 0 && (await radio.isVisible().catch(() => false))) {
      await radio.scrollIntoViewIfNeeded().catch(() => undefined);
      await radio.click().catch(() => undefined);
      await this.page.waitForTimeout(300);
      return;
    }

    const target = this.page
      .locator('label, button, [role="checkbox"], [role="radio"], .ds-option-selector__option, .ds-checkbox')
      .filter({ hasText: pattern })
      .or(this.page.getByText(pattern))
      .filter({ visible: true })
      .first();

    await target.waitFor({ state: 'visible', timeout: 10000 });
    await target.scrollIntoViewIfNeeded().catch(() => undefined);
    await target.click();
    await this.page.waitForTimeout(300);
  }

  // ── Modular Clinical Step Methods for Medical Negative & Questionnaire Flows ──

  /**
   * Step 5 (if shown): Off-label Treatment & Pregnancy Disclosures.
   * Confirms off-label use, answers pregnancy questions, tests Deny warning, and recovers with Confirm.
   */
  async verifyOffLabelAndPregnancyDisclosures(): Promise<void> {
    const offLabelTitle = this.page.locator('text=/off-label|pregnant or breastfeeding/i').first();
    if ((await offLabelTitle.count()) > 0 && (await offLabelTitle.isVisible().catch(() => false))) {
      await test.step('Verify off-label and pregnancy disclosures', async () => {
        await this.selectOptionForQuestion(/off-label/i, /Confirm/i);
        await this.selectOptionForQuestion(/pregnant or breastfeeding/i, /No/i);

        // Deny pregnancy disclaimer -> verify red warning banner -> Confirm
        const denyClicked = await this.selectOptionForQuestion(/will not use this treatment if you become pregnant/i, /Deny/i);
        if (denyClicked) {
          await this.verify.waitForVisibility(this.locators.offLabelDenyWarning).catch(() => undefined);
          await this.selectOptionForQuestion(/will not use this treatment if you become pregnant/i, /Confirm/i);
        }

        await this.clickContinue();
      });
    }
  }

  /**
   * Step 6: Select specific reasons for choosing BlueChew.
   */
  async selectReasonsForBlueChew(reasons: string[]): Promise<void> {
    await test.step('Select specific BlueChew reasons', async () => {
      const reasonHeader = this.page.getByText(/reason for choosing bluechew/i).first();
      await reasonHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      for (const reason of reasons) {
        await this.clickOptionTile(reason);
      }
      await this.clickContinue();
    });
  }

  /**
   * Step 7: Exercise and Physical Fitness assessment.
   * Handles Walk 1 mile (Yes), Climb 2 flights ("I cannot"), Poor physical fitness ("No"),
   * Sex without chest pain ("No"), and fills required explanation textareas.
   */
  async answerExerciseAndPhysicalFitness(explanation = 'Test'): Promise<void> {
    await test.step('Answer exercise and physical fitness questions with negative branches', async () => {
      const walkHeader = this.page.getByText(/walk 1 mile|climb 2 flights/i).first();
      await walkHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      // Walk 1 mile -> Yes
      await this.selectOptionForQuestion(/walk 1 mile/i, /^Yes$/i);

      // Climb 2 flights -> "I cannot"
      await this.selectOptionForQuestion(/climb 2 flights/i, /I cannot/i);

      // Poor physical fitness agreement -> "No"
      await this.selectOptionForQuestion(/poor physical fitness/i, /^No$/i);

      // Sex without chest pain -> "No"
      await this.selectOptionForQuestion(/without chest pain/i, /^No$/i);

      // Fill all visible textareas with explanation
      const textareas = this.page.locator('textarea').filter({ visible: true });
      const count = await textareas.count();
      for (let i = 0; i < count; i++) {
        await textareas.nth(i).fill(explanation).catch(() => undefined);
      }

      await this.clickContinue();
    });
  }

  /**
   * Step 8: Told NOT to have sex question (auto-advancing single choice).
   */
  async answerToldNotToHaveSex(answer: 'Yes' | 'No' = 'No'): Promise<void> {
    await test.step(`Answer told NOT to have sex question with: ${answer} (auto-advance)`, async () => {
      const sexHeader = this.page.getByText(/told you not to have sex/i).first();
      await sexHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      const opt = sexHeader
        .locator('xpath=following::*[@role="radiogroup" or contains(@class,"option-selector")][1]')
        .locator('[role="radio"], button, label, .ds-option-selector__option')
        .filter({ hasText: new RegExp(`^${answer}$`, 'i') })
        .first();

      if ((await opt.count()) > 0) {
        await opt.click();
      } else {
        await this.selectOptionForQuestion(/told you not to have sex/i, new RegExp(`^${answer}$`, 'i'));
      }
    });
  }

  /**
   * Step 9: Low Blood Pressure diagnosis (auto-advancing single choice).
   */
  async answerLowBloodPressure(answer: 'Yes' | 'No' = 'No'): Promise<void> {
    await test.step(`Answer low blood pressure diagnosis with: ${answer} (auto-advance)`, async () => {
      const lowBpHeader = this.page.getByText(/low blood pressure/i).first();
      await lowBpHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      const opt = lowBpHeader
        .locator('xpath=following::*[@role="radiogroup" or contains(@class,"option-selector")][1]')
        .locator('[role="radio"], button, label, .ds-option-selector__option')
        .filter({ hasText: new RegExp(`^${answer}$`, 'i') })
        .first();

      if ((await opt.count()) > 0) {
        await opt.click();
      } else {
        await this.selectOptionForQuestion(/low blood pressure/i, new RegExp(`^${answer}$`, 'i'));
      }
    });
  }

  /**
   * Step 10: High Blood Pressure (Hypertension) Branching & Medication Entry.
   * Selects non-medication lifestyle options first, then switches to medication and enters drug details.
   */
  async answerBloodPressureDiagnosis(lifestyleOptions: string[], lifestyleExplanation: string, drugName: string): Promise<void> {
    await test.step('Answer blood pressure diagnosis with lifestyle options and medication entry', async () => {
      const highBpHeader = this.page.getByText(/high blood pressure|hypertension/i).first();
      await highBpHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      // Option 1: "Yes, but I do not take medication to treat it."
      const noMedOpt = this.page
        .locator('button.ds-option-selector__option, [role="radio"], label')
        .filter({ hasText: /do not take medication/i })
        .first();
      if ((await noMedOpt.count()) > 0) {
        await noMedOpt.click();

        // Check lifestyle options (Diet, Exercise, Other)
        for (const optName of lifestyleOptions) {
          await this.clickOptionTile(optName);
        }

        // Fill explanation textarea
        const textareas = this.page.locator('textarea').filter({ visible: true });
        if ((await textareas.count()) > 0) {
          await textareas.first().fill(lifestyleExplanation).catch(() => undefined);
        }
      }

      // Option 2: Switch to "Yes, I take medication to treat it."
      const medOpt = this.page
        .locator('button.ds-option-selector__option, [role="radio"], label')
        .filter({ hasText: /take medication to treat it/i })
        .first();
      if ((await medOpt.count()) > 0) {
        await medOpt.click();
      }

      // Add Drug Name
      await this.addMedicationForm(drugName);

      await this.clickContinue();
    });
  }

  /**
   * Step 11: Vitamins & Supplements.
   * Tests Nitric Oxide 36-hour safety requirement (Deny -> Confirm warning test) and selects supplements.
   */
  async selectSupplementsWithNitricOxideSafety(supplements: string[]): Promise<void> {
    await test.step('Select supplements and test Nitric Oxide 36-hour safety requirement', async () => {
      const vitHeader = this.page.getByText(/vitamins|dietary supplements/i).first();
      await vitHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      // Select Nitric Oxide first
      await this.clickOptionTile('Nitric Oxide');

      // Test Deny on 36-hour acknowledgment
      const denyOpt = this.page.locator('button.ds-option-selector__option, [role="radio"], label').filter({ hasText: /^Deny$/i }).first();
      if ((await denyOpt.count()) > 0 && (await denyOpt.isVisible().catch(() => false))) {
        await denyOpt.click();
        await this.verify.waitForVisibility(this.locators.offLabelDenyWarning).catch(() => undefined);
      }

      const confirmOpt = this.page.locator('button.ds-option-selector__option, [role="radio"], label').filter({ hasText: /^Confirm$/i }).first();
      if ((await confirmOpt.count()) > 0) {
        await confirmOpt.click().catch(() => undefined);
      }

      // Select other supplements
      for (const supp of supplements) {
        await this.clickOptionTile(supp);
      }

      await this.clickContinue();
    });
  }

  /**
   * Step 12: Contraindicated Medications & Nitrates.
   * Selects Poppers, Isosorbide, Riociguat, Nausea/IBS meds, custom medications, and confirms safety.
   */
  async selectContraindicatedMedicationsAndNitrates(
    nauseaMeds: string[],
    otherCustomMed: { name: string; reason: string },
    reasonExplanation: string,
  ): Promise<void> {
    await test.step('Select contraindicated nitrates, nausea medications, and enter custom drugs', async () => {
      const medHeader = this.page.getByText(/Do you take any of the following medications/i).first();
      await medHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      // Select Poppers, Isosorbide, Riociguat, Nausea
      await this.clickOptionTile(/Amyl Nitrite|Poppers/i);
      await this.clickOptionTile(/Isosorbide/i);
      await this.clickOptionTile(/Riociguat/i);
      await this.clickOptionTile(/Medications for nausea or IBS/i);

      // Select specific Nausea meds
      for (const nausea of nauseaMeds) {
        await this.clickOptionTile(nausea);
      }

      // Fill all visible textarea inputs (Reason for taking) with reasonExplanation
      const textareas = this.page.locator('textarea').filter({ visible: true });
      const textareaCount = await textareas.count();
      for (let i = 0; i < textareaCount; i++) {
        const ta = textareas.nth(i);
        const val = await ta.inputValue().catch(() => '');
        if (!val) {
          await ta.scrollIntoViewIfNeeded().catch(() => undefined);
          await ta.fill(reasonExplanation).catch(() => undefined);
        }
      }

      // Select Other medication checkbox & add custom med
      const otherMedTile = this.page.locator('label, [role="checkbox"], .ds-checkbox, button').filter({ hasText: /^Other medication/i }).first();
      if ((await otherMedTile.count()) > 0 && (await otherMedTile.isVisible().catch(() => false))) {
        await otherMedTile.click().catch(() => undefined);
        await this.addMedicationForm(otherCustomMed.name, otherCustomMed.reason);
      }

      // Handle safety confirmation prompt at the bottom
      const confirmRadio = this.page.getByRole('radio', { name: 'Confirm', exact: true }).or(this.page.locator('button, label, [role="radio"]').filter({ hasText: /^Confirm$/i })).last();
      if ((await confirmRadio.count()) > 0 && (await confirmRadio.isVisible().catch(() => false))) {
        await confirmRadio.click().catch(() => undefined);
      }

      // Ensure any remaining visible empty textareas are populated
      const remainingTAs = this.page.locator('textarea').filter({ visible: true });
      const remCount = await remainingTAs.count();
      for (let i = 0; i < remCount; i++) {
        const ta = remainingTAs.nth(i);
        const val = await ta.inputValue().catch(() => '');
        if (!val) {
          await ta.scrollIntoViewIfNeeded().catch(() => undefined);
          await ta.fill(reasonExplanation).catch(() => undefined);
        }
      }

      // Verify safety warning banner
      await this.verify.waitForVisibility(this.locators.contraindicatedWarningBanner).catch(() => undefined);

      await this.clickContinue();
    });
  }

  /**
   * Step 13: Allergies ("Yes" -> select allergy types).
   */
  async answerAllergies(allergies: string[]): Promise<void> {
    await test.step('Answer allergies with Yes and select allergy types', async () => {
      const allergyHeader = this.page.getByText(/allergies|allergic/i).first();
      await allergyHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      const yesOpt = this.page.locator('button.ds-option-selector__option, [role="radio"], label').filter({ hasText: /^Yes$/i }).first();
      if ((await yesOpt.count()) > 0) {
        await yesOpt.click();
        await this.page.waitForTimeout(500);
      }

      for (const allergy of allergies) {
        await this.clickOptionTile(new RegExp(allergy.split('(')[0].trim(), 'i'));
      }

      await this.clickContinue();
    });
  }

  /**
   * Step 14: Health Conditions (Fainting, Dizziness & Neurological Branching).
   * Selects Fainting & Neurological conditions, sets frequency dropdowns, answers sub-questions, and provides explanations.
   */
  async answerHealthConditionsWithFaintingAndNeurological(faintingDetails: MedicalNegativeStepDetails['faintingDetails']): Promise<void> {
    await test.step('Answer fainting and neurological health conditions', async () => {
      const condHeader = this.page.getByText(/Have you ever had any of the following|fainting|neurological/i).first();
      await condHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      // Select Fainting and Neurological checkboxes
      await this.clickOptionTile(/fainting|dizziness/i);
      await this.clickOptionTile(/neurological|psychiatric/i);

      // Select frequency for all condition blocks (e.g. Fainting and Neurological)
      const freqButtons = this.page.getByRole('button', { name: /How often do you experience/i });
      const totalFreq = await freqButtons.count();
      for (let i = 0; i < totalFreq; i++) {
        const btn = freqButtons.nth(i);
        await btn.scrollIntoViewIfNeeded().catch(() => undefined);
        await btn.click({ force: true }).catch(() => undefined);
        await this.page.waitForTimeout(300);

        const option = this.page
          .locator('.cdk-overlay-pane button, .cdk-overlay-pane .ds-select-simple__option, .cdk-overlay-pane [role="option"], .cdk-overlay-pane span, .ds-select-simple__option, [role="option"]')
          .filter({ hasText: new RegExp(`\\b${faintingDetails.frequency || 'Weekly'}\\b`, 'i') })
          .first();

        if (await option.isVisible().catch(() => false)) {
          await option.click({ force: true }).catch(() => undefined);
          await this.page.waitForTimeout(300);
        } else {
          const firstOpt = this.page.locator('.cdk-overlay-pane .ds-select-simple__option, .cdk-overlay-pane button, .cdk-overlay-pane [role="option"]').first();
          if (await firstOpt.isVisible().catch(() => false)) {
            await firstOpt.click({ force: true }).catch(() => undefined);
            await this.page.waitForTimeout(300);
          }
        }
      }

      // Answer questions across all visible condition blocks with specific question titles
      await this.selectAllOptionsForQuestion(/Have you been diagnosed with a medical condition for these symptoms/i, /\bNo\b/i);
      await this.selectAllOptionsForQuestion(/Are you taking medications? for this/i, /\bNo\b/i);
      await this.selectAllOptionsForQuestion(/Are you being monitored by a provider for these symptoms/i, /\bNo\b/i);
      await this.selectAllOptionsForQuestion(/Have you had to visit a hospital in the past 12 months for health issues/i, /\bYes\b/i);
      await this.selectAllOptionsForQuestion(/Do you have any additional information to provide\?/i, /\bYes\b/i);

      // Fill all visible textareas with explanation
      const textareas = this.page.locator('textarea').filter({ visible: true });
      const count = await textareas.count();
      for (let i = 0; i < count; i++) {
        const val = await textareas.nth(i).inputValue().catch(() => '');
        if (!val) {
          await textareas.nth(i).fill(faintingDetails.explanation).catch(() => undefined);
        }
      }

      await this.clickContinue();
    });
  }

  /**
   * Step 14b: Other Medical Conditions or Surgeries (auto-advancing single choice).
   */
  async answerOtherMedicalConditionsOrSurgeries(answer: 'Yes' | 'No' = 'No'): Promise<void> {
    await test.step(`Answer other medical conditions or surgeries with: ${answer} (auto-advance)`, async () => {
      const otherCondHeader = this.page.getByText(/other medical conditions or surgeries/i).first();
      await otherCondHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      if ((await otherCondHeader.count()) > 0 && (await otherCondHeader.isVisible().catch(() => false))) {
        const opt = otherCondHeader
          .locator('xpath=following::*[@role="radiogroup" or contains(@class,"option-selector") or contains(@class,"ds-option-selector")][1]')
          .locator('[role="radio"], button, label, .ds-option-selector__option')
          .filter({ hasText: new RegExp(`\\b${answer}\\b`, 'i') })
          .first();

        if ((await opt.count()) > 0) {
          await opt.click();
        } else {
          await this.selectOptionForQuestion(/other medical conditions or surgeries/i, new RegExp(`\\b${answer}\\b`, 'i'));
        }
        await this.page.waitForTimeout(500);
      }
    });
  }

  /**
   * Step 15: Other Medications opt-out (auto-advancing single choice).
   */
  async confirmOtherMedicationsOptOut(): Promise<void> {
    await test.step('Confirm "NOT taking any other medication" (auto-advance)', async () => {
      const otherMedHeader = this.page.getByText(/Please list any OTHER medications|OTHER medications/i).first();
      await otherMedHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      const notTakingOpt = this.page
        .locator('button.ds-option-selector__option, [role="radio"], [role="checkbox"], label')
        .filter({ hasText: /NOT taking any other medication/i })
        .first();
      if ((await notTakingOpt.count()) > 0 && (await notTakingOpt.isVisible().catch(() => false))) {
        await notTakingOpt.click();
      } else {
        await this.clickOptionTile(/NOT taking any other medication/i);
      }
      await this.page.waitForTimeout(500);
    });
  }

  /**
   * Step 16: Provider Notes & Oversized File Upload Validation (>5MB Error).
   * Selects Yes, fills provider notes, uploads >5MB file, asserts validation error, clears file, and submits.
   */
  async submitProviderNotesWithFileUploadValidation(providerNotes: string, oversizedFilePath: string): Promise<void> {
    await test.step('Enter provider notes and verify 5MB file upload limit rejection', async () => {
      const notesHeader = this.page.getByText(/tell the provider|additional information|anything else/i).first();
      await notesHeader.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      await this.clickOptionTile(/\bYes\b/i);
      await this.page.waitForTimeout(500);

      // Fill additional provider notes
      const textarea = this.page.locator('textarea').filter({ visible: true }).first();
      if ((await textarea.count()) > 0) {
        await textarea.fill(providerNotes).catch(() => undefined);
      }

      // Upload oversized file to trigger 5MB limit validation error
      const fileInput = this.locators.fileUploadInput.locator.first();
      if ((await fileInput.count()) > 0) {
        const resolvedPath = path.resolve(process.cwd(), oversizedFilePath);
        await fileInput.setInputFiles(resolvedPath).catch(() => undefined);
        await this.verify.waitForVisibility(this.locators.fileSizeExceededError).catch(() => undefined);
        // Clear file so form can submit cleanly
        await fileInput.setInputFiles([]).catch(() => undefined);
        await this.page.waitForTimeout(500);
      }

      await this.clickContinue();
    });
  }

  /**
   * Exact Jam recording (4f66d4e9-9946-4a2a-bef0-0c0a2cf4bcf0) step-by-step reproduction.
   */
  async executeJamMedicalNegativeFlow(data: MedicalNegativeDetails): Promise<void> {
    await test.step('Execute exact Jam medical negative flow step-by-step', async () => {
      const reg = data.registration.medical;
      const s = data.steps;

      // ── Step 1: Legal Name ──────────────────────────────────────────────────
      await this.enterLegalName(reg.firstName, reg.lastName);

      // ── Step 2: Date of Birth ───────────────────────────────────────────────
      await this.enterDateOfBirth(reg.birthday);

      // ── Step 3: Biological Sex (if shown) ───────────────────────────────────
      const maleOption = this.optionTiles('Male').first();
      if ((await maleOption.count()) > 0 && (await maleOption.isVisible().catch(() => false))) {
        await this.selectBiologicalSex('Male');
      }

      // ── Step 4: Non-patient disqualification alert & recovery ───────────────
      await this.testPatientStatusDisqualification(data.nonPatientWarningText);

      // ── Step 5: Off-label Treatment & Pregnancy Warnings (if shown) ─────────
      await this.verifyOffLabelAndPregnancyDisclosures();

      // ── Step 6: Specific Reasons Selection ─────────────────────────────────
      await this.selectReasonsForBlueChew(s.reasons);

      // ── Step 7: Physical capability / Stairs ("I cannot") / Poor Fitness / Chest Pain ("No")
      await this.answerExerciseAndPhysicalFitness('Test');

      // ── Step 8: Told NOT to have sex (auto-advancing single choice) ──────────
      await this.answerToldNotToHaveSex('No');

      // ── Step 9: Low Blood Pressure (auto-advancing single choice) ───────────
      await this.answerLowBloodPressure('No');

      // ── Step 10: High Blood Pressure (Hypertension) Lifestyle & Meds ────────
      await this.answerBloodPressureDiagnosis(s.lifestyleOptions, s.lifestyleOtherExplanation, s.bloodPressureDrugName);

      // ── Step 11: Vitamins & Supplements (Nitric Oxide Safety Deny -> Confirm)
      await this.selectSupplementsWithNitricOxideSafety(s.supplements);

      // ── Step 12: Contraindicated Medications & Nitrates ─────────────────────
      await this.selectContraindicatedMedicationsAndNitrates(s.nauseaMeds, s.otherCustomMed, s.contraindicatedExplanation);

      // ── Step 13: Allergies ("Yes" -> "Seasonal") ───────────────────────────
      await this.answerAllergies(s.allergies);

      // ── Step 14: Health Conditions (Fainting, Dizziness & Neurological) ─────
      await this.answerHealthConditionsWithFaintingAndNeurological(s.faintingDetails);

      // ── Step 14b: Other Medical Conditions or Surgeries (auto-advancing) ────
      await this.answerOtherMedicalConditionsOrSurgeries('No');

      // ── Step 15: Other Medications (auto-advancing single choice) ───────────
      await this.confirmOtherMedicationsOptOut();

      // ── Step 16: Provider Notes & Oversized File Upload Validation (>5MB) ───
      await this.submitProviderNotesWithFileUploadValidation(s.providerNotes, s.oversizedFilePath);

      await this.page.waitForLoadState('load').catch(() => undefined);
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
      await this.verify.waitForProcessingLoaderToDisappear().catch(() => undefined);
    });
  }
}

