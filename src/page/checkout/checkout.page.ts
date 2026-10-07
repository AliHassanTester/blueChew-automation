import { Page, TestInfo, test, expect, Locator } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { ShippingDetails, PaymentDetails } from '@interfaces/signup-to-approved-order.interface';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import { VisualHelper } from '@utilities/visual.helper';

/**
 * Checkout wizard (/checkout): product intro → Select strength → Select quantity → order
 * summary (Checkout) → shipping address (PROCEED TO PAYMENT) → "Confirm your delivery
 * address" modal → payment (BUY NOW). The intro/summary is a carousel (every slide kept in
 * the DOM, hidden but for the active one), and shipping fields expose stable
 * `formcontrolname`s. Card entry is a **Stripe or Adyen** card form (the provider varies per
 * session), rendered in cross-origin iframes; fields are located by their accessible label
 * (which handles both), and BUY NOW enables once the card is valid.
 */
export class CheckoutPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly visual?: VisualHelper;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo, visual?: VisualHelper) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
    this.visual = visual;

    this.locators = {
      // ── Order summary ──────────────────────────────────────────────────────
      // The checkout is a carousel that keeps every slide (and its CTA) in the DOM, hidden
      // but for the active one, so each CTA is scoped to the visible copy.
      checkoutButton: {
        description: 'Order Summary → Checkout Button',
        locator: this.page.locator("//button[normalize-space()='Checkout']").filter({ visible: true }).first(),
      },

      // ── Shipping address form ──────────────────────────────────────────────
      // A second, hidden address form (billing template under `.hidden`) carries the same
      // formcontrolnames, so every field is scoped to the visible one.
      shippingLine1: {
        description: 'Shipping Address Line 1 Input',
        locator: this.page.locator("//input[@formcontrolname='line_1']").filter({ visible: true }).first(),
      },
      shippingLine2: {
        description: 'Shipping Address Line 2 (Apt/Suite) Input',
        locator: this.page.locator("//input[@formcontrolname='line_2']").filter({ visible: true }).first(),
      },
      shippingCity: {
        description: 'Shipping City Input',
        locator: this.page.locator("//input[@formcontrolname='city']").filter({ visible: true }).first(),
      },
      shippingState: {
        description: 'Shipping State Dropdown',
        locator: this.page.locator("//select[@formcontrolname='state']").filter({ visible: true }).first(),
      },
      shippingZip: {
        description: 'Shipping ZIP Input',
        locator: this.page.locator("//input[@formcontrolname='zip']").filter({ visible: true }).first(),
      },
      shippingPhone: {
        description: 'Shipping Phone Input',
        locator: this.page.locator("//input[@formcontrolname='phone']").filter({ visible: true }).first(),
      },
      proceedToPaymentButton: {
        description: 'Add Shipping Address Submit Button',
        locator: this.page.locator('//button[@data-test-id="address-form-submit"]')
          .or(this.page.locator('//button[normalize-space()="PROCEED TO PAYMENT"]'))
          .or(this.page.locator('//button[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "add shipping address")]'))
          .or(this.page.locator('//button[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "add shipping address")]'))
          .filter({ visible: true })
          .first(),
      },
      addressConfirmButton: {
        description: 'Confirm Delivery Address Modal — Confirm Button',
        locator: this.page.locator("//button[normalize-space()='Confirm' or normalize-space()='CONFIRM']").filter({ visible: true }).first(),
      },

      // ── Payment (Stripe) ───────────────────────────────────────────────────
      billingSameAsShippingCheckbox: {
        description: 'Use Shipping Address for Billing Checkbox',
        locator: this.page.locator("//input[@type='checkbox']").first(),
      },
      buyNowButton: {
        description: 'BUY NOW / Place Order Button',
        locator: this.page
          .locator(
            '//button[@data-test-id="checkout-buy-now-button"] | //button[normalize-space()="Buy Now"] | //button[normalize-space()="BUY NOW"]',
          )
          .filter({ visible: true })
          .first(),
      },
      // ── Shipping method selection ─────────────────────────────────────────
      // After the address is confirmed, the app shows a "Select Shipping Method" step.
      // Ground is pre-selected; click "Add Shipping Method" to proceed to payment.
      addShippingMethodButton: {
        description: 'Add Shipping Method Button',
        locator: this.page.locator("//button[normalize-space()='Add Shipping Method']").filter({ visible: true }).first(),
      },
    };
  }

  // ── Visual Checkpoints ───────────────────────────────────────────────────

  async captureCheckoutSnapshot(visualConfig?: ApplitoolsVisualConfig, tag: string = 'Checkout page loaded'): Promise<void> {
    await test.step(`Capture the fully loaded ${tag} state`, async () => {
      await this.page.waitForLoadState('load').catch(() => undefined);
      if (this.visual) {
        await this.visual.captureCheckpoint(tag, visualConfig);
      }
    });
  }

  // ── Wizard steps ──────────────────────────────────────────────────────────

  /**
   * Advances the product carousel (product match / pre-selected strength+quantity) to the
   * order summary by clicking the active CONTINUE until the summary's Checkout button
   * appears. The carousel keeps every slide's heading in the DOM (hidden but for the active
   * one), so it is driven off the Checkout button — not the step headings.
   */
  private async advanceToOrderSummary(): Promise<void> {
    // The app sometimes skips the product carousel entirely and lands directly on the
    // shipping address page (e.g. when the plan/strength is pre-selected). Detect this
    // early: if the shipping form is already visible, there is nothing to advance.
    const shippingFormVisible = await this.locators.shippingLine1.locator
      .isVisible()
      .catch(() => false);
    if (shippingFormVisible) return;

    for (let i = 0; i < 4; i++) {
      if (await this.verify.isElementVisible(this.locators.checkoutButton).catch(() => false)) break;
      // The intro slide's CONTINUE is a styled div (not a <button>) while later slides use
      // a real button, so match the control by its visible text regardless of tag.
      const continueControl = this.page.getByText('CONTINUE', { exact: true }).filter({ visible: true }).first();
      if (!(await continueControl.isVisible().catch(() => false))) break;
      await continueControl.click();
      // Wait for the inter-slide loader to actually cycle (it fetches pricing on the
      // strength/quantity transitions) rather than racing ahead before it mounts.
      await this.verify.waitForLoaderSettled();
    }

    // Only wait for Checkout button if we haven't already landed on shipping.
    const onShipping = await this.locators.shippingLine1.locator.isVisible().catch(() => false);
    if (!onShipping) {
      await this.verify.waitForVisibility(this.locators.checkoutButton);
    }
  }

  private async fillShippingForm(details: ShippingDetails): Promise<void> {
    await this.verify.waitForVisibility(this.locators.shippingLine1);

    await this.actions.sendKeys(this.locators.shippingLine1, details.streetAddress);
    await this.actions.pressKey(this.locators.shippingLine1, 'Escape');
    if (details.aptSuite) {
      await this.actions.sendKeys(this.locators.shippingLine2, details.aptSuite);
    }
    await this.actions.sendKeys(this.locators.shippingCity, details.city);
    await this.actions.selectFromDropdown(this.locators.shippingState, details.state);
    await this.actions.sendKeys(this.locators.shippingZip, details.zip);
    await this.actions.sendKeys(this.locators.shippingPhone, details.phone);
    await this.actions.pressKey(this.locators.shippingPhone, 'Tab');

    // PROCEED TO PAYMENT enables once the address is valid.
    await this.actions.click(this.locators.proceedToPaymentButton);
    // "Confirm your delivery address" modal — always appears for automation test addresses
    // that fail USPS verification. Wait up to 20 s for the API to respond.
    await this.locators.addressConfirmButton.locator
      .waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);
    if (await this.verify.isElementVisible(this.locators.addressConfirmButton).catch(() => false)) {
      await this.actions.click(this.locators.addressConfirmButton);
    }
  }

  // ── Order summary assertion ──────────────────────────────────────────────

  async verifyOrderSummary(): Promise<void> {
    await test.step('Verify order summary — Gold $229', async () => {
      await this.page.waitForFunction(
        () => (document.body as HTMLElement).innerText.includes('229'),
      );
    });
  }

  async proceedToPaymentForm(): Promise<void> {
    await test.step('Select shipping method and wait for payment form to mount', async () => {
      // After address confirmation the app shows a "Select Shipping Method" step.
      // Ground ($5.00) is pre-selected; click "Add Shipping Method" to proceed.
      await this.locators.addShippingMethodButton.locator
        .waitFor({ state: 'visible', timeout: 20_000 }).catch(() => undefined);
      if (await this.verify.isElementVisible(this.locators.addShippingMethodButton).catch(() => false)) {
        await this.actions.click(this.locators.addShippingMethodButton);
      }
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    });
  }
  async fillPaymentDetails(payment: PaymentDetails): Promise<void> {
    await test.step('Fill card details (Stripe/Adyen secured fields)', async () => {
      // Keep billing = shipping BEFORE typing card numbers so form changes don't wipe the iframe
      const billingCheckbox = this.locators.billingSameAsShippingCheckbox.locator;
      if (await billingCheckbox.isVisible().catch(() => false)) {
        const isChecked = await billingCheckbox.isChecked().catch(() => true);
        if (!isChecked) {
          await billingCheckbox.check().catch(() => undefined);
        }
      }

      const cardSelectors =
        'input[data-fieldtype*="CardNumber" i], input[name*="card" i], input[autocomplete="cc-number"], input[data-elements-stable-field-name="cardNumber"], input[placeholder*="Card" i], input[aria-label*="card" i], input[name*="encryptedCardNumber" i]';
      const expSelectors =
        'input[data-fieldtype*="Expiry" i], input[name*="exp" i], input[autocomplete="cc-exp"], input[data-elements-stable-field-name="cardExpiry"], input[placeholder*="Expir" i], input[placeholder*="MM" i], input[aria-label*="expir" i], input[aria-label*="Expiration" i], input[name*="encryptedExpiry" i]';
      const cvcSelectors =
        'input[data-fieldtype*="Security" i], input[name*="cv" i], input[name*="sec" i], input[name*="csc" i], input[autocomplete="cc-csc"], input[data-elements-stable-field-name="cardCvc"], input[placeholder*="Security" i], input[placeholder*="CVC" i], input[placeholder*="CVV" i], input[aria-label*="security" i], input[aria-label*="CVC" i], input[name*="encryptedSecurity" i]';

      const sanitizedCardNumber = payment.cardNumber.replace(/\D/g, '');
      const sanitizedExpiry = payment.expiry.replace(/\D/g, '');
      const sanitizedCvv = payment.cvv.replace(/\D/g, '');

      const findField = async (selectors: string): Promise<Locator | null> => {
        const allContexts = [this.page, ...this.page.frames()];
        for (const ctx of allContexts) {
          try {
            const matches = await ctx.locator(selectors).all();
            for (const input of matches) {
              if (await input.isVisible().catch(() => false)) {
                return input;
              }
            }
          } catch {}
        }

        try {
          const iframes = await this.page.locator('iframe').all();
          for (let i = 0; i < iframes.length; i++) {
            const frameInput = this.page.frameLocator(`iframe >> nth=${i}`).locator(selectors).first();
            if (await frameInput.isVisible().catch(() => false)) {
              return frameInput;
            }
          }
        } catch {}

        return null;
      };

      // 1. Wait until all three fields mount
      await expect
        .poll(
          async () => {
            const num = await findField(cardSelectors);
            const exp = await findField(expSelectors);
            const cvc = await findField(cvcSelectors);
            return num !== null && exp !== null && cvc !== null;
          },
          { timeout: 75_000, intervals: [1_000, 2_000], message: 'Card fields (number, expiry, cvc) never fully mounted' },
        )
        .toBeTruthy();

      const fillInput = async (input: Locator, value: string, alternateVal?: string) => {
        await input.scrollIntoViewIfNeeded().catch(() => undefined);
        await input.click({ force: true }).catch(() => undefined);
        await input.focus().catch(() => undefined);
        await input.pressSequentially(value, { delay: 60 }).catch(() => undefined);

        const currentVal = await input.inputValue().catch(() => '');
        if (!currentVal && alternateVal) {
          await input.focus().catch(() => undefined);
          await input.pressSequentially(alternateVal, { delay: 60 }).catch(() => undefined);
        }
      };

      // 2. Fill each field once in sequence
      const cardInput = await findField(cardSelectors);
      if (cardInput) await fillInput(cardInput, sanitizedCardNumber);

      const expInput = await findField(expSelectors);
      if (expInput) await fillInput(expInput, payment.expiry);

      const cvcInput = await findField(cvcSelectors);
      if (cvcInput) await fillInput(cvcInput, sanitizedCvv);

      // 3. Postal if present (Stripe)
      const zipSelectors = 'input[name="postal"], input[autocomplete="postal-code"], input[placeholder*="ZIP" i]';
      const zipInput = await findField(zipSelectors);
      if (zipInput) await fillInput(zipInput, '10001');

      // 4. Blur payment iframe to trigger form validation
      await this.page.locator('text=/Pay with Credit Card|Shipping Address/i').first().click().catch(() => undefined);
      await this.verify.waitForVisibility(this.locators.buyNowButton);
      await expect(this.locators.buyNowButton.locator).toBeEnabled({ timeout: 30_000 });
    });
  }

  async completePurchase(alternatePayment?: PaymentDetails): Promise<void> {
    await test.step('Click BUY NOW and ensure order submission', async () => {
      await this.verify.waitForVisibility(this.locators.buyNowButton);
      await expect(this.locators.buyNowButton.locator).toBeEnabled({ timeout: 30_000 });
      await this.actions.click(this.locators.buyNowButton);
      await this.page.waitForLoadState('load').catch(() => undefined);

      // Check if payment was declined or rate-limited by the staging test gateway
      const declineAlert = this.page.locator("//*[contains(normalize-space(),'Payment was not approved') or contains(normalize-space(),'Payment failed')]").first();
      const isDeclined = await declineAlert.waitFor({ state: 'visible', timeout: 6000 }).then(() => true).catch(() => false);

      if (isDeclined) {
        console.log('[Checkout] Primary test card declined. Falling back to secondary card (3700 0000 0000 002, 03/30, 7373)...');
        const alt = alternatePayment || {
          cardNumber: process.env.SECONDARY_CARD_NUMBER || '370000000000002',
          expiry: process.env.SECONDARY_CARD_EXP || '03/30',
          cvv: process.env.SECONDARY_CARD_CVV || '7373',
        };
        await this.fillPaymentDetails(alt);
        await this.actions.click(this.locators.buyNowButton);
        await this.page.waitForLoadState('load').catch(() => undefined);
      }
    });
  }

  // ── Public composite API ─────────────────────────────────────────────────

  async completeCheckout(shipping: ShippingDetails): Promise<void> {
    await test.step('Complete checkout flow', async () => {
      await test.step('Product intro → order summary → Checkout', async () => {
        await this.advanceToOrderSummary();
        // Only click Checkout if the button is visible (carousel flow); if the app
        // skipped directly to shipping, the button won't exist.
        if (await this.verify.isElementVisible(this.locators.checkoutButton).catch(() => false)) {
          await this.actions.click(this.locators.checkoutButton);
        }
      });

      await test.step('Fill shipping and confirm delivery address', async () => {
        await this.fillShippingForm(shipping);
      });
    });
  }

  async verifyCheckoutComplete(): Promise<void> {
    await test.step('Verify checkout reached confirmation or account page', async () => {
      await this.page.waitForLoadState('load').catch(() => undefined);
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
      await this.verify.waitForProcessingLoaderToDisappear().catch(() => undefined);
      await this.actions.waitForURL(/\/checkout\/confirmation|\/account|\/order-confirmation|\/confirmation/);
    });
  }

  /**
   * Full checkout journey: product carousel → order summary → shipping → payment form →
   * pay → confirmation page. Card entry handles whichever provider (Stripe/Adyen) mounts.
   */
  async completeCheckoutAndPay(shipping: ShippingDetails, payment: PaymentDetails): Promise<void> {
    await test.step('Complete checkout and pay', async () => {
      await this.completeCheckout(shipping);
      await this.proceedToPaymentForm();
      await this.fillPaymentDetails(payment);
      await this.completePurchase();
      await this.verifyCheckoutComplete();
    });
  }

  /**
   * Capture pre-checkout baseline snapshot and complete payment.
   */
  async completeCheckoutWithVisual(
    visualConfig: ApplitoolsVisualConfig | undefined,
    shipping: ShippingDetails,
    payment: PaymentDetails,
    tag: string = 'Checkout page',
  ): Promise<void> {
    await this.captureCheckoutSnapshot(visualConfig, tag);
    await this.completeCheckoutAndPay(shipping, payment);
  }

  /**
   * Capture pre-checkout baseline, pay, and capture post-checkout profile baseline.
   */
  async completeCheckoutAndProfile(
    visualConfig: ApplitoolsVisualConfig | undefined,
    details: { shipping: ShippingDetails; payment: PaymentDetails },
    productPage: any,
    checkoutTag: string = 'Checkout page',
    profileTag: string = 'Profile page loaded',
  ): Promise<void> {
    await this.completeCheckoutWithVisual(visualConfig, details.shipping, details.payment, checkoutTag);
    await productPage.capturePostCheckoutProfileSnapshot(undefined, profileTag);
  }

  /**
   * Capture pre-checkout baseline, pay, and capture post-checkout profile baseline.
   */
  async completeCheckoutAndConfirmation(
    visualConfig: ApplitoolsVisualConfig | undefined,
    details: { shipping: ShippingDetails; payment: PaymentDetails },
    productPage: any,
    tag: string = 'Checkout page',
  ): Promise<void> {
    await this.completeCheckoutAndProfile(visualConfig, details, productPage, tag, 'Profile page loaded');
  }
}
