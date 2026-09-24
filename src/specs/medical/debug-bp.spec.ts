import { test, expect } from '@fixtures/page.fixtures';
import { getMedicalNegativeData } from '@data/medical/medical-negative.data';

const scenario = getMedicalNegativeData('AQ-09-Medical-Negative-Flow');

test('Debug Medical Full negative flow step-by-step', async ({ registrationPage, quizPage, resultsPage, medicalPage, page }) => {
  const d = scenario.details;
  const reg = d.registration;

  await registrationPage.completeRegistration(reg);
  await quizPage.completeQuizAndVerify(reg.quizAnswers);
  await resultsPage.selectGoldPlan();

  // Run the full executeJamMedicalNegativeFlow
  await medicalPage.executeJamMedicalNegativeFlow(d);

  // Verify checkout
  await medicalPage.verifyNavigatedToCheckout();
});
