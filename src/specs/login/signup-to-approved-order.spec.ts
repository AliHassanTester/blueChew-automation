import { logTestCaseData } from '@utilities/test.helper.utils';
import { getRegistrationData } from '@data/login/signup-to-approved-order.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getRegistrationData('AQ-01-Sign-up-To-Approved-Order-E2E');

test.describe('Feature: Sign-up to Approved Order (E2E)', () => {
  test(
    `
    Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags} @visual'
  `,
    async ({ registrationPage, quizPage, resultsPage, medicalPage, checkoutPage, confirmationPage, adminPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        feature: 'Onboarding',
        story: 'Sign-up to Approved Order',
      });
      const d = scenario.registrationDetails;

      test.info().annotations.push({ type: 'Test Email', description: d.email });
      console.log(`[E2E] test email: ${d.email}`);

      // ── Onboarding funnel: register → quiz → results → medical → checkout → pay ──
      await registrationPage.completeRegistration(d);
      await quizPage.completeQuizAndVerify(d.quizAnswers);
      await resultsPage.selectGoldPlan();
      await medicalPage.completeMedicalAndProceed(d.medical);
      await checkoutPage.completeCheckoutAndPay(d.shipping, d.payment);

      // ── Post-purchase: submit ID photo → provider queue ───────────────────────
      await confirmationPage.submitIdAndAwaitProvider();

      // ── Admin/care portal: approve patient, create first order, verify subscription ──
      await adminPage.approveAndCreateFirstOrder(d);

      // ── Patient side: refresh the queue page and verify the plan is now active ──
      await confirmationPage.verifyTelevisit();
    },
  );
});
