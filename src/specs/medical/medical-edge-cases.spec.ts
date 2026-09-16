import { logTestCaseData } from '@utilities/test.helper.utils';
import { getMedicalEdgeCasesData } from '@data/medical/medical-edge-cases.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getMedicalEdgeCasesData('AQ-08-Medical-Negative-And-Edge-Cases');

test.describe('Feature: Medical Profile - Negative & Edge Cases Flow', () => {
  test(
    `
    Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({ registrationPage, quizPage, resultsPage, medicalPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        feature: 'Medical Intake',
        story: 'Medical Flow Negative Validations & Edge Cases',
      });
      const d = scenario.details;
      const reg = d.registration;

      test.info().annotations.push({ type: 'Test Email', description: reg.email });
      console.log(`[Medical Edge Cases] test email: ${reg.email}`);

      // ── Step 1: Complete Registration & Quiz to reach Gold Medical Funnel ──
      await registrationPage.completeRegistration(reg);
      await quizPage.completeQuizAndVerify(reg.quizAnswers);
      await resultsPage.selectGoldPlan();

      // ── Step 2: Complete Medical Questionnaire with Negative & Edge Cases ──
      await medicalPage.completeMedicalWithEdgeCases(d);

      // ── Step 3: Verify successfully reached checkout ──────────────────────
      await medicalPage.verifyNavigatedToCheckout();
    },
  );
});
