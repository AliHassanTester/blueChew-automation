import { logTestCaseData } from '@utilities/test.helper.utils';
import { getRegistrationData } from '@data/login/registration.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getRegistrationData('AQ-01-User-Registration');

test.describe('Feature: User Registration', () => {
  test(
    `
    Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({ registrationPage, quizPage, resultsPage, medicalPage, checkoutPage }) => {
      logTestCaseData(test.info(), scenario.testCaseData);
      const d = scenario.registrationDetails;

      test.info().annotations.push({ type: 'Test Email', description: d.email });
      console.log(`[Registration] test email: ${d.email}`);

      // ── Registration ─────────────────────────────────────────────────────────
      await test.step('Navigate to registration page via Sign Up link', async () => {
        await registrationPage.navigateToRegistrationPage(d);
      });

      await test.step('Complete registration wizard (state → email → password)', async () => {
        await registrationPage.completeRegistrationWizard(d);
      });

      await test.step('Verify successful registration and quiz page loaded', async () => {
        await registrationPage.verifyRegistrationSuccess(d.postRegistrationURL);
      });

      // ── Quiz ─────────────────────────────────────────────────────────────────
      await quizPage.completeQuiz(d.quizAnswers);
      await quizPage.verifyQuizComplete();

      // ── Results ──────────────────────────────────────────────────────────────
      await resultsPage.verifyResultsPageLoaded();
      await resultsPage.clickTryGold();

      // ── Medical profile ───────────────────────────────────────────────────────
      await medicalPage.completeMedicalProfile(d.medical);
      await medicalPage.verifyNavigatedToCheckout();

      // ── Checkout ─────────────────────────────────────────────────────────────
      await checkoutPage.completeCheckout(d.shipping);
      await checkoutPage.verifyCheckoutComplete();
    },
  );
});
