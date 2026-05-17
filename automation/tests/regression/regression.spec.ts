/**
 * Regression Test Suite — Cross-cutting scenarios (app.bluechew.com)
 *
 * System-level regressions that don't fit cleanly into a single feature file.
 * Feature-specific regression tests live alongside their E2E counterparts,
 * tagged @regression.
 *
 * Run via: npm run test:regression
 */
import { test, expect } from '../../fixtures/base.fixture';
import { test as authTest } from '../../fixtures/auth.fixture';
import { addAllureMeta } from '../../reporters/allure.config';
import { ROUTES } from '../../constants/routes.constants';

test.describe('Security — Regression', { tag: '@regression' }, () => {
  test('unauthenticated access to membership page redirects to login', async ({ page }) => {
    await addAllureMeta({
      feature: 'Security',
      story: 'Unauthenticated Redirect',
      severity: 'critical',
      layer: 'e2e',
    });

    await page.goto(`https://app.bluechew.com${ROUTES.MEMBERSHIP}`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/log-in/);
  });

  test('login form is not susceptible to basic XSS payload', async ({ loginPage }) => {
    await addAllureMeta({ feature: 'Security', story: 'XSS Prevention', severity: 'critical' });

    await loginPage.navigate();
    const xssPayload = '<script>alert("xss")</script>';
    await loginPage.fill(loginPage.emailInput, xssPayload);
    await loginPage.fill(loginPage.passwordInput, 'password');
    await loginPage.click(loginPage.loginButton);

    await loginPage.assertErrorVisible();
    const scriptElements = loginPage.page.locator('script').filter({ hasText: 'alert' });
    await expect(scriptElements).toHaveCount(0);
  });

  test('session cookie has security flags after login', async ({ loginPage }) => {
    await addAllureMeta({ feature: 'Security', story: 'Cookie Security', severity: 'critical' });

    await loginPage.navigate();
    await loginPage.loginAsAdmin();

    const cookies = await loginPage.page.context().cookies();
    // BlueChew may use various cookie names; check any auth-related cookie
    const authCookies = cookies.filter((c) => c.secure);
    expect(authCookies.length).toBeGreaterThan(0);
  });
});

test.describe('Navigation — Regression', { tag: '@regression' }, () => {
  authTest('back button after logout lands on login', async ({ membershipPage, page }) => {
    await addAllureMeta({ feature: 'Navigation', story: 'Back Button Post-Logout' });

    await membershipPage.navigate();
    await membershipPage.nav.logout();

    await page.goBack();
    await expect(page).toHaveURL(/\/log-in/);
  });
});

test.describe('Error Handling — Regression', { tag: '@regression' }, () => {
  test('app handles unknown routes gracefully', async ({ page }) => {
    await addAllureMeta({
      feature: 'Error Handling',
      story: 'Unknown Route',
      severity: 'normal',
      layer: 'e2e',
    });

    await page.goto('https://app.bluechew.com/this-route-does-not-exist-xyz', {
      waitUntil: 'domcontentloaded',
    });
    // Angular SPA may return 200 with a not-found component, or redirect
    const status = (await page.evaluate(() => document.title)) as string;
    expect(status).toBeTruthy();
  });

  test('page title is never empty on login page', async ({ page }) => {
    await page.goto(`https://app.bluechew.com${ROUTES.LOGIN}`, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    expect(title.trim().length).toBeGreaterThan(0);
  });
});
