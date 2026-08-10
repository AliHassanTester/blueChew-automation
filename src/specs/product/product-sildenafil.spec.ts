import { logTestCaseData } from '@utilities/test.helper.utils';
import { getProductSildenafilData } from '@data/product/product-sildenafil.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getProductSildenafilData('PRODUCT-SILDENAFIL');

test.describe('Feature: Product Sildenafil End-to-End Flow', () => {
  test.only(
    `
    Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({
      productPage,
      registrationPage,
      quizPage,
      resultsPage,
      medicalPage,
      checkoutPage,
      confirmationPage,
      adminPage,
    }, testInfo) => {
      await logTestCaseData(testInfo, scenario.testCaseData, {
        feature: 'Product',
        story: 'Product Sildenafil Checkout',
      });
      const d = scenario.registrationDetails;

      testInfo.annotations.push({ type: 'Test Email', description: d.email });

      // ── Step 1: Navigate to Sildenafil Product Page & capture visual baseline ──
      await test.step('Open Sildenafil Product Page and capture visual baseline', async () => {
        await productPage.navigateToProductPage(scenario.url, 'Sildenafil');
        await productPage.captureProductSnapshot(scenario.visualConfig, 'Sildenafil page loaded');
      });

      // ── Step 2: Click SELECT A PLAN -> select plan -> proceed to checkout funnel ──
      await test.step('Select Sildenafil Plan and enter registration funnel', async () => {
        await productPage.selectPlanAndProceed();
      });

      // ── Step 3: Complete Onboarding: registration -> quiz -> results -> medical -> checkout -> pay ──
      await registrationPage.completeRegistration(d);
      await quizPage.completeQuizAndVerify(d.quizAnswers);
      await resultsPage.selectGoldPlan();
      await medicalPage.completeMedicalAndProceed(d.medical);
      await checkoutPage.completeCheckoutAndPay(d.shipping, d.payment);

      // ── Step 4: Post-purchase: ID submission & Admin Approval ──
      await confirmationPage.submitIdAndAwaitProvider();
      await adminPage.approveAndCreateFirstOrder(d);
      await confirmationPage.verifyTelevisit();
    },
  );
});
