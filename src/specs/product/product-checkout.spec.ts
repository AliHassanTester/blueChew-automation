import { logTestCaseData } from '@utilities/test.helper.utils';
import { getProductCheckoutData, ProductCheckoutTestCaseData } from '@data/product/product-checkout.data';
import { test } from '@fixtures/page.fixtures';
import { TestInfo } from '@playwright/test';

/**
 * Reusable execution helper for product checkout end-to-end flows.
 * DRY principle: single source of truth for the product checkout steps.
 */
async function executeProductCheckoutFlow(
  scenario: ProductCheckoutTestCaseData,
  fixtures: {
    productPage: any;
    registrationPage: any;
    medicalPage: any;
    checkoutPage: any;
    confirmationPage: any;
    adminPage: any;
  },
  testInfo: TestInfo,
): Promise<void> {
  const { productPage, registrationPage, medicalPage, checkoutPage, confirmationPage, adminPage } = fixtures;

  await logTestCaseData(testInfo, scenario.testCaseData, {
    feature: 'Product Checkout',
    story: `${scenario.productName} Product Checkout`,
  });

  const d = scenario.registrationDetails;
  testInfo.annotations.push({ type: 'Test Email', description: d.email });

  // 1. Initial product landing page visual snapshot
  await test.step(`Navigate to ${scenario.productName} landing page and capture visual baseline`, async () => {
    await productPage.navigateToProductPage(scenario.url, scenario.productName);
    await productPage.captureProductSnapshot(scenario.visualConfig, `${scenario.productName} product page`);
  });

  // 2. Select plan, complete registration and medical questionnaire
  await productPage.selectPlanAndProceed();
  await registrationPage.completeRegistrationWizard(d);
  await medicalPage.completeMedicalAndProceed(d.medical);

  // 3. Checkout page visual snapshot when arriving at checkout
  await test.step(`Capture ${scenario.productName} checkout page visual baseline`, async () => {
    await checkoutPage.captureCheckoutSnapshot(scenario.visualConfig, `${scenario.productName} checkout page`);
  });

  // 4. Complete checkout, payment, and provider order approval
  await checkoutPage.completeCheckoutAndPay(d.shipping, d.payment);
  await confirmationPage.submitIdAndAwaitProvider();
  await adminPage.approveAndCreateFirstOrder(d);
  await confirmationPage.verifyTelevisit();
}

test.describe('Feature: Unified Product Checkout Flows', () => {
  const products = [
    { key: 'PRODUCT-SILDENAFIL', tag: '@sildenafil' },
    { key: 'PRODUCT-TADALAFIL', tag: '@tadalafil' },
    { key: 'PRODUCT-VARDENAFIL', tag: '@vardenafil' },
    { key: 'PRODUCT-DAILYTAD', tag: '@dailytad' },
    { key: 'PRODUCT-MAX', tag: '@max' },
  ];

  for (const { key, tag } of products) {
    const data = getProductCheckoutData(key);
    test(
      `Product Checkout Flow - ${data.productName} ('${data.testCaseData.testCase}')`,
      { tag: [tag, '@product', '@visual'] },
      async ({ productPage, registrationPage, medicalPage, checkoutPage, confirmationPage, adminPage }, testInfo) => {
        await executeProductCheckoutFlow(
          data,
          { productPage, registrationPage, medicalPage, checkoutPage, confirmationPage, adminPage },
          testInfo,
        );
      },
    );
  }
});
