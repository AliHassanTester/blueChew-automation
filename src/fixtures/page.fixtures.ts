import { test as base } from '@playwright/test';
import { LoginPage } from '@page/login/login.page';
import { RegistrationPage } from '@page/login/signup-to-approved-order.page';
import { QuizPage } from '@page/quiz/quiz.page';
import { ResultsPage } from '@page/results/results.page';
import { MedicalPage } from '@page/medical/medical.page';
import { CheckoutPage } from '@page/checkout/checkout.page';
import { ConfirmationPage } from '@page/confirmation/confirmation.page';
import { AdminPage } from '@page/admin/admin.page';
import { ProfilePage } from '@page/account/profile.page';
import { createApplitoolsVisualHelper, ApplitoolsVisualHelper } from '@utilities/applitools.utils';

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
  visual: ApplitoolsVisualHelper;
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
  resultsPage: async ({ page, visual }, use) => {
    await use(new ResultsPage(page, base.info(), visual));
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
  adminPage: async ({ context, visual }, use) => {
    const adminPage = new AdminPage(context, visual, base.info());
    await use(adminPage);
    await adminPage.close();
  },
  profilePage: async ({ page, visual }, use) => {
    await use(new ProfilePage(page, base.info(), visual));
  },
  visual: async ({ page }, use, testInfo) => {
    const helper = createApplitoolsVisualHelper(page, testInfo);
    await use(helper);
    await helper.closeEyes();
  },
});

export { expect } from '@playwright/test';
