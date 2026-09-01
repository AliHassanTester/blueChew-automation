import { logTestCaseData } from '@utilities/test.helper.utils';
import { getProductCheckoutData, ProductCheckoutTestCaseData } from '@data/product/product-checkout.data';
import { test } from '@fixtures/page.fixtures';
import { TestInfo } from '@playwright/test';
import {
  REGISTRATION_FIGMA_CONFIG,
  MEDICAL_FIGMA_CONFIG,
  GOLD_TRANSITION_FIGMA_CONFIG,
  CONFIRMATION_FIGMA_CONFIG
} from '@data/visual/figma.visual.data';

/**
 * Reusable execution helper for standard product checkout end-to-end flows.
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

test(
  `Product Checkout Flow - Gold ('PRODUCT-GOLD')`,
  { tag: ['@gold', '@product', '@visual'] },
  async ({ productPage, registrationPage, medicalPage, checkoutPage, confirmationPage }, testInfo) => {
    const data = getProductCheckoutData('PRODUCT-GOLD');

    await logTestCaseData(testInfo, data.testCaseData, {
      feature: 'Product Checkout',
      story: 'Gold Product Checkout',
    });

    const d = data.registrationDetails;
    testInfo.annotations.push({ type: 'Test Email', description: d.email });

    // 1. Initial product landing page visual snapshot
    await test.step('Navigate to Gold landing page and capture visual baseline', async () => {
      await productPage.navigateToProductPage(data.url, data.productName);
      await productPage.captureProductSnapshot(data.visualConfig, 'Gold product page');
    });

    // 2. Select plan
    await productPage.selectPlanAndProceed();

    // 3. Capture registration page visual baseline (pre-fill)
    await test.step('Capture Gold registration page visual baseline', async () => {
      await registrationPage.captureRegistrationSnapshot(REGISTRATION_FIGMA_CONFIG, 'Gold Registration Page');
    });

    // 4. Fill registration
    await registrationPage.completeRegistrationWizard(d);

    // 5. Capture medical page initial visual baseline
    await test.step('Capture Gold medical page initial visual baseline', async () => {
      await productPage.page.waitForURL(/\/medical/);
      await medicalPage.captureMedicalSnapshot(MEDICAL_FIGMA_CONFIG, 'Gold Medical Page');
    });

    // 6. Complete medical questionnaire (without step-by-step visual checkpoints)
    await medicalPage.completeMedicalProfile(d.medical, false);

    // 7. Handle Gold transition page
    await test.step('Handle Gold transition page and capture visual baseline', async () => {
      await productPage.page.waitForURL((url: URL) => !url.pathname.includes('/medical') && !url.pathname.includes('/checkout'), { timeout: 20_000 }).catch(() => undefined);
      await medicalPage.captureMedicalSnapshot(GOLD_TRANSITION_FIGMA_CONFIG, 'Gold Transition Page');
      // Click continue on the transition page to reach checkout
      const continueBtn = productPage.page.locator('button[class*="ds-button--primary"], :text-is("CONTINUE")').filter({ visible: true }).first();
      await continueBtn.click();
    });

    // 8. Await navigation to checkout and capture checkout visual baseline
    await medicalPage.verifyNavigatedToCheckout();
    await test.step('Capture Gold checkout page visual baseline', async () => {
      await checkoutPage.captureCheckoutSnapshot(data.visualConfig, 'Gold checkout page');
    });

    // 9. Complete checkout and pay
    await checkoutPage.completeCheckoutAndPay(d.shipping, d.payment);

    // 10. Capture post-checkout confirmation / profile view baseline (frontend only)
    await test.step('Capture Gold post-checkout confirmation page baseline', async () => {
      await productPage.page.waitForURL(/\/confirmation|account/);
      // Wait for loader to disappear before snapshot
      await productPage.page.waitForLoadState('load');
      await medicalPage.captureMedicalSnapshot(CONFIRMATION_FIGMA_CONFIG, 'Gold Confirmation Page');
    });
  },
);

test(
  `Product Checkout Flow - Gold Medical Visual ('PRODUCT-GOLD-MEDICAL')`,
  { tag: ['@gold-medical', '@product', '@visual'] },
  async ({ productPage, registrationPage, medicalPage }, testInfo) => {
    const data = getProductCheckoutData('PRODUCT-GOLD');

    await logTestCaseData(testInfo, data.testCaseData, {
      feature: 'Product Checkout',
      story: 'Gold Medical Visual Only',
    });

    const d = data.registrationDetails;
    testInfo.annotations.push({ type: 'Test Email', description: d.email });

    // 1. Navigate to Gold landing page and capture visual baseline
    await test.step('Navigate to Gold landing page and capture visual baseline', async () => {
      await productPage.navigateToProductPage(data.url, data.productName);
      await productPage.captureProductSnapshot(data.visualConfig, 'Gold product page');
    });
    await productPage.selectPlanAndProceed();

    // 2. Complete registration wizard (no registration baseline taken here to avoid duplication)
    await registrationPage.completeRegistrationWizard(d);

    // 3. Capture medical page initial visual baseline
    await productPage.page.waitForURL(/\/medical/);
    await medicalPage.captureGoldMedicalCheckpoint('Gold Medical Page');

    // 4. Complete medical questionnaire WITH step-by-step progressive visual checkpoints
    await medicalPage.completeMedicalProfile(d.medical, true);

    // 5. Capture Gold transition page (the page right after medical, e.g. "Meet Gold")
    await productPage.page.waitForURL((url: URL) => !url.pathname.includes('/medical') && !url.pathname.includes('/checkout'), { timeout: 20_000 }).catch(() => undefined);
    await medicalPage.captureMedicalSnapshot(GOLD_TRANSITION_FIGMA_CONFIG, 'Gold Transition Page');

    // 6. Test ends here! No checkout, no shipping, no payment, no admin approval.
  },
);
