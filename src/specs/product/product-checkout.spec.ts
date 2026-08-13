import { logTestCaseData } from '@utilities/test.helper.utils';
import { getAllProductCheckoutScenarios } from '@data/product/product-checkout.data';
import { test } from '@fixtures/page.fixtures';

const scenarios = getAllProductCheckoutScenarios();

test.describe('Feature: Unified Product Checkout Flows', () => {
  for (const scenario of scenarios) {
    test(`Product Checkout Flow - ${scenario.productName} ('${scenario.testCaseData.testCase}')`, async ({
      productPage,
      registrationPage,
      medicalPage,
      checkoutPage,
      confirmationPage,
      adminPage,
    }, testInfo) => {
      await logTestCaseData(testInfo, scenario.testCaseData, {
        feature: 'Product',
        story: `${scenario.productName} Checkout`,
      });

      const d = scenario.registrationDetails;
      testInfo.annotations.push({ type: 'Test Email', description: d.email });

      // Step 1: Product Selection & Applitools Visual Baseline Capture
      await productPage.navigateToProductPage(scenario.url, scenario.productName);
      await productPage.captureProductSnapshot(
        scenario.visualConfig,
        `${scenario.productName} page loaded`,
      );
      await productPage.selectPlanAndProceed();

      // Step 2: Registration Onboarding
      await registrationPage.completeRegistrationWizard(d);

      // Step 3: Medical & Checkout Payment
      await medicalPage.completeMedicalAndProceed(d.medical);
      await checkoutPage.completeCheckoutAndPay(d.shipping, d.payment);

      // Step 4: Post-purchase & Provider Admin Approval
      await confirmationPage.submitIdAndAwaitProvider();
      await adminPage.approveAndCreateFirstOrder(d);
      await confirmationPage.verifyTelevisit();
    });
  }
});
