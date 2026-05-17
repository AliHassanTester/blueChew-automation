import type { Page } from '@playwright/test';
import type { LoginPage } from '../pages/login.page';
import type { MembershipPage } from '../pages/membership.page';
import type { OrdersPage } from '../pages/orders.page';
import type { ProfilePage } from '../pages/profile.page';
import type { PlansPage } from '../pages/plans.page';

export interface PageFixtures {
  loginPage: LoginPage;
  membershipPage: MembershipPage;
  ordersPage: OrdersPage;
  profilePage: ProfilePage;
  plansPage: PlansPage;
  authenticatedPage: Page;
}
