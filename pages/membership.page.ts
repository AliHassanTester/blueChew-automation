import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import { NavigationComponent } from '../components/navigation.component';
import { ROUTES } from '../constants/routes.constants';

/**
 * MY PLAN page — /account/membership
 *
 * This is the post-login landing page. It shows the user's active plan
 * (e.g., "MAX COMBO"), a RESUME PLAN button when the plan is on hold,
 * and a "Shop Plans →" link to switch plans.
 *
 * Key UI signals from live exploration (app.bluechew.com):
 *   - Plan name rendered as H1 ("MAX COMBO", "GOLD", etc.)
 *   - "RESUME PLAN" CTA when subscription is paused
 *   - Orange hold banner at the top of the page
 *   - "Shop Plans →" link to /plans?context=switch
 *   - Nav hamburger menu (NavigationComponent)
 */
export class MembershipPage extends BasePage {
  readonly pageUrl = ROUTES.MEMBERSHIP;

  readonly nav = new NavigationComponent(this.page);

  // Plan card — "MY PLAN" heading in nav, plan name + resume button in card
  readonly pageHeading      = this.page.getByText('MY PLAN', { exact: true });
  readonly planTitle        = this.page.locator('h2, h3, [class*="plan"], [class*="combo"], [class*="product"]').first();
  readonly resumePlanButton = this.page.locator('button:has-text("RESUME PLAN"), button:has-text("Resume Plan")');
  readonly shopPlansLink    = this.page.locator('a:has-text("Shop Plans")').first();

  // Hold state — orange banner at top ("Your plan is on hold.")
  readonly holdBanner       = this.page.locator('text=/on hold/i').first();

  // Welcome greeting in top nav (shown as "Welcome, Ali")
  readonly welcomeButton    = this.page.locator('button:has-text("Welcome,")');

  constructor(page: Page) {
    super(page);
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertFullyLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/account\/membership/);
    // RESUME PLAN button is the most reliable ready signal — always visible for this account
    await expect(this.resumePlanButton).toBeVisible();
    await expect(this.nav.toggle).toBeVisible();
  }

  async assertPlanOnHold(): Promise<void> {
    await expect(this.holdBanner).toBeVisible();
    await expect(this.resumePlanButton).toBeVisible();
  }

  async assertPlanName(name: string | RegExp): Promise<void> {
    await expect(this.planTitle).toContainText(name);
  }

  async assertWelcomeGreeting(userName: string): Promise<void> {
    await expect(this.welcomeButton).toContainText(userName);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async clickResumePlan(): Promise<void> {
    this.logger.step('Clicking RESUME PLAN');
    await this.click(this.resumePlanButton);
  }

  async clickShopPlans(): Promise<void> {
    this.logger.step('Navigating to Plans via Shop Plans link');
    await this.click(this.shopPlansLink);
    await this.page.waitForURL(/\/plans/, { timeout: 15000 });
  }
}
