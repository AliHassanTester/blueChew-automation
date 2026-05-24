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
    await this.page.locator('div.slide-btn').first().waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.locator('div.slide-btn').first().click();
    // Wait for strength heading to confirm next step rendered
    await this.page.locator('h2, h1').filter({ hasText: /select strength/i }).first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  private async clickVisibleContinue(stepHeadingPattern: RegExp, timeout = 15_000): Promise<void> {
    // Wait for the correct step heading, then click the first visible+enabled btn-primary
    await this.page.locator('h2, h1').filter({ hasText: stepHeadingPattern }).first()
      .waitFor({ state: 'visible', timeout });
    for (let attempt = 0; attempt < 30; attempt++) {
      const btns = this.page.locator('button.btn-primary');
      const count = await btns.count();
      for (let i = 0; i < count; i++) {
        const btn = btns.nth(i);
        if (
          await btn.isVisible().catch(() => false) &&
          !(await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true))
        ) {
          await btn.click();
          await this.page.waitForTimeout(600);
          return;
        }
      }
      await this.page.waitForTimeout(200);
    }
    throw new Error(`No visible+enabled btn-primary found for step: ${stepHeadingPattern}`);
  }

  private async selectStrength(): Promise<void> {
    await this.clickVisibleContinue(/select strength/i);
  }

  private async selectPlan(): Promise<void> {
    // Plan heading varies; wait for any plan-indicator text, then click continue
    await this.page.locator('text=/uses per month/i').first()
      .waitFor({ state: 'visible', timeout: 10_000 });
    for (let attempt = 0; attempt < 30; attempt++) {
      const btns = this.page.locator('button.btn-primary, button.btn-continue');
      const count = await btns.count();
      for (let i = 0; i < count; i++) {
        const btn = btns.nth(i);
        if (
          await btn.isVisible().catch(() => false) &&
          !(await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true))
        ) {
          await btn.click();
          await this.page.waitForTimeout(600);
          return;
        }
      }
      await this.page.waitForTimeout(200);
    }
    throw new Error('No visible+enabled continue button found for plan step');
  }

  // ── Pre-payment page → shipping form ────────────────────────────────────

  private async proceedToPayment(): Promise<void> {
    const proceedBtn = this.page.locator('button.cta-bar-payment-btn');
    const proceedVisible = await proceedBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!proceedVisible) return;

    await proceedBtn.click();
    await this.page.waitForFunction(
      () => !document.querySelector('.checkout-payment')?.classList.contains('hidden'),
      { timeout: 15_000 },
    );
    await this.page.waitForTimeout(500);
  }

  private async fillShippingForm(details: ShippingDetails): Promise<void> {
    // Wait for shipping form — works whether scoped inside .checkout-payment or standalone
    await this.page.locator("input[formcontrolname='line_1']").first()
      .waitFor({ state: 'visible', timeout: 15_000 });

    await this.page.locator("input[formcontrolname='line_1']").first().fill(details.streetAddress);
    if (details.aptSuite) {
      await this.page.locator("input[formcontrolname='line_2']").first().fill(details.aptSuite);
    }
    await this.page.locator("input[formcontrolname='city']").first().fill(details.city);
    await this.page.locator("select[formcontrolname='state']").first().selectOption({ label: details.state });
    await this.page.locator("input[formcontrolname='zip']").first().fill(details.zip);
    await this.page.locator("input[formcontrolname='phone']").first().fill(details.phone);
    await this.page.locator("input[formcontrolname='phone']").first().press('Tab');
    await this.page.waitForTimeout(600);

    const addrSubmit = this.page.locator('button.addr-submit-btn');
    if (await addrSubmit.isVisible().catch(() => false)) {
      await addrSubmit.click();
    } else {
      const btns = this.page.locator('button.btn-primary');
      const count = await btns.count();
      for (let j = 0; j < count; j++) {
        const btn = btns.nth(j);
        if (
          await btn.isVisible().catch(() => false) &&
          !(await btn.evaluate(el => el.hasAttribute('disabled')).catch(() => true))
        ) {
          await btn.click();
          await this.page.waitForTimeout(600);
          break;
        }
      }
    }
    await this.page.waitForTimeout(1_000);

    // Address verification popup — appears in two variants:
    //   popup-sheet layout (pre-payment flow): button.popup-sheet-action-confirm
    //   modal dialog layout (standalone flow):  button with text "Confirm"
    const confirmBtn = this.page.locator(
      'button.popup-sheet-action-confirm, button:has-text("Confirm")',
    ).first();
    const confirmVisible = await confirmBtn.isVisible().catch(() => false);
    if (confirmVisible) {
      await confirmBtn.click();
      await this.page.waitForTimeout(1_000);
    }
  }

  // ── Order summary assertion ──────────────────────────────────────────────

  async verifyOrderSummary(): Promise<void> {
    await test.step('Verify order summary — Gold $229', async () => {
      // $229.00 may exist in hidden pre-payment elements; wait for it to appear
      // in the visible body text (document.body.innerText returns only visible text)
      await this.page.waitForFunction(
        () => (document.body as HTMLElement).innerText.includes('229'),
        { timeout: 20_000 },
      );
    });
  }

  async proceedToPaymentForm(): Promise<void> {
    await test.step('Click Continue to Payment', async () => {
      const btn = this.page.locator(
        'button:has-text("CONTINUE TO PAYMENT"), button:has-text("Continue to Payment"), button.cta-bar-payment-btn',
      ).first();
      const visible = await btn.isVisible({ timeout: 8_000 }).catch(() => false);
      if (!visible) return; // payment form already showing
      await btn.click();
      // Wait until a Stripe iframe appears, signalling the payment form loaded
      await this.page.waitForFunction(
        () => !!document.querySelector('iframe[src*="stripe"]'),
        { timeout: 20_000 },
      );
      await this.page.waitForTimeout(500);
    });
  }

  // ── Payment form (Stripe) ────────────────────────────────────────────────

  async fillPaymentDetails(payment: PaymentDetails): Promise<void> {
    await test.step('Fill Stripe card details', async () => {
      await this.page.waitForFunction(
        () => !!document.querySelector('iframe[src*="stripe"]'),
        { timeout: 20_000 },
      );
      // Allow all Stripe sub-frames to fully initialise before scanning
      await this.page.waitForTimeout(2_500);

      // Scan every frame for card inputs — works across Stripe Payment Element
      // and Classic Elements which use different iframe URL/title schemes.
      const findInput = async (names: string[]) => {
        for (const frame of this.page.frames()) {
          for (const name of names) {
            const loc = frame.locator(`input[name="${name}"]`);
            if (await loc.isVisible({ timeout: 500 }).catch(() => false)) {
              return loc;
            }
          }
        }
        return null;
      };

      const cardInput = await findInput(['number', 'cardnumber', 'card-number']);
      if (!cardInput) {
        const frameUrls = this.page.frames().map(f => f.url().slice(0, 120)).join('\n');
        throw new Error(`Stripe card input not found in any frame.\nFrames:\n${frameUrls}`);
      }

      await cardInput.click();
      await cardInput.pressSequentially(payment.cardNumber, { delay: 30 });
      await this.page.waitForTimeout(300);

      const expiryInput = await findInput(['expiry', 'exp-date', 'exp', 'expiration']);
      if (expiryInput) {
        await expiryInput.click();
        await expiryInput.pressSequentially(payment.expiry, { delay: 30 });
        await this.page.waitForTimeout(300);
      }

      const cvcInput = await findInput(['cvc', 'cvv', 'cvc2', 'security-code']);
      if (cvcInput) {
        await cvcInput.click();
        await cvcInput.pressSequentially(payment.cvv, { delay: 30 });
      }

      await this.page.waitForTimeout(500);

      const billingLabel = this.page.locator('label.billing-row-check');
      const isChecked = await billingLabel.locator('input[type="checkbox"]').isChecked().catch(() => false);
      if (!isChecked) {
        await billingLabel.click();
        await this.page.waitForTimeout(300);
      }
    });
  }

  async completePurchase(): Promise<void> {
    await test.step('Click BUY NOW', async () => {
      // Wait for BUY NOW to become enabled (card details valid)
      const buyNow = this.page.locator('button.btn-place-order');
      await buyNow.waitFor({ state: 'visible', timeout: 10_000 });
      for (let i = 0; i < 20; i++) {
        const disabled = await buyNow.evaluate(el => el.hasAttribute('disabled')).catch(() => true);
        if (!disabled) break;
        await this.page.waitForTimeout(300);
      }
      await buyNow.click();
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
      await this.actions.waitForURL(/\/checkout\/confirmation/, 60_000);
    });
  }
}
