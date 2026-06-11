import { Page, TestInfo, test, expect, Locator } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { ShippingDetails, PaymentDetails } from '@interfaces/registration.interface';

/**
 * Checkout wizard (/checkout): product intro → strength → plan → shipping → order
 * summary → payment. Shipping fields expose stable `formcontrolname`s and the address
 * submit a `data-test-id`. The payment step renders an Adyen secured-fields form
 * (NOT Stripe), so card entry scans all frames by input name and readiness is gated on the
 * place-order button rather than a provider-specific iframe.
 */
export class CheckoutPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);

    this.locators = {
      // ── Product intro slide ("Meet Gold") ──────────────────────────────────
      productIntroSlideButton: {
        description: 'Product Intro Slide CONTINUE Button',
        locator: this.page.locator('div.slide-btn').first(),
      },
      strengthHeading: {
        description: 'Select Strength Step Heading',
        locator: this.page.locator('h2, h1').filter({ hasText: /select strength/i }).first(),
      },
      planIndicator: {
        description: 'Plan Step Indicator ("uses per month")',
        locator: this.page.locator('text=/uses per month/i').first(),
      },

      // ── Pre-payment page → shipping ────────────────────────────────────────
      proceedToPaymentButton: {
        description: 'PROCEED TO PAYMENT Button',
        locator: this.page.locator('button.cta-bar-payment-btn'),
      },
      shippingLine1: {
        description: 'Shipping Address Line 1 Input',
        locator: this.page.locator("input[formcontrolname='line_1']").first(),
      },
      shippingLine2: {
        description: 'Shipping Address Line 2 (Apt/Suite) Input',
        locator: this.page.locator("input[formcontrolname='line_2']").first(),
      },
      shippingCity: {
        description: 'Shipping City Input',
        locator: this.page.locator("input[formcontrolname='city']").first(),
      },
      shippingState: {
        description: 'Shipping State Dropdown',
        locator: this.page.locator("select[formcontrolname='state']").first(),
      },
      shippingZip: {
        description: 'Shipping ZIP Input',
        locator: this.page.locator("input[formcontrolname='zip']").first(),
      },
      shippingPhone: {
        description: 'Shipping Phone Input',
        locator: this.page.locator("input[formcontrolname='phone']").first(),
      },
      addressSubmitButton: {
        description: 'Shipping Address Submit Button',
        locator: this.page.locator('[data-test-id="address-form-submit"], button.addr-submit-btn').first(),
      },
      addressConfirmButton: {
        description: 'Confirm Delivery Address Modal Button',
        locator: this.page.locator(
          'button.popup-sheet-action-confirm, button:has-text("Confirm"), button:has-text("Use this address")',
        ).first(),
      },

      // ── Order summary → payment ────────────────────────────────────────────
      continueToPaymentButton: {
        description: 'CONTINUE TO PAYMENT Button',
        locator: this.page.locator(
          'button:has-text("CONTINUE TO PAYMENT"), button:has-text("Continue to Payment"), button.cta-bar-payment-btn',
        ).first(),
      },
      buyNowButton: {
        description: 'BUY NOW / Place Order Button',
        locator: this.page.locator('button.btn-place-order, button:has-text("Buy Now")').first(),
      },
      billingSameAsShippingLabel: {
        description: 'Billing Same As Shipping Checkbox Label',
        locator: this.page.locator('label.billing-row-check'),
      },
    };
  }

  // ── Wizard steps (intro → strength → plan) ───────────────────────────────

  private async dismissProductIntroSlide(): Promise<void> {
    // The "Meet Gold" product intro may already have been dismissed during the
    // medical→checkout transition, so only click the slide button if it's showing.
    if (await this.verify.isElementVisible(this.locators.productIntroSlideButton).catch(() => false)) {
      await this.actions.click(this.locators.productIntroSlideButton);
    }
    // Confirm the strength step is rendered (reached either way)
    await this.verify.waitForVisibility(this.locators.strengthHeading);
  }

  // ── Pre-payment page → shipping form ────────────────────────────────────

  private async proceedToPayment(): Promise<void> {
    // Variant 1 shows a "PROCEED TO PAYMENT" button that reveals the shipping form;
    // variant 2 shows the shipping form directly. Wait for whichever appears first,
    // then act — no fixed delay needed.
    await Promise.race([
      this.locators.proceedToPaymentButton.locator.waitFor({ state: 'visible' }).catch(() => undefined),
      this.locators.shippingLine1.locator.waitFor({ state: 'visible' }).catch(() => undefined),
    ]);

    if (await this.verify.isElementVisible(this.locators.proceedToPaymentButton).catch(() => false)) {
      await this.actions.click(this.locators.proceedToPaymentButton);
      await this.verify.waitForVisibility(this.locators.shippingLine1);
    }
  }

  private async fillShippingForm(details: ShippingDetails): Promise<void> {
    await this.verify.waitForVisibility(this.locators.shippingLine1);

    await this.actions.sendKeys(this.locators.shippingLine1, details.streetAddress);
    if (details.aptSuite) {
      await this.actions.sendKeys(this.locators.shippingLine2, details.aptSuite);
    }
    await this.actions.sendKeys(this.locators.shippingCity, details.city);
    await this.actions.selectFromDropdown(this.locators.shippingState, details.state);
    await this.actions.sendKeys(this.locators.shippingZip, details.zip);
    await this.actions.sendKeys(this.locators.shippingPhone, details.phone);
    await this.actions.pressKey(this.locators.shippingPhone, 'Tab');

    // Submit — the addr-submit-btn / data-test-id variant if present, else the active btn-primary
    if (await this.verify.isElementVisible(this.locators.addressSubmitButton).catch(() => false)) {
      await this.actions.click(this.locators.addressSubmitButton);
    } else {
      await this.actions.clickFirstActionable('button.btn-primary');
    }

    // Optional "Confirm your delivery address" modal — appears when the address can't
    // be auto-verified. Bounded wait because it may not appear for a valid address.
    await this.locators.addressConfirmButton.locator
      .waitFor({ state: 'visible', timeout: 8_000 }).catch(() => undefined);
    if (await this.verify.isElementVisible(this.locators.addressConfirmButton).catch(() => false)) {
      await this.actions.click(this.locators.addressConfirmButton);
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
      if (!(await this.verify.isElementVisible(this.locators.continueToPaymentButton).catch(() => false))) {
        return; // payment form already showing
      }
      await this.actions.click(this.locators.continueToPaymentButton);
      // Provider-agnostic readiness: the place-order button renders once the payment
      // form (Adyen secured fields) has mounted — no Stripe-specific iframe wait.
      await this.verify.waitForVisibility(this.locators.buyNowButton);
    });
  }

  // ── Payment form (Adyen secured fields, embedded in cross-origin iframes) ──

  /**
   * Scans every frame for an input matching one of `names`. Works across payment
   * providers (Adyen / Stripe / Checkout.com) and across Payment-Element vs Classic
   * schemes, which each name their secured-field inputs differently.
   */
  private async findFrameInput(names: string[]): Promise<Locator | null> {
    for (const frame of this.page.frames()) {
      for (const name of names) {
        const loc = frame.locator(`input[name="${name}"]`);
        if (await loc.isVisible().catch(() => false)) return loc;
      }
    }
    return null;
  }

  async fillPaymentDetails(payment: PaymentDetails): Promise<void> {
    await test.step('Fill card details', async () => {
      // The card field mounts progressively inside a cross-origin payment iframe.
      // expect.poll retries the frame scan on its own cadence — no fixed wait needed.
      let cardInput: Locator | null = null;
      await expect
        .poll(async () => {
          cardInput = await this.findFrameInput(['number', 'cardnumber', 'card-number', 'encryptedCardNumber']);
          return cardInput !== null;
        }, { timeout: 30_000, message: 'Card-number field never mounted in any payment frame' })
        .toBeTruthy();

      await cardInput!.click();
      await cardInput!.pressSequentially(payment.cardNumber, { delay: 30 });

      const expiryInput = await this.findFrameInput(['expiry', 'exp-date', 'exp', 'expiration', 'encryptedExpiryDate']);
      if (expiryInput) {
        await expiryInput.click();
        await expiryInput.pressSequentially(payment.expiry, { delay: 30 });
      }

      const cvcInput = await this.findFrameInput(['cvc', 'cvv', 'cvc2', 'security-code', 'encryptedSecurityCode']);
      if (cvcInput) {
        await cvcInput.click();
        await cvcInput.pressSequentially(payment.cvv, { delay: 30 });
      }

      // Optional "billing address same as shipping" checkbox — absent in some variants
      if (await this.verify.isElementVisible(this.locators.billingSameAsShippingLabel).catch(() => false)) {
        const isChecked = await this.locators.billingSameAsShippingLabel.locator
          .locator('input[type="checkbox"]').isChecked().catch(() => false);
        if (!isChecked) await this.actions.click(this.locators.billingSameAsShippingLabel);
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
        await this.verify.waitForVisibility(this.locators.strengthHeading);
        await this.actions.clickFirstActionable('button.btn-primary');
      });

      await test.step('Select plan (12 uses/month — Most Popular)', async () => {
        await this.verify.waitForVisibility(this.locators.planIndicator);
        await this.actions.clickFirstActionable('button.btn-primary, button.btn-continue');
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
