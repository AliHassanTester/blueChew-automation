import { test, expect } from '../../fixtures/auth.fixture';
import { addAllureMeta } from '../../reporters/allure.config';

/**
 * Profile E2E — /account/profile
 *
 * Tests profile display and navigation to sub-pages.
 * Notification toggles (SMS, Email) are observed — toggling them in CI
 * against a real account would change production state, so we assert their
 * existence and initial state rather than mutating them.
 */
test.describe('Profile', { tag: ['@e2e', '@profile'] }, () => {
  test.beforeEach(async ({ profilePage }) => {
    await profilePage.navigate();
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test(
    'profile page loads with user details',
    { tag: ['@smoke', '@critical'] },
    async ({ profilePage }) => {
      await addAllureMeta({
        feature: 'Profile',
        story: 'View Profile',
        severity: 'blocker',
        layer: 'e2e',
      });

      await profilePage.assertFullyLoaded();
      await expect(profilePage.userNameHeading).toBeVisible();
    },
  );

  test(
    'profile page displays correct user name',
    { tag: '@regression' },
    async ({ profilePage }) => {
      await addAllureMeta({
        feature: 'Profile',
        story: 'User Name Display',
        severity: 'normal',
        layer: 'e2e',
      });

      // The test account is "Ali Hassan"
      await profilePage.assertUserName(/Ali Hassan/i);
    },
  );

  // ── Notification preferences ──────────────────────────────────────────────

  test(
    'SMS and email notification toggles are present',
    { tag: '@regression' },
    async ({ profilePage }) => {
      await addAllureMeta({
        feature: 'Profile',
        story: 'Notification Preferences',
        severity: 'normal',
        layer: 'e2e',
      });

      await expect(profilePage.smsToggle).toBeVisible();
      await expect(profilePage.emailToggle).toBeVisible();
    },
  );

  // ── Sub-page navigation links ─────────────────────────────────────────────

  test(
    'Change Email link is present',
    { tag: '@regression' },
    async ({ profilePage }) => {
      await expect(profilePage.changeEmailLink).toBeVisible();
    },
  );

  test(
    'Change Phone link is present',
    { tag: '@regression' },
    async ({ profilePage }) => {
      await expect(profilePage.changePhoneLink).toBeVisible();
    },
  );

  test(
    'Change Password link navigates to change-password sub-page',
    { tag: '@regression' },
    async ({ profilePage }) => {
      await addAllureMeta({
        feature: 'Profile',
        story: 'Change Password Navigation',
        severity: 'normal',
        layer: 'e2e',
      });

      await profilePage.clickChangePassword();
      await expect(profilePage.page).toHaveURL(/change-password/);
    },
  );

  test(
    'Update Shipping Address link navigates correctly',
    { tag: '@regression' },
    async ({ profilePage }) => {
      await profilePage.clickUpdateShippingAddress();
      await expect(profilePage.page).toHaveURL(/update-shipping-address/);
    },
  );

  // ── Navigation ────────────────────────────────────────────────────────────

  test(
    'nav menu → Orders navigates to /account/orders',
    { tag: '@regression' },
    async ({ profilePage }) => {
      await profilePage.nav.goToOrders();
      await expect(profilePage.page).toHaveURL(/\/account\/orders/);
    },
  );
});
