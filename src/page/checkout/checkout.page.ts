import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { ShippingDetails, PaymentDetails } from '@interfaces/registration.interface';

export class CheckoutPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
  }

  // ── Wizard steps (intro → strength → plan) ───────────────────────────────

  private async dismissProductIntroSlide(): Promise<void> {
    // The "Meet Gold" product intro may already have been dismissed during the
    // medical→checkout transition, so only click the slide button if it's showing.
    const slideBtn = this.page.locator('div.slide-btn').first();
    if (await slideBtn.isVisible().catch(() => false)) {
      await slideBtn.click();
    }
    // Confirm the strength step is rendered (reached either way)
    await this.page.locator('h2, h1').filter({ hasText: /select strength/i }).first()
      .waitFor({ state: 'visible' });
  }

  /** Waits for the step heading, then clicks the active (visible + enabled) CONTINUE. */
  private async clickVisibleContinue(stepHeadingPattern: RegExp): Promise<void> {
    await this.page.locator('h2, h1').filter({ hasText: stepHeadingPattern }).first()
      .waitFor({ state: 'visible' });
    await this.actions.clickFirstActionable('button.btn-primary');
  }

  private async selectStrength(): Promise<void> {
    await this.clickVisibleContinue(/select strength/i);
  }

  private async selectPlan(): Promise<void> {
    // Plan heading varies; wait for a plan-indicator, then click the active CONTINUE
    await this.page.locator('text=/uses per month/i').first().waitFor({ state: 'visible' });
    await this.actions.clickFirstActionable('button.btn-primary, button.btn-continue');
  }

  // ── Pre-payment page → shipping form ────────────────────────────────────

  private async proceedToPayment(): Promise<void> {
    const proceedBtn = this.page.locator('button.cta-bar-payment-btn');
    const shippingField = this.page.locator("input[formcontrolname='line_1']").first();

    // Variant 1 shows a "PROCEED TO PAYMENT" button that reveals the shipping form;
    // variant 2 shows the shipping form directly. Wait for whichever appears first,
    // then act — no fixed delay needed.
    await Promise.race([
      proceedBtn.waitFor({ state: 'visible' }).catch(() => undefined),
      shippingField.waitFor({ state: 'visible' }).catch(() => undefined),
    ]);

    if (await proceedBtn.isVisible().catch(() => false)) {
      await proceedBtn.click();
      await shippingField.waitFor({ state: 'visible' });
    }
  }

  private async fillShippingForm(details: ShippingDetails): Promise<void> {
    const line1 = this.page.locator("input[formcontrolname='line_1']").first();
    await line1.waitFor({ state: 'visible' });

    await line1.fill(details.streetAddress);
    if (details.aptSuite) {
      await this.page.locator("input[formcontrolname='line_2']").first().fill(details.aptSuite);
    }
    await this.page.locator("input[formcontrolname='city']").first().fill(details.city);
    await this.page.locator("select[formcontrolname='state']").first().selectOption({ label: details.state });
    await this.page.locator("input[formcontrolname='zip']").first().fill(details.zip);
    await this.page.locator("input[formcontrolname='phone']").first().fill(details.phone);
    await this.page.locator("input[formcontrolname='phone']").first().press('Tab');

    // Submit — the addr-submit-btn variant if present, else the active btn-primary
    const addrSubmit = this.page.locator('button.addr-submit-btn');
    if (await addrSubmit.isVisible().catch(() => false)) {
      await addrSubmit.click();
    } else {
      await this.actions.clickFirstActionable('button.btn-primary');
    }

    // Optional "Confirm your delivery address" modal — appears when the address can't
    // be auto-verified. Bounded wait because it may not appear for a valid address.
    const confirmBtn = this.page.locator(
      'button.popup-sheet-action-confirm, button:has-text("Confirm"), button:has-text("Use this address")',
    ).first();
    await confirmBtn.waitFor({ state: 'visible', timeout: 8_000 }).catch(() => undefined);
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }
  }

  // ── Order summary assertion ──────────────────────────────────────────────

  async verifyOrderSummary(): Promise<void> {
    await test.step('Verify order summary — Gold $229', async () => {
      // $229.00 may exist in hidden pre-payment elements; wait for it to appear in
      // the visible body text (document.body.innerText returns only visible text)
      await this.page.waitForFunction(
        () => (document.body as HTMLElement).innerText.includes('229'),
      );
    });
  }

  async proceedToPaymentForm(): Promise<void> {
    await test.step('Click Continue to Payment', async () => {
      const btn = this.page.locator(
        'button:has-text("CONTINUE TO PAYMENT"), button:has-text("Continue to Payment"), button.cta-bar-payment-btn',
      ).first();
      if (!(await btn.isVisible().catch(() => false))) return; // payment form already showing
      await btn.click();
      // Wait until a Stripe iframe appears, signalling the payment form loaded
      await this.page.waitForFunction(() => !!document.querySelector('iframe[src*="stripe"]'));
    });
  }

  // ── Payment form (Stripe) ────────────────────────────────────────────────

  async fillPaymentDetails(payment: PaymentDetails): Promise<void> {
    await test.step('Fill Stripe card details', async () => {
      await this.page.waitForFunction(() => !!document.querySelector('iframe[src*="stripe"]'));

      // Scan every frame for an input matching one of `names` — works across Stripe
      // Payment Element and Classic Elements, which use different iframe schemes.
      const findInput = async (names: string[]) => {
        for (const frame of this.page.frames()) {
          for (const name of names) {
            const loc = frame.locator(`input[name="${name}"]`);
            if (await loc.isVisible().catch(() => false)) return loc;
          }
        }
        return null;
      };

      // Stripe's card-input iframe attaches progressively (the loader UI shows first),
      // so poll until the card-number field is present rather than guessing a delay.
      let cardInput: Awaited<ReturnType<typeof findInput>> = null;
      for (let i = 0; i < 30 && !cardInput; i++) {
        cardInput = await findInput(['number', 'cardnumber', 'card-number']);
        if (!cardInput) await this.page.waitForTimeout(500);
      }
      if (!cardInput) {
        const frameUrls = this.page.frames().map(f => f.url().slice(0, 120)).join('\n');
        throw new Error(`Stripe card input not found in any frame.\nFrames:\n${frameUrls}`);
      }

      await cardInput.click();
      await cardInput.pressSequentially(payment.cardNumber, { delay: 30 });

      const expiryInput = await findInput(['expiry', 'exp-date', 'exp', 'expiration']);
      if (expiryInput) {
        await expiryInput.click();
        await expiryInput.pressSequentially(payment.expiry, { delay: 30 });
      }

      const cvcInput = await findInput(['cvc', 'cvv', 'cvc2', 'security-code']);
      if (cvcInput) {
        await cvcInput.click();
        await cvcInput.pressSequentially(payment.cvv, { delay: 30 });
      }

      // Optional "billing address same as shipping" checkbox — absent in some variants
      const billingLabel = this.page.locator('label.billing-row-check');
      if (await billingLabel.isVisible().catch(() => false)) {
        const isChecked = await billingLabel.locator('input[type="checkbox"]').isChecked().catch(() => false);
        if (!isChecked) await billingLabel.click();
      }
    });
  }

  async completePurchase(): Promise<void> {
    await test.step('Click BUY NOW', async () => {
      // clickFirstActionable auto-waits for the button to be visible AND enabled
      // (it stays disabled until the card details are valid). The label/class varies
      // by variant — "Buy Now" text or the legacy btn-place-order class.
      await this.actions.clickFirstActionable(
        'button.btn-place-order, button:has-text("Buy Now")',
      );
    });
  }

  // ── Public composite API ─────────────────────────────────────────────────

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

      await test.step('Proceed to payment page', async () => {
        await this.proceedToPayment();
      });

      await test.step('Fill and confirm shipping address', async () => {
        await this.fillShippingForm(shipping);
      });
    });
  }

  async verifyCheckoutComplete(): Promise<void> {
    await test.step('Verify checkout reached confirmation page', async () => {
      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();
      await this.verify.waitForProcessingLoaderToDisappear();
      await this.actions.waitForURL(/\/checkout\/confirmation/);
    });
  }
}
