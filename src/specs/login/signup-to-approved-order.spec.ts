import { logTestCaseData } from '@utilities/test.helper.utils';
import { getRegistrationData } from '@data/login/registration.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getRegistrationData('AQ-01-Sign-up-To-Approved-Order-E2E');

test.describe('Feature: Sign-up to Approved Order (E2E)', () => {
  test(
    `
    Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({ registrationPage, quizPage, resultsPage, medicalPage, checkoutPage, confirmationPage, adminPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        feature: 'Onboarding',
        story: 'Sign-up to Approved Order',
      });
      const d = scenario.registrationDetails;

      test.info().annotations.push({ type: 'Test Email', description: d.email });
      console.log(`[E2E] test email: ${d.email}`);

      // ── Registration ─────────────────────────────────────────────────────────
      await test.step('Navigate to login page and click Sign Up CTA → /register', async () => {
        await registrationPage.navigateToRegistrationPage(d);
      });

      await test.step('Complete registration wizard (state → email → password)', async () => {
        await registrationPage.completeRegistrationWizard(d);
      });

      await test.step('Verify successful registration and quiz page loaded', async () => {
        await registrationPage.verifyRegistrationSuccess(d.quizURL);
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
      await adminPage.openUserDetail(d.email);

      // ── Provider review (care portal) — verify ID + approve ───────────────────
      await adminPage.reviewAndApprove(d.adminEmail, d.adminPassword);
      await adminPage.verifyApprovedStatus();

      // ── Add a manual order and verify it was created ──────────────────────────
      await adminPage.addOrder('$0 - Next Business Day', 'Automation test order');
      await adminPage.verifyOrderAdded();

      // ── Verify the product subscription has started for the new customer ───────
      await adminPage.verifySubscriptionStarted();

      // ── Close the admin tab now that all portal work is done, then return to ──
      // the patient tab and refresh to verify activation.
      await test.step('Close admin tab after portal work', async () => {
        await adminPage.close();
      });

      // ── Patient side — refresh the queue/televisit page and verify activation ──
      await confirmationPage.verifyTelevisit();
    },
  );
});
