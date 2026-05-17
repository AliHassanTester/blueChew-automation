import { test as base } from './base.fixture';
import { AUTH_STATE_FILES } from '../helpers/auth.helper';
import { MembershipPage } from '../pages/membership.page';
import { OrdersPage } from '../pages/orders.page';
import { ProfilePage } from '../pages/profile.page';
import { PlansPage } from '../pages/plans.page';

/**
 * Authenticated fixture set.
 *
 * Injects the saved Playwright storageState (cookies set by the BlueChew app
 * during browser login) into a fresh context, bypassing the login UI for
 * every test. Global setup (`hooks/global.setup.ts`) must run first to
 * produce the `playwright-auth/admin.json` state file.
 *
 * Usage:
 *   import { test, expect } from '../../fixtures/auth.fixture';
 *
 *   test('membership page loads', async ({ membershipPage }) => {
 *     await membershipPage.navigate();
 *     await membershipPage.assertFullyLoaded();
 *   });
 */
export const test = base.extend({
  page: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE_FILES.admin,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  membershipPage: async ({ page }, use) => {
    await use(new MembershipPage(page));
  },

  ordersPage: async ({ page }, use) => {
    await use(new OrdersPage(page));
  },

  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },

  plansPage: async ({ page }, use) => {
    await use(new PlansPage(page));
  },
});

export { expect } from '@playwright/test';
