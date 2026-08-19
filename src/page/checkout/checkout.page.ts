import { Page, TestInfo, test, expect, Locator } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { ShippingDetails, PaymentDetails } from '@interfaces/signup-to-approved-order.interface';
import { captureApplitoolsVisualCheckpoint } from '@utilities/applitools.utils';
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
        locator: this.page.locator('//button[@data-test-id="address-form-submit"]'),
      },
      addressConfirmButton: {
        description: 'Confirm Delivery Address Modal — Confirm Button',
        locator: this.page.locator("//button[normalize-space()='Confirm']").filter({ visible: true }).first(),
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
      } else if (visualConfig) {
        await captureApplitoolsVisualCheckpoint(this.page, visualConfig, tag);
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
        .waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined);
      if (await this.verify.isElementVisible(this.locators.addShippingMethodButton).catch(() => false)) {
        await this.actions.click(this.locators.addShippingMethodButton);
      }
    });
  }

  // ── Payment form (Adyen secured fields, in cross-origin iframes) ───────────

  /**
   * Finds a payment secured-field textbox by its accessible label across all frames.
   * Stripe/Adyen render each field (card number / expiry / security code) in its own
   * cross-origin iframe; matching by role + accessible name targets the real input and ignores
   * the hidden browser-autocomplete decoy inputs that share name/autocomplete attributes.
   */
  private async findFrameField(name: RegExp): Promise<Locator | null> {
    for (const frame of this.page.frames()) {
      const field = frame.getByRole('textbox', { name }).first();
      if (await field.isVisible().catch(() => false)) return field;
    }
    return null;
  }

  // The checkout renders either a Stripe or an Adyen card form per session; their field
  // labels differ ("Expiration date MM / YY" vs "Expiry date"), so match both.
  private readonly expiryField = /expir/i;
  private readonly cvcField = /security code|cvc|cvv/i;

  /** Focuses the secured field (re-found fresh) and types the value into it. */
  private async typeIntoFrameField(name: RegExp, value: string): Promise<void> {
    const field = await this.findFrameField(name);
    if (!field) return;
    await field.focus().catch(() => undefined);
    try {
      await field.pressSequentially(value, { delay: 50 });
    } catch {
      await field.click({ force: true }).catch(() => undefined);
      await field.pressSequentially(value, { delay: 50 });
    }
  }

  async fillPaymentDetails(payment: PaymentDetails): Promise<void> {
    await test.step('Fill card details (Stripe/Adyen secured fields)', async () => {
      // Wait until ALL three Adyen fields have mounted before typing — filling while the
      // form is still rendering drops the leading characters and leaves the field incomplete
      // (BUY NOW then stays disabled). Each field is re-found fresh right before typing.
      await expect
        .poll(
          async () =>
            (await this.findFrameField(/card number/i)) !== null &&
            (await this.findFrameField(this.expiryField)) !== null &&
            (await this.findFrameField(this.cvcField)) !== null,
          { timeout: 60_000, message: 'Card fields never fully mounted' },
        )
        .toBeTruthy();

      await this.typeIntoFrameField(/card number/i, payment.cardNumber);
      await this.typeIntoFrameField(this.expiryField, payment.expiry);
      await this.typeIntoFrameField(this.cvcField, payment.cvv);

      // Keep billing = shipping when the "Use shipping address for billing" checkbox is present.
      if (await this.verify.isElementVisible(this.locators.billingSameAsShippingCheckbox).catch(() => false)) {
        await this.locators.billingSameAsShippingCheckbox.locator.check().catch(() => undefined);
        // After the shipping method is confirmed the flow lands on the payment page;
        // BUY NOW renders once the payment form has mounted.
        await this.verify.waitForVisibility(this.locators.buyNowButton);
      }
    });
  }

  async completePurchase(): Promise<void> {
    await test.step('Click BUY NOW', async () => {
      await this.actions.click(this.locators.buyNowButton);
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
    await test.step('Verify checkout reached confirmation page', async () => {
      await this.page.waitForLoadState('load');
      await this.verify.waitForLoaderToDisappear();
      await this.verify.waitForProcessingLoaderToDisappear();
      await this.actions.waitForURL(/\/checkout\/confirmation/);
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
}
