import { test, expect } from '../../fixtures/auth.fixture';
import { addAllureMeta } from '../../reporters/allure.config';

/**
 * Orders E2E — /account/orders
 *
 * Tests the order history page for an authenticated user.
 * The test account (ali@meds.com) has at least one order:
 *   "DAILY TADALAFIL - 9MG TADALAFIL - 30 CHEWABLES / 1 Tin" (Order #28250982)
 */
test.describe('Orders', { tag: ['@e2e', '@orders'] }, () => {
  test.beforeEach(async ({ ordersPage }) => {
    await ordersPage.navigate();
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test(
    'orders page loads for authenticated user',
    { tag: ['@smoke', '@critical'] },
    async ({ ordersPage }) => {
      await addAllureMeta({
        feature: 'Orders',
        story: 'View Order History',
        severity: 'blocker',
        layer: 'e2e',
      });

      await ordersPage.assertFullyLoaded();
    },
  );

  test(
    'at least one order is displayed',
    { tag: '@smoke' },
    async ({ ordersPage }) => {
      await addAllureMeta({
        feature: 'Orders',
        story: 'Order List Not Empty',
        severity: 'critical',
        layer: 'e2e',
      });

      await ordersPage.assertAtLeastOneOrder();
    },
  );

  // ── Order card actions ────────────────────────────────────────────────────

  test(
    'Contact Support button is visible on each order',
    { tag: '@regression' },
    async ({ ordersPage }) => {
      await addAllureMeta({
        feature: 'Orders',
        story: 'Contact Support CTA',
        severity: 'normal',
        layer: 'e2e',
      });

      await ordersPage.assertContactSupportVisible();
    },
  );

  test(
    'Email Receipt button is visible on each order',
    { tag: '@regression' },
    async ({ ordersPage }) => {
      await addAllureMeta({
        feature: 'Orders',
        story: 'Email Receipt CTA',
        severity: 'normal',
        layer: 'e2e',
      });

      await ordersPage.assertEmailReceiptVisible();
    },
  );

  test(
    'Contact Support navigates to /contact',
    { tag: '@regression' },
    async ({ ordersPage }) => {
      await addAllureMeta({
        feature: 'Orders',
        story: 'Contact Support Navigation',
        severity: 'normal',
        layer: 'e2e',
      });

      await ordersPage.clickContactSupport();
      await expect(ordersPage.page).toHaveURL(/\/contact/);
    },
  );

  // ── Hold banner ───────────────────────────────────────────────────────────

  test(
    'plan hold banner is displayed when subscription is paused',
    { tag: '@regression' },
    async ({ ordersPage }) => {
      await addAllureMeta({
        feature: 'Orders',
        story: 'Plan Hold Banner',
        severity: 'normal',
        layer: 'e2e',
      });

      await ordersPage.assertHoldBannerVisible();
    },
  );

  // ── Navigation ────────────────────────────────────────────────────────────

  test(
    'nav menu → MY PLAN navigates to /account/membership',
    { tag: '@regression' },
    async ({ ordersPage }) => {
      await ordersPage.nav.goToMembership();
      await expect(ordersPage.page).toHaveURL(/\/account\/membership/);
    },
  );
});
