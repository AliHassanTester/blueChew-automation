import { test as base } from '@applitools/eyes-playwright/fixture';
import { LoginPage } from '@page/login/login.page';
import { RegistrationPage } from '@page/login/signup-to-approved-order.page';
import { QuizPage } from '@page/quiz/quiz.page';
import { ResultsPage } from '@page/results/results.page';
import { MedicalPage } from '@page/medical/medical.page';
import { CheckoutPage } from '@page/checkout/checkout.page';
import { ConfirmationPage } from '@page/confirmation/confirmation.page';
import { AdminPage } from '@page/admin/admin.page';
import { ProfilePage } from '@page/account/profile.page';
import { ProductPage } from '@page/product/product.page';
import { VisualHelper } from '@utilities/visual.helper';

type TestFixtures = {
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
  quizPage: QuizPage;
  resultsPage: ResultsPage;
  medicalPage: MedicalPage;
  checkoutPage: CheckoutPage;
  confirmationPage: ConfirmationPage;
  adminPage: AdminPage;
  profilePage: ProfilePage;
  productPage: ProductPage;
  visual: VisualHelper;
};

export const test = base.extend<TestFixtures>({
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    await use(context);
    await context.close();
  },

  loginPage: async ({ page, visual }, use) => {
    await use(new LoginPage(page, base.info(), visual));
  },
  registrationPage: async ({ page, visual }, use) => {
    await use(new RegistrationPage(page, base.info(), visual));
  },
  quizPage: async ({ page, visual }, use) => {
    await use(new QuizPage(page, base.info(), visual));
  },
  resultsPage: async ({ page }, use) => {
    await use(new ResultsPage(page, base.info()));
  },
  medicalPage: async ({ page, visual }, use) => {
    await use(new MedicalPage(page, base.info(), visual));
  },
  checkoutPage: async ({ page, visual }, use) => {
    await use(new CheckoutPage(page, base.info(), visual));
  },
  confirmationPage: async ({ page, visual }, use) => {
    await use(new ConfirmationPage(page, base.info(), visual));
  },
  // Admin tab is created lazily — no tab opens until navigateAndLogin() is called
  adminPage: async ({ context }, use) => {
    const adminPage = new AdminPage(context, base.info());
    await use(adminPage);
    await adminPage.close();
  },
  profilePage: async ({ page, visual }, use) => {
    await use(new ProfilePage(page, base.info(), visual));
  },
  productPage: async ({ page, visual }, use) => {
    await use(new ProductPage(page, base.info(), visual));
  },

  visual: async ({ page }, use) => {
    const visual = new VisualHelper(page, base.info());
    // initialize configured providers (lazy init occurs in captureCheckpoint, but
    // provide an explicit hook if providers need setup)
    await use(visual);
    await visual.close();
  },
});

export { expect } from '@playwright/test';
