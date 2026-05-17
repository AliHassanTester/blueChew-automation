import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { MembershipPage } from '../pages/membership.page';
import { OrdersPage } from '../pages/orders.page';
import { ProfilePage } from '../pages/profile.page';
import { PlansPage } from '../pages/plans.page';
import type { PageFixtures } from '../interfaces/test-options.interface';

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
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
