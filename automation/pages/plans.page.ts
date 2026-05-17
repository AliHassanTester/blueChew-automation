import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import { NavigationComponent } from '../components/navigation.component';
import { ROUTES } from '../constants/routes.constants';

/**
 * Plans page — /plans
 *
 * Displays all available BlueChew plan variants. Each plan has a radio button
 * (named by its plan ID: 81, 82, 83 observed in exploration, plus a default
 * selection). Plan tabs filter by active ingredient:
 *   sildenafil tadalafil apomorphine oxytocin | sildenafil tadalafil combo |
 *   sildenafil | tadalafil | caffeine sildenafil | vardenafil tadalafil combo |
 *   tadalafil multivitamin | vardenafil
 *
 * FAQ accordion checkboxes and a reviews carousel are also on the page.
 */
export class PlansPage extends BasePage {
  readonly pageUrl = ROUTES.PLANS;

  readonly nav = new NavigationComponent(this.page);

  // Plan category filter links (horizontal tabs)
  readonly maxComboTab  = this.page.locator('a[href*="sildenafil%20tadalafil%20combo"], a[href*="sildenafil+tadalafil+combo"]');
  readonly sildenafiltab = this.page.locator('a[href*="s=sildenafil"]:not([href*="tadalafil"])');
  readonly tadalafilTab  = this.page.locator('a[href*="s=tadalafil"]:not([href*="sildenafil"]):not([href*="multivitamin"])');
  readonly vardenafiltab = this.page.locator('a[href*="s=vardenafil"]:not([href*="tadalafil"])');
  readonly energyTab     = this.page.locator('a[href*="caffeine%20sildenafil"], a[href*="caffeine+sildenafil"]');

  // Plan radio buttons (by their value attribute)
  readonly planRadios    = this.page.locator('input[type="radio"]');

  // CTA to select / subscribe to a plan
  readonly selectPlanButton = this.page.locator('button:has-text("Select"), button:has-text("Get Started"), button:has-text("Choose")').first();

  // FAQ accordion (checkbox-based expand/collapse in the live app)
  readonly faqItems      = this.page.locator('input[type="checkbox"]');

  // Reviews carousel
  readonly reviewsCarousel    = this.page.locator('[class*="review"], [class*="testimonial"]').first();
  readonly carouselNextButton = this.page.locator('button:has-text("›"), button[aria-label*="next"]');
  readonly carouselPrevButton = this.page.locator('button:has-text("‹"), button[aria-label*="prev"]');

  constructor(page: Page) {
    super(page);
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertFullyLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/plans/);
    await expect(this.planRadios.first()).toBeVisible();
    await expect(this.nav.toggle).toBeVisible();
  }

  async assertPlanRadioCount(expected: number): Promise<void> {
    await expect(this.planRadios).toHaveCount(expected);
  }

  async assertFaqItemsVisible(): Promise<void> {
    await expect(this.faqItems.first()).toBeVisible();
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Select a plan radio by its value attribute (plan ID). */
  async selectPlanById(planId: string): Promise<void> {
    this.logger.step(`Selecting plan radio: ${planId}`);
    const radio = this.page.locator(`input[type="radio"][value="${planId}"]`);
    await radio.check();
    await expect(radio).toBeChecked();
  }

  /** Click the first visible plan radio (default selection). */
  async selectFirstPlan(): Promise<void> {
    this.logger.step('Selecting first available plan');
    await this.planRadios.first().check();
  }

  async clickNextReview(): Promise<void> {
    await this.click(this.carouselNextButton);
  }

  async toggleFaqItem(index: number): Promise<void> {
    this.logger.step(`Toggling FAQ item ${index}`);
    await this.faqItems.nth(index).click();
  }
}
