import { logTestCaseData } from '@utilities/test.helper.utils';
import { getMedicalNegativeData } from '@data/medical/medical-negative.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getMedicalNegativeData('AQ-09-Medical-Negative-Flow');

test.describe('Feature: Medical Intake - Negative Validations & Clinical Safety Flow', () => {
  test(
    `
    Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({ registrationPage, quizPage, resultsPage, medicalPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        epic: 'Clinical Safety',
        feature: 'Medical Intake',
        story: 'Medical Negative Flow & Edge Cases',
      });
      const d = scenario.details;
      const reg = d.registration;

      test.info().annotations.push({ type: 'Test Email', description: reg.email });
      console.log(`[Medical Negative Flow] test email: ${reg.email}`);

      // ── Step 1: Complete Registration & Quiz to reach Gold Medical Funnel ──
      await registrationPage.completeRegistration(reg);
      await quizPage.completeQuizAndVerify(reg.quizAnswers);
      await resultsPage.selectGoldPlan();

      // ── Step 2: Complete Medical Questionnaire with Exact Jam Recording Steps ──
      await medicalPage.executeJamMedicalNegativeFlow(d);

      // ── Step 3: Verify successfully reached checkout ──────────────────────
      await medicalPage.verifyNavigatedToCheckout();
    },
  );
});
