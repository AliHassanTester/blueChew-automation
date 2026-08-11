import { logTestCaseData } from '@utilities/test.helper.utils';
import { getProductSildenafilData } from '@data/product/product-sildenafil.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getProductSildenafilData('PRODUCT-SILDENAFIL');

test.describe('Feature: Product Sildenafil End-to-End Flow', () => {
  test.only(`Test case: '${scenario.testCaseData.testCase}'`, async ({
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

    // Step 1: Product Selection
    await productPage.navigateToProductPage(scenario.url, 'Sildenafil');
    await productPage.captureProductSnapshot(scenario.visualConfig, 'Sildenafil page loaded');
    await productPage.selectPlanAndProceed(scenario.visualConfig);

    // Step 2: Registration & Quiz Onboarding
    await registrationPage.completeRegistrationWizard(d);

    // Step 3: Medical & Checkout Payment
    await medicalPage.completeMedicalAndProceed(d.medical);
    await checkoutPage.completeCheckoutAndPay(d.shipping, d.payment);

    // Step 4: Post-purchase & Admin Approval
    await confirmationPage.submitIdAndAwaitProvider();
    await adminPage.approveAndCreateFirstOrder(d);
    await confirmationPage.verifyTelevisit();
  });
});
