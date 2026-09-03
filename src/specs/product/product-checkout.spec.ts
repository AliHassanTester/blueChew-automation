import { logTestCaseData } from '@utilities/test.helper.utils';
import { getProductCheckoutData } from '@data/product/product-checkout.data';
import { test } from '@fixtures/page.fixtures';
import { GOLD_TRANSITION_FIGMA_CONFIG } from '@data/visual/figma.visual.data';

// ── 1. Standard Product Checkout Flows ───────────────────────────────────────
test.describe('Feature: Unified Product Checkout Flows', () => {
  const products = [
    { key: 'PRODUCT-SILDENAFIL', tag: '@sildenafil' },
    { key: 'PRODUCT-TADALAFIL',   tag: '@tadalafil' },
    { key: 'PRODUCT-VARDENAFIL',  tag: '@vardenafil' },
    { key: 'PRODUCT-DAILYTAD',   tag: '@dailytad' },
    { key: 'PRODUCT-MAX',        tag: '@max' },
    { key: 'PRODUCT-VMAX',       tag: '@vmax' },
  ];

  for (const { key, tag } of products) {
    const data = getProductCheckoutData(key);
    test(
      `Product Checkout Flow - ${data.productName} ('${data.testCaseData.testCase}')`,
      { tag: [tag, '@product', '@visual'] },
      async ({ productPage, registrationPage, medicalPage, checkoutPage, confirmationPage, adminPage }, testInfo) => {
        const d = data.registrationDetails;
        await logTestCaseData(testInfo, data.testCaseData, { feature: 'Product Checkout', story: `${data.productName} Checkout` });
        testInfo.annotations.push({ type: 'Test Email', description: d.email });

        await productPage.selectPlanAndProceedToRegistration(data);
        await registrationPage.completeRegistrationWizard(d);
        await medicalPage.completeMedicalAndProceed(d.medical);
        await checkoutPage.completeCheckoutWithVisual(data.visualConfig, d.shipping, d.payment, `${data.productName} checkout page`);
        await confirmationPage.approveAndVerifyOrder(adminPage, d);
      },
    );
  }
});

// ── 2. Homepage Checkout Visual Flow ─────────────────────────────────────────
test(
  `Product Checkout Flow - Home ('PRODUCT-HOME')`,
  { tag: ['@home', '@product', '@visual'] },
  async ({ productPage, registrationPage, quizPage, resultsPage, medicalPage, checkoutPage }, testInfo) => {
    const data = getProductCheckoutData('PRODUCT-HOME');
    const d = data.registrationDetails;
    await logTestCaseData(testInfo, data.testCaseData, { feature: 'Product Checkout', story: 'Home Page Checkout' });
    testInfo.annotations.push({ type: 'Test Email', description: d.email });

    await productPage.startHomepageFunnel(data, quizPage, resultsPage);
    await registrationPage.completeRegistrationAndMedical(d, medicalPage);
    await productPage.handleTransitionScreen();
    await checkoutPage.completeCheckoutAndConfirmation(data.visualConfig, d, productPage, 'Homepage checkout page');
  },
);

// ── 3. Gold Product E2E Checkout Flow ────────────────────────────────────────
test(
  `Product Checkout Flow - Gold ('PRODUCT-GOLD')`,
  { tag: ['@gold', '@product', '@visual'] },
  async ({ productPage, registrationPage, medicalPage, checkoutPage }, testInfo) => {
    const data = getProductCheckoutData('PRODUCT-GOLD');
    const d = data.registrationDetails;
    await logTestCaseData(testInfo, data.testCaseData, { feature: 'Product Checkout', story: 'Gold Product Checkout' });
    testInfo.annotations.push({ type: 'Test Email', description: d.email });

    await productPage.selectPlanAndProceedToRegistration(data);
    await registrationPage.completeGoldRegistrationAndMedical(d, medicalPage);
    await productPage.handleTransitionScreen(GOLD_TRANSITION_FIGMA_CONFIG, 'Gold Transition Page');
    await checkoutPage.completeCheckoutAndConfirmation(data.visualConfig, d, productPage, 'Gold checkout page');
  },
);

// ── 4. Gold Medical Visual Only Flow (Isolated Checkpoints) ──────────────────
test(
  `Product Checkout Flow - Gold Medical Visual ('PRODUCT-GOLD-MEDICAL')`,
  { tag: ['@gold-medical', '@product', '@visual'] },
  async ({ productPage, registrationPage, medicalPage }, testInfo) => {
    const data = getProductCheckoutData('PRODUCT-GOLD');
    const d = data.registrationDetails;
    await logTestCaseData(testInfo, data.testCaseData, { feature: 'Product Checkout', story: 'Gold Medical Visual Only' });
    testInfo.annotations.push({ type: 'Test Email', description: d.email });

    await productPage.selectPlanAndProceedToRegistration(data);
    await registrationPage.completeRegistrationWizard(d);
    await medicalPage.completeGoldMedicalVisual(d.medical);
    await productPage.handleTransitionScreen(GOLD_TRANSITION_FIGMA_CONFIG, 'Gold Transition Page');
  },
);
