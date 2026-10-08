import { test as base } from '@playwright/test';
import { LoginPage } from '@page/login/login.page';
import { RegistrationPage } from '@page/registration/registration.page';
import { QuizPage } from '@page/quiz/quiz.page';
import { ResultsPage } from '@page/results/results.page';
import { MedicalPage } from '@page/medical/medical.page';
import { CheckoutPage } from '@page/checkout/checkout.page';
import { ConfirmationPage } from '@page/confirmation/confirmation.page';
import { AdminPage } from '@page/admin/admin.page';
import { ProfilePage } from '@page/account/profile.page';
import { ProductPage } from '@page/product/product.page';
import { LandingMaxPage } from '@page/product/landing-max.page';
import { FooterRedirectsPage } from '@page/product/footer-redirects.page';
import { HeroesPage } from '@page/product/heroes.page';
import { VisualHelper } from '@utilities/visual.helper';
import { AUTH_FILE_PATH } from '@utilities/global-setup';

export { AUTH_FILE_PATH };

type TestFixtures = {
  // Page Object fixtures
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
  landingMaxPage: LandingMaxPage;
  footerRedirectsPage: FooterRedirectsPage;
  heroesPage: HeroesPage;
  visual: VisualHelper;
};

export const test = base.extend<TestFixtures>({
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    await use(context);
    await context.close().catch(() => undefined);
  },

  // ── Page Object Fixtures ───────────────────────────────────────────────────
  loginPage: async ({ page, visual }, use, testInfo) => {
    await use(new LoginPage(page, testInfo, visual));
  },
  registrationPage: async ({ page, visual }, use, testInfo) => {
    await use(new RegistrationPage(page, testInfo, visual));
  },
  quizPage: async ({ page, visual }, use, testInfo) => {
    await use(new QuizPage(page, testInfo, visual));
  },
  resultsPage: async ({ page }, use, testInfo) => {
    await use(new ResultsPage(page, testInfo));
  },
  medicalPage: async ({ page, visual }, use, testInfo) => {
    await use(new MedicalPage(page, testInfo, visual));
  },
  checkoutPage: async ({ page, visual }, use, testInfo) => {
    await use(new CheckoutPage(page, testInfo, visual));
  },
  confirmationPage: async ({ page, visual }, use, testInfo) => {
    await use(new ConfirmationPage(page, testInfo, visual));
  },
  // Admin tab is created lazily — no tab opens until navigateAndLogin() is called
  adminPage: async ({ context }, use, testInfo) => {
    const adminPage = new AdminPage(context, testInfo);
    await use(adminPage);
    await adminPage.close();
  },
  profilePage: async ({ page, visual }, use, testInfo) => {
    await use(new ProfilePage(page, testInfo, visual));
  },
  productPage: async ({ page, visual }, use, testInfo) => {
    await use(new ProductPage(page, testInfo, visual));
  },
  landingMaxPage: async ({ page, visual }, use, testInfo) => {
    await use(new LandingMaxPage(page, testInfo, visual));
  },
  footerRedirectsPage: async ({ page, visual }, use, testInfo) => {
    await use(new FooterRedirectsPage(page, testInfo, visual));
  },
  heroesPage: async ({ page, visual }, use, testInfo) => {
    await use(new HeroesPage(page, testInfo, visual));
  },

  visual: async ({ page }, use, testInfo) => {
    const visual = new VisualHelper(page, testInfo);
    // initialize configured providers (lazy init occurs in captureCheckpoint, but
    // provide an explicit hook if providers need setup)
    await use(visual);
    await visual.close();
  },
});

export const authenticatedTest = test.extend({
  storageState: async ({}, use) => {
    await use(AUTH_FILE_PATH);
  },
});

export { expect } from '@playwright/test';
