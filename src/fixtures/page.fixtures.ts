import { test as base } from '@playwright/test';
import { LoginPage } from '@page/login/login.page';
import { RegistrationPage } from '@page/login/registration.page';
import { QuizPage } from '@page/quiz/quiz.page';
import { ResultsPage } from '@page/results/results.page';
import { MedicalPage } from '@page/medical/medical.page';
import { CheckoutPage } from '@page/checkout/checkout.page';

type TestFixtures = {
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
  quizPage: QuizPage;
  resultsPage: ResultsPage;
  medicalPage: MedicalPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<TestFixtures>({
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
});

export { expect } from '@playwright/test';
