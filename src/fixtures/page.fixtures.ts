import { test as base, BrowserContext } from '@playwright/test';
import { LoginPage } from '@page/login/login.page';
import { RegistrationPage } from '@page/login/registration.page';
import { QuizPage } from '@page/quiz/quiz.page';
import { ResultsPage } from '@page/results/results.page';
import { MedicalPage } from '@page/medical/medical.page';
import { CheckoutPage } from '@page/checkout/checkout.page';
import { ConfirmationPage } from '@page/confirmation/confirmation.page';
import { AdminPage } from '@page/admin/admin.page';

type TestFixtures = {
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
  quizPage: QuizPage;
  resultsPage: ResultsPage;
  medicalPage: MedicalPage;
  checkoutPage: CheckoutPage;
  confirmationPage: ConfirmationPage;
  adminPage: AdminPage;
  adminContext: BrowserContext;
};

export const test = base.extend<TestFixtures>({
  // Grant camera + microphone for the confirmation/provider flow
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    await use(context);
    await context.close();
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page, base.info()));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page, base.info()));
  },
  quizPage: async ({ page }, use) => {
    await use(new QuizPage(page, base.info()));
  },
  resultsPage: async ({ page }, use) => {
    await use(new ResultsPage(page, base.info()));
  },
  medicalPage: async ({ page }, use) => {
    await use(new MedicalPage(page, base.info()));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page, base.info()));
  },
  confirmationPage: async ({ page }, use) => {
    await use(new ConfirmationPage(page, base.info()));
  },
  // Admin runs in a separate browser context (second tab/window)
  adminContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(new AdminPage(page, base.info()));
    await page.close();
  },
});

export { expect } from '@playwright/test';
