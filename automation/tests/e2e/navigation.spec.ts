import { test, expect } from '../../fixtures/auth.fixture';
import { addAllureMeta } from '../../reporters/allure.config';

/**
 * Navigation E2E
 *
 * Validates the hamburger nav menu on authenticated pages.
 * The nav consists of:
 *   1. Toggle button (nav-menu-toggle)
 *   2. Panel (nav-menu-panel) — reveals info links and a profile accordion
 *   3. Profile accordion (nav-menu-toggle-profile-links) — reveals account links
 *
 * All tests start from /account/membership (post-login landing).
 */
test.describe('Navigation', { tag: ['@e2e', '@navigation'] }, () => {
  test.beforeEach(async ({ membershipPage }) => {
    await membershipPage.navigate();
  });

  // ── Menu open/close ───────────────────────────────────────────────────────

  test(
    'hamburger toggle opens the nav panel',
    { tag: ['@smoke', '@critical'] },
    async ({ membershipPage }) => {
      await addAllureMeta({
        feature: 'Navigation',
        story: 'Open Nav Menu',
        severity: 'blocker',
        layer: 'e2e',
      });

      await membershipPage.nav.open();
      await membershipPage.nav.assertPanelVisible();
    },
  );

  test(
    'nav panel is hidden by default on page load',
    { tag: '@regression' },
    async ({ membershipPage }) => {
      await membershipPage.nav.assertPanelHidden();
    },
  );

  // ── Profile accordion links ───────────────────────────────────────────────

  test(
    'profile accordion reveals MY PLAN, Orders, Profile, Logout',
    { tag: '@regression' },
    async ({ membershipPage }) => {
      await addAllureMeta({
        feature: 'Navigation',
        story: 'Profile Accordion Links',
        severity: 'normal',
        layer: 'e2e',
      });

      await membershipPage.nav.openProfileLinks();

      await expect(membershipPage.nav.planLink).toBeVisible();
      await expect(membershipPage.nav.ordersLink).toBeVisible();
      await expect(membershipPage.nav.profileLink).toBeVisible();
      await expect(membershipPage.nav.logoutLink).toBeVisible();
    },
  );

  // ── Deep link navigation ──────────────────────────────────────────────────

  test(
    'nav → Orders lands on /account/orders',
    { tag: '@regression' },
    async ({ membershipPage }) => {
      await membershipPage.nav.goToOrders();
      await expect(membershipPage.page).toHaveURL(/\/account\/orders/);
    },
  );

  test(
    'nav → Profile lands on /account/profile',
    { tag: '@regression' },
    async ({ membershipPage }) => {
      await membershipPage.nav.goToProfile();
      await expect(membershipPage.page).toHaveURL(/\/account\/profile/);
    },
  );

  test(
    'nav → MY PLAN lands on /account/membership',
    { tag: '@regression' },
    async ({ membershipPage, page }) => {
      await page.goto('https://app.bluechew.com/account/orders', { waitUntil: 'domcontentloaded' });
      await membershipPage.nav.goToMembership();
      await expect(page).toHaveURL(/\/account\/membership/);
    },
  );

  test(
    'nav → Contact lands on /contact',
    { tag: '@regression' },
    async ({ membershipPage }) => {
      await membershipPage.nav.goToContact();
      await expect(membershipPage.page).toHaveURL(/\/contact/);
    },
  );

  test(
    'nav → FAQ lands on /faq/general',
    { tag: '@regression' },
    async ({ membershipPage }) => {
      await membershipPage.nav.goToFAQ();
      await expect(membershipPage.page).toHaveURL(/\/faq\/general/);
    },
  );

  // ── Logout ────────────────────────────────────────────────────────────────

  test(
    'logout navigates to /log-in',
    { tag: ['@critical', '@regression'] },
    async ({ membershipPage }) => {
      await addAllureMeta({
        feature: 'Authentication',
        story: 'Logout',
        severity: 'critical',
        layer: 'e2e',
      });

      await membershipPage.nav.logout();
      await expect(membershipPage.page).toHaveURL(/\/log-in/);
    },
  );
});
