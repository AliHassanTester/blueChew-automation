import { test as base } from '@playwright/test';
import { LoginPage } from '@page/login/login.page';
import { RegistrationPage } from '@page/login/registration.page';
import { QuizPage } from '@page/quiz/quiz.page';

type TestFixtures = {
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
  quizPage: QuizPage;
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
});

export { expect } from '@playwright/test';
