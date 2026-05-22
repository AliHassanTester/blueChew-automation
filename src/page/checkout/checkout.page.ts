import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { ShippingDetails } from '@interfaces/registration.interface';

export class CheckoutPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
  }

  // ── Sub-step helpers ─────────────────────────────────────────────────────────

  // Each checkout sub-step uses a different button class:
  //   intro slide  → div.slide-btn
  //   strength     → button.btn-primary
  //   plan         → button.btn-continue
  //   shipping     → button.btn-primary
  private async clickContinue(): Promise<void> {
    const selectors = ['button.btn-primary', 'button.btn-continue', 'div.slide-btn'];
    for (let attempt = 0; attempt < 20; attempt++) {
      for (const sel of selectors) {
        const count = await this.page.locator(sel).count();
        for (let i = 0; i < count; i++) {
          const btn = this.page.locator(sel).nth(i);
          const visible = await btn.isVisible().catch(() => false);
          const disabled = await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
          if (visible && !disabled) {
            await btn.click();
            await this.actions.waitForDomLoad();
            await this.verify.waitForLoaderToDisappear();
            return;
          }
        }
      }
      await this.page.waitForTimeout(200);
    }
    throw new Error('No continue button found on checkout page (tried btn-primary, btn-continue, slide-btn)');
  }

  /** Step 1 — product intro slide ("Meet Gold"). Uses a div.slide-btn. */
  private async dismissProductIntroSlide(): Promise<void> {
    await this.page.locator('div.slide-btn').first().waitFor({ state: 'visible', timeout: 15_000 });
    await this.clickContinue();
  }

  /** Step 2 — strength selection. High Strength (Most Popular) is pre-selected. */
  private async selectStrength(): Promise<void> {
    // Both strength + plan h2s may be in the DOM simultaneously (Angular).
    await this.page
      .locator('h2.page-title', { hasText: 'Select strength' })
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });
    await this.clickContinue();
  }

  /** Step 3 — plan/quantity selection. 12 uses/month (Most Popular) is pre-selected.
   *  CONTINUE here uses class btn-continue, not btn-primary.
   */
  private async selectPlan(): Promise<void> {
    // Heading text varies; wait for any plan option card instead.
    await this.page.locator('text=12 uses per month').first().waitFor({ state: 'visible', timeout: 10_000 });
    await this.clickContinue();
  }

  /** Step 4 — shipping information form.
   *  Angular renders a hidden billing form with identical formcontrolnames.
   *  The shipping form is always the first match — use .first() on every locator.
   */
  private async fillShippingForm(details: ShippingDetails): Promise<void> {
    const field = (fcn: string) =>
      this.page.locator(`input[formcontrolname='${fcn}']`).first();
    const stateSelect = () =>
      this.page.locator("select[formcontrolname='state']").first();

    await field('line_1').waitFor({ state: 'visible', timeout: 10_000 });

    await field('line_1').fill(details.streetAddress);

    if (details.aptSuite) {
      await field('line_2').fill(details.aptSuite);
    }

    await field('city').fill(details.city);
    await stateSelect().selectOption({ label: details.state });
    await field('zip').fill(details.zip);
    await field('phone').fill(details.phone);
    await field('phone').press('Tab');
    await this.page.waitForTimeout(400);

    await this.clickContinue();
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  async completeCheckout(shipping: ShippingDetails): Promise<void> {
    await test.step('Complete checkout flow', async () => {
      await test.step('Dismiss product intro slide', async () => {
        await this.dismissProductIntroSlide();
      });

      await test.step('Select strength (High Strength — Most Popular)', async () => {
        await this.selectStrength();
      });

      await test.step('Select plan (12 uses/month — Most Popular)', async () => {
        await this.selectPlan();
      });

      await test.step('Fill shipping information', async () => {
        await this.fillShippingForm(shipping);
      });
    });
  }

  async verifyCheckoutComplete(): Promise<void> {
    await test.step('Verify checkout shipping step submitted', async () => {
      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();
      await this.verify.waitForProcessingLoaderToDisappear();
    });
  }
}
