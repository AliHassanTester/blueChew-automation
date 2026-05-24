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
    async ({ registrationPage, quizPage, resultsPage, medicalPage, checkoutPage, confirmationPage, adminPage }) => {
      logTestCaseData(test.info(), scenario.testCaseData);
      const d = scenario.registrationDetails;

      test.info().annotations.push({ type: 'Test Email', description: d.email });
      console.log(`[Registration] test email: ${d.email}`);

      // ── Registration ─────────────────────────────────────────────────────────
      await test.step('Navigate directly to registration page (/register)', async () => {
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

      // ── Checkout wizard → shipping ────────────────────────────────────────────
      await checkoutPage.completeCheckout(d.shipping);

      // ── Order summary assertion ───────────────────────────────────────────────
      await checkoutPage.verifyOrderSummary();

      // ── Navigate to payment form (some flows require explicit click) ──────────
      await checkoutPage.proceedToPaymentForm();

      // ── Payment ───────────────────────────────────────────────────────────────
      await checkoutPage.fillPaymentDetails(d.payment);
      await checkoutPage.completePurchase();
      await checkoutPage.verifyCheckoutComplete();

      // ── Confirmation — ID photo upload → provider queue ───────────────────────
      await confirmationPage.uploadIdPhoto();
      await confirmationPage.verifyConnectingToProvider();
      await confirmationPage.waitForProviderQueue();

      // ── Admin portal — find the registered user ───────────────────────────────
      await adminPage.navigateAndLogin(d.adminURL, d.adminEmail, d.adminPassword);
      await adminPage.navigateToUsers();
      await adminPage.searchUser(d.email);
    },
  );
});
