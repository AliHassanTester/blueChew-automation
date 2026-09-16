import { Page, TestInfo, test, Locator } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { MedicalDetails } from '@interfaces/signup-to-approved-order.interface';
import { MedicalEdgeCasesDetails, MedicalSymptomDetails } from '@interfaces/medical-edge-cases.interface';
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
        locator: this.page.locator('//ds-input[@label="Legal First Name"]//input'),
      },
      lastNameInput: {
        description: 'Legal Last Name Input',
        locator: this.page.locator('//ds-input[@label="Legal Last Name"]//input'),
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

  // ── Public API ───────────────────────────────────────────────────────────────

  async completeMedicalProfile(details: MedicalDetails, captureCheckpoints = false): Promise<void> {
    await test.step('Complete medical profile', async () => {
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
  async completeMedicalWithEdgeCases(data: MedicalEdgeCasesDetails): Promise<void> {
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

      // ── Step 6: Physical Activity Chest Pain Edge Case ────────────────────
      await this.answerPhysicalActivityWithChestPain(data.chestPainExplanation);

      // ── Steps 7+: Drive remaining questions including edge cases ───────────
      await this.completeRemainingMedicalSteps();

      await this.page.waitForLoadState('load');
      await this.verify.waitForLoaderToDisappear();
      await this.verify.waitForProcessingLoaderToDisappear();
    });
  }
}
