import { test, expect } from '../../fixtures/auth.fixture';
import { addAllureMeta } from '../../reporters/allure.config';

/**
 * Membership (MY PLAN) E2E — /account/membership
 *
 * Uses auth.fixture so tests start with an authenticated session.
 * This is the post-login landing page. The account under test (ali@meds.com)
 * has its plan on hold, so hold-state assertions are included.
 */
test.describe('Membership — MY PLAN', { tag: ['@e2e', '@membership'] }, () => {
  test.beforeEach(async ({ membershipPage }) => {
    await membershipPage.navigate();
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test(
    'MY PLAN page loads and shows current plan',
    { tag: ['@smoke', '@critical'] },
    async ({ membershipPage }) => {
      await addAllureMeta({
        feature: 'Membership',
        story: 'View Current Plan',
        severity: 'blocker',
        layer: 'e2e',
      });

      await membershipPage.assertFullyLoaded();
      await expect(membershipPage.planTitle).toBeVisible();
    },
  );

  test(
    'page URL is /account/membership after login',
    { tag: '@smoke' },
    async ({ membershipPage }) => {
      await expect(membershipPage.page).toHaveURL(/\/account\/membership/);
    },
  );

  test(
    'page title is correct',
    { tag: '@smoke' },
    async ({ membershipPage }) => {
      await membershipPage.assertTitle(/Membership\s*\|\s*BlueChew/i);
    },
  );

  // ── Plan hold state ───────────────────────────────────────────────────────

  test(
    'hold banner and RESUME PLAN button are visible when plan is paused',
    { tag: ['@smoke', '@critical'] },
    async ({ membershipPage }) => {
      await addAllureMeta({
        feature: 'Membership',
        story: 'Plan On Hold',
        severity: 'blocker',
        layer: 'e2e',
      });

      await membershipPage.assertPlanOnHold();
    },
  );

  // ── Navigation ────────────────────────────────────────────────────────────

  test(
    'hamburger nav toggle opens the nav panel',
    { tag: '@regression' },
    async ({ membershipPage }) => {
      await addAllureMeta({
        feature: 'Navigation',
        story: 'Open Nav Menu',
        severity: 'normal',
        layer: 'e2e',
      });

      await membershipPage.nav.open();
      await membershipPage.nav.assertPanelVisible();
    },
  );

  test(
    'Shop Plans link navigates to /plans',
    { tag: '@regression' },
    async ({ membershipPage }) => {
      await addAllureMeta({
        feature: 'Membership',
        story: 'Navigate to Plans',
        severity: 'normal',
        layer: 'e2e',
      });

      await membershipPage.clickShopPlans();
      await expect(membershipPage.page).toHaveURL(/\/plans/);
    },
  );

  test(
    'nav menu → Orders navigates to /account/orders',
    { tag: '@regression' },
    async ({ membershipPage }) => {
      await membershipPage.nav.goToOrders();
      await expect(membershipPage.page).toHaveURL(/\/account\/orders/);
    },
  );

  test(
    'nav menu → Profile navigates to /account/profile',
    { tag: '@regression' },
    async ({ membershipPage }) => {
      await membershipPage.nav.goToProfile();
      await expect(membershipPage.page).toHaveURL(/\/account\/profile/);
    },
  );
});
