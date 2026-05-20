/**
 * Smoke Test Suite — BlueChew (app.bluechew.com)
 *
 * Verifies the most critical paths are working after a deployment.
 * These tests should complete in < 5 minutes and gate every CI run.
 *
 * Rules:
 *  1. Maximum 10 tests
 *  2. Each test < 30 seconds
 *  3. Critical user journeys only — no edge cases
 *  4. Rely on the pre-existing test account (ali@meds.com)
 */
import { test as authTest, expect as authExpect } from '../../fixtures/auth.fixture';
import { test as baseTest, expect } from '../../fixtures/base.fixture';
import { addAllureMeta } from '../../reporters/allure.config';

// ── Unauthenticated checks ────────────────────────────────────────────────────

baseTest.describe('Smoke — Unauthenticated', { tag: ['@smoke', '@critical'] }, () => {
  baseTest('app is reachable (HTTP < 400)', async ({ page }) => {
    await addAllureMeta({ feature: 'Application Health', severity: 'blocker', layer: 'e2e' });

    const response = await page.goto('https://app.bluechew.com/log-in');
    expect(response?.status()).toBeLessThan(400);
  });

  baseTest('login page renders required fields', async ({ loginPage }) => {
    await addAllureMeta({ feature: 'Authentication', severity: 'blocker', layer: 'e2e' });

    await loginPage.navigate();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  baseTest('successful login redirects to /account/membership', async ({ loginPage, membershipPage }) => {
    await addAllureMeta({ feature: 'Authentication', severity: 'blocker', layer: 'e2e' });

    await loginPage.navigate();
    await loginPage.loginAsAdmin();

    await authExpect(loginPage.page).toHaveURL(/\/account\/membership/);
    await membershipPage.assertFullyLoaded();
  });

  baseTest('marketing site is reachable', async ({ page }) => {
    await addAllureMeta({ feature: 'Application Health', severity: 'critical', layer: 'e2e' });

    const response = await page.goto('https://bluechew.com');
    expect(response?.status()).toBeLessThan(400);
  });
});

// ── Authenticated checks ──────────────────────────────────────────────────────

authTest.describe('Smoke — Authenticated', { tag: ['@smoke', '@critical'] }, () => {
  authTest('MY PLAN page loads with plan details', async ({ membershipPage }) => {
    await addAllureMeta({ feature: 'Membership', severity: 'blocker', layer: 'e2e' });

    await membershipPage.navigate();
    await membershipPage.assertFullyLoaded();
    await authExpect(membershipPage.planTitle).toBeVisible();
  });

  authTest('Orders page loads with order history', async ({ ordersPage }) => {
    await addAllureMeta({ feature: 'Orders', severity: 'blocker', layer: 'e2e' });

    await ordersPage.navigate();
    await ordersPage.assertFullyLoaded();
    await ordersPage.assertAtLeastOneOrder();
  });

  authTest('Profile page loads with user information', async ({ profilePage }) => {
    await addAllureMeta({ feature: 'Profile', severity: 'critical', layer: 'e2e' });

    await profilePage.navigate();
    await profilePage.assertFullyLoaded();
  });

  authTest('Plans page loads with selectable plan options', async ({ plansPage }) => {
    await addAllureMeta({ feature: 'Plans', severity: 'critical', layer: 'e2e' });

    await plansPage.navigate();
    await plansPage.assertFullyLoaded();
    await authExpect(plansPage.planRadios.first()).toBeVisible();
  });

  authTest('Nav menu opens and profile links are accessible', async ({ membershipPage }) => {
    await addAllureMeta({ feature: 'Navigation', severity: 'blocker', layer: 'e2e' });

    await membershipPage.navigate();
    await membershipPage.nav.openProfileLinks();
    await authExpect(membershipPage.nav.ordersLink).toBeVisible();
    await authExpect(membershipPage.nav.profileLink).toBeVisible();
  });
});
