import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { MedicalDetails } from '@interfaces/registration.interface';

export class MedicalPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
  }

  private async fillPersonalInfo(details: MedicalDetails): Promise<void> {
    await this.page.fill("input[formcontrolname='first_name']", details.firstName);
    await this.page.fill("input[formcontrolname='last_name']", details.lastName);
    await this.page.fill("input[formcontrolname='birthday']", details.birthday);
    await this.page.locator("input[formcontrolname='birthday']").press('Tab');
    await this.page.waitForTimeout(300);
  }

  private async fillHealthQuestions(): Promise<void> {
    // Q2: Sex → Male
    await this.page.locator('#male-seeking-treatment-yes').check();
    // Q3: Are you the patient? → Yes
    await this.page.locator('#are-you-the-patient-yes').check();
    // Q4: Reason → "I want to see if chewables work better for me"
    await this.page.locator('#reason-for-choosing-checkbox-4').check();
    // Q5: Can walk 1 mile? → Yes
    await this.page.locator('#walk-one-mile-yes').check();
    // Q6: Climb 2 flights of stairs → About 10 seconds
    await this.page.locator('#climb-two-stairs-1').check();
    // Q6b: Fitness agreement (appears dynamically) → Yes
    const fitnessVisible = await this.page
      .locator('#fitness-agree-yes')
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (fitnessVisible) {
      await this.page.locator('#fitness-agree-yes').check();
    }
    // Q7: Told NOT to have sex? → No
    await this.page.locator('#healthy-enough-no').check();
    // Q8: Low blood pressure? → No
    await this.page.locator('#low-blood-pressure-no').check();
    // Q9: High blood pressure? → No
    await this.page.locator('#high-blood-pressure-no').check();
    // Q10: Vitamins/supplements → "I DO NOT take any of these"
    await this.page.locator('#taking-other-med-checkbox-4').check();
    // Q11: Contraindicated medications → "I DO NOT take any of these"
    await this.page.locator('#take-contra-meds-checkbox-8').check();
    // Q12: Allergies? → No
    await this.page.locator('#have-allergies-no').check();
    // Q13: Medical conditions → "I have NONE of these"
    await this.page.locator('#abnormal-conditions-5').check();
    // Q14: Other conditions/surgeries? → No
    await this.page.locator('#other-med-conditions-no').check();
    // Q15: Not taking other medications
    await this.page.locator('#notTakingAnyOtherMeds').check();
    // Q16: Anything else for provider? → No
    await this.page.locator('#anything-else-no').check();
    await this.page.waitForTimeout(400);
  }

  private async submitForm(): Promise<void> {
    // May need two attempts if a validation modal appears for any missed dynamic field
    for (let attempt = 1; attempt <= 2; attempt++) {
      await this.page.locator('button.btn-submit-alone').first().click();
      await this.page.waitForTimeout(1_500);

      const dismissVisible = await this.page
        .locator('button:has-text("Dismiss")')
        .first()
        .isVisible()
        .catch(() => false);

      if (dismissVisible) {
        await this.page.locator('button:has-text("Dismiss")').first().click();
        await this.page.waitForTimeout(500);
        // Re-check fitness agreement if it re-appeared
        const fa = await this.page.locator('#fitness-agree-yes').isVisible().catch(() => false);
        if (fa) {
          await this.page.locator('#fitness-agree-yes').check();
          await this.page.waitForTimeout(300);
        }
      } else {
        break;
      }
    }
  }

  async completeMedicalProfile(details: MedicalDetails): Promise<void> {
    await test.step('Complete medical profile form', async () => {
      await this.page
        .locator("input[formcontrolname='first_name']")
        .waitFor({ state: 'visible', timeout: 15_000 });

      await test.step('Fill personal information', async () => {
        await this.fillPersonalInfo(details);
      });

      await test.step('Answer health questions', async () => {
        await this.fillHealthQuestions();
      });

      await test.step('Submit medical form', async () => {
        await this.submitForm();
      });

      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();
      await this.verify.waitForProcessingLoaderToDisappear();
    });
  }

  async verifyNavigatedToCheckout(): Promise<void> {
    await test.step('Verify navigation to checkout', async () => {
      await this.actions.waitForURL(/\/checkout/, 20_000);
    });
  }
}
