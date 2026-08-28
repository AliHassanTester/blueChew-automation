import { logTestCaseData } from '@utilities/test.helper.utils';
import { getProductCheckoutData, ProductCheckoutTestCaseData } from '@data/product/product-checkout.data';
import { test } from '@fixtures/page.fixtures';
import { TestInfo } from '@playwright/test';
import {
  REGISTRATION_FIGMA_CONFIG,
  MEDICAL_FIGMA_CONFIG,
  GOLD_TRANSITION_FIGMA_CONFIG
} from '@data/visual/figma.visual.data';

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

  const isGold = scenario.productName === 'Gold';

  // Gold-only: Capture registration baseline
  if (isGold) {
    await test.step('Capture Gold registration page visual baseline', async () => {
      await registrationPage.captureRegistrationSnapshot(REGISTRATION_FIGMA_CONFIG, 'Gold Registration Page');
    });
  }

  await registrationPage.completeRegistrationWizard(d);

  // Gold-only: Capture medical baseline on page load
  if (isGold) {
    await test.step('Capture Gold medical page initial visual baseline', async () => {
      await productPage.page.waitForURL(/\/medical/);
      await medicalPage.captureMedicalSnapshot(MEDICAL_FIGMA_CONFIG, 'Gold Medical Page');
    });
  }

  // Complete medical profile
  await medicalPage.completeMedicalProfile(d.medical);

  // Gold-only: Capture and handle transition page
  if (isGold) {
    await test.step('Handle Gold transition page and capture visual baseline', async () => {
      // Wait for the transition page to load (which is after medical, but before checkout)
      await productPage.page.waitForURL((url: URL) => !url.pathname.includes('/medical') && !url.pathname.includes('/checkout'), { timeout: 20_000 }).catch(() => undefined);
      await medicalPage.captureMedicalSnapshot(GOLD_TRANSITION_FIGMA_CONFIG, 'Gold Transition Page');
      // Click continue on the transition page to reach checkout
      const continueBtn = productPage.page.locator('button[class*="ds-button--primary"], :text-is("CONTINUE")').filter({ visible: true }).first();
      await continueBtn.click();
    });
  }

  // Verify navigation to checkout
  await medicalPage.verifyNavigatedToCheckout();

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
    { key: 'PRODUCT-GOLD', tag: '@gold' },
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
