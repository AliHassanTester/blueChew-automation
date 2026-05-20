import { test, expect } from '../../fixtures/base.fixture';
import { addAllureMeta } from '../../reporters/allure.config';
import { userGenerator } from '../../test-data/generators/user.generator';

/**
 * Login — app.bluechew.com/log-in
 *
 * Functional: page renders + successful login flow (2 tests).
 * Regression: negative cases — wrong creds, empty fields, navigation links.
 */

// ── Functional ────────────────────────────────────────────────────────────────

test.describe('Login — Functional', { tag: ['@e2e', '@smoke'] }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test.only('login page renders email input, password input, and submit button', async ({ loginPage }) => {
    await addAllureMeta({
      feature: 'Authentication',
      story: 'Login Page UI',
      severity: 'blocker',
      layer: 'e2e',
    });

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('user logs in with valid credentials and lands on MY PLAN page', async ({ loginPage, membershipPage }) => {
    await addAllureMeta({
      feature: 'Authentication',
      story: 'Login → MY PLAN',
      severity: 'blocker',
      owner: 'qa-team',
      layer: 'e2e',
    });

    await loginPage.loginAsAdmin();

    await expect(loginPage.page).toHaveURL(/\/account\/membership/);
    await membershipPage.assertFullyLoaded();
  });
});

// ── Regression ────────────────────────────────────────────────────────────────

test.describe('Login — Regression', { tag: '@regression' }, () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test('wrong credentials shows error and stays on /log-in', async ({ loginPage }) => {
    await addAllureMeta({ feature: 'Authentication', story: 'Invalid Login', severity: 'critical', layer: 'e2e' });

    const { email, password } = userGenerator.generateCredentials();
    await loginPage.login(email, password);

    await loginPage.assertErrorVisible();
    await expect(loginPage.page).toHaveURL(/\/log-in/);
  });

  test('empty email field blocks submission', async ({ loginPage }) => {
    await loginPage.fill(loginPage.passwordInput, 'anypassword');
    await loginPage.click(loginPage.loginButton);
    await expect(loginPage.page).toHaveURL(/\/log-in/);
  });

  test('empty password field blocks submission', async ({ loginPage }) => {
    await loginPage.fill(loginPage.emailInput, 'test@example.com');
    await loginPage.click(loginPage.loginButton);
    await expect(loginPage.page).toHaveURL(/\/log-in/);
  });

  test('malformed email blocks submission', async ({ loginPage }) => {
    const invalidUser = userGenerator.withInvalidEmail();
    await loginPage.fill(loginPage.emailInput, invalidUser.email);
    await loginPage.fill(loginPage.passwordInput, 'anypassword');
    await loginPage.click(loginPage.loginButton);
    await expect(loginPage.page).toHaveURL(/\/log-in/);
  });

  test('Forgot Email? link navigates to /auth/forgot-email', async ({ loginPage }) => {
    await loginPage.clickForgotEmail();
    await expect(loginPage.page).toHaveURL(/forgot-email/);
  });

  test('Sign Up tab navigates to /register', async ({ loginPage }) => {
    await loginPage.clickSignUp();
    await expect(loginPage.page).toHaveURL(/\/register/);
  });
});
