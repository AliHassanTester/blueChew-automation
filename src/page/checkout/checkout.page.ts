import { Page, TestInfo, test, expect, Locator } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { ShippingDetails, PaymentDetails } from '@interfaces/signup-to-approved-order.interface';

/**
 * Checkout wizard (/checkout): product intro → Select strength → Select quantity → order
 * summary (Checkout) → shipping address (PROCEED TO PAYMENT) → "Confirm your delivery
 * address" modal → Stripe payment (BUY NOW). Each wizard step advances with a
 * `ds-button--primary` CONTINUE; shipping fields expose stable `formcontrolname`s.
 * Payment is a Stripe Payment Element in cross-origin iframes — card entry scans the
 * frames for the secure inputs (by name/autocomplete), and BUY NOW enables once valid.
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
      // ── Wizard step headings ───────────────────────────────────────────────
      strengthHeading: {
        description: 'Select Strength Step Heading',
        locator: this.page.locator("//h1[normalize-space()='Select strength'] | //h2[normalize-space()='Select strength']"),
      },
      quantityHeading: {
        description: 'Select Quantity Step Heading',
        locator: this.page.locator("//h1[normalize-space()='Select quantity'] | //h2[normalize-space()='Select quantity']"),
      },
      checkoutButton: {
        description: 'Order Summary → Checkout Button',
        locator: this.page.locator("//button[normalize-space()='Checkout']"),
      },

      // ── Shipping address form ──────────────────────────────────────────────
      shippingLine1: {
        description: 'Shipping Address Line 1 Input',
        locator: this.page.locator("//input[@formcontrolname='line_1']"),
      },
      shippingLine2: {
        description: 'Shipping Address Line 2 (Apt/Suite) Input',
        locator: this.page.locator("//input[@formcontrolname='line_2']"),
      },
      shippingCity: {
        description: 'Shipping City Input',
        locator: this.page.locator("//input[@formcontrolname='city']"),
      },
      shippingState: {
        description: 'Shipping State Dropdown',
        locator: this.page.locator("//select[@formcontrolname='state']"),
      },
      shippingZip: {
        description: 'Shipping ZIP Input',
        locator: this.page.locator("//input[@formcontrolname='zip']"),
      },
      shippingPhone: {
        description: 'Shipping Phone Input',
        locator: this.page.locator("//input[@formcontrolname='phone']"),
      },
      proceedToPaymentButton: {
        description: 'PROCEED TO PAYMENT Button',
        locator: this.page.locator("//button[normalize-space()='PROCEED TO PAYMENT']"),
      },
      addressConfirmButton: {
        description: 'Confirm Delivery Address Modal — CONFIRM Button',
        locator: this.page.locator("//button[contains(@class,'popup-sheet-action-confirm')]"),
      },

      // ── Payment (Stripe) ───────────────────────────────────────────────────
      billingSameAsShippingCheckbox: {
        description: 'Use Shipping Address for Billing Checkbox',
        locator: this.page.locator("//input[@type='checkbox']").first(),
      },
      buyNowButton: {
        description: 'BUY NOW / Place Order Button',
        locator: this.page.locator("//button[normalize-space()='BUY NOW']"),
      },
    };
  }

  // ── Wizard steps ──────────────────────────────────────────────────────────

  /** Clicks the active step's CONTINUE (only the current step's is visible + enabled). */
  private async clickActiveContinue(): Promise<void> {
    await this.actions.clickFirstActionable("//button[normalize-space()='CONTINUE']");
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

    // "Confirm your delivery address" modal — appears when the address is not an exact
    // USPS match (as with the automation test address). Click CONFIRM to accept it.
    await this.locators.addressConfirmButton.locator
      .waitFor({ state: 'visible', timeout: 10_000 }).catch(() => undefined);
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
    await test.step('Wait for the Stripe payment form to mount', async () => {
      // After the address is confirmed the flow lands on the payment page; BUY NOW
      // renders once the Stripe Payment Element has mounted.
      await this.verify.waitForVisibility(this.locators.buyNowButton);
    });
  }

  // ── Payment form (Stripe Payment Element, in cross-origin iframes) ─────────

  /** Scans every frame for the first visible input matching one of `selectors`. */
  private async findFrameInput(selectors: string[]): Promise<Locator | null> {
    for (const frame of this.page.frames()) {
      for (const sel of selectors) {
        const loc = frame.locator(sel).first();
        if (await loc.isVisible().catch(() => false)) return loc;
      }
    }
    return null;
  }

  async fillPaymentDetails(payment: PaymentDetails): Promise<void> {
    await test.step('Fill Stripe card details', async () => {
      // The card fields mount progressively inside cross-origin Stripe iframes. Poll the
      // frames until the card-number field appears — Stripe secure inputs are matched by
      // name or autocomplete (cc-number/cc-exp/cc-csc) to stay robust across variants.
      let cardInput: Locator | null = null;
      await expect
        .poll(async () => {
          cardInput = await this.findFrameInput(['input[name="number"]', 'input[autocomplete="cc-number"]', 'input[name="cardnumber"]']);
          return cardInput !== null;
        }, { timeout: 30_000, message: 'Stripe card-number field never mounted in any frame' })
        .toBeTruthy();

      await cardInput!.click();
      await cardInput!.pressSequentially(payment.cardNumber, { delay: 30 });

      const expiryInput = await this.findFrameInput(['input[name="expiry"]', 'input[autocomplete="cc-exp"]', 'input[name="exp-date"]']);
      if (expiryInput) {
        await expiryInput.click();
        await expiryInput.pressSequentially(payment.expiry, { delay: 30 });
      }

      const cvcInput = await this.findFrameInput(['input[name="cvc"]', 'input[autocomplete="cc-csc"]', 'input[name="cvv"]']);
      if (cvcInput) {
        await cvcInput.click();
        await cvcInput.pressSequentially(payment.cvv, { delay: 30 });
      }

      // Keep billing = shipping when the "Use shipping address for billing" checkbox is present.
      if (await this.verify.isElementVisible(this.locators.billingSameAsShippingCheckbox).catch(() => false)) {
        await this.locators.billingSameAsShippingCheckbox.locator.check().catch(() => undefined);
      }
    });
  }

  async completePurchase(): Promise<void> {
    await test.step('Click BUY NOW', async () => {
      // clickFirstActionable auto-waits for BUY NOW to be visible AND enabled (it stays
      // disabled until the card details are valid).
      await this.actions.clickFirstActionable("//button[normalize-space()='BUY NOW']");
    });
  }

  // ── Public composite API ─────────────────────────────────────────────────

  async completeCheckout(shipping: ShippingDetails): Promise<void> {
    await test.step('Complete checkout flow', async () => {
      await test.step('Product intro → Select strength', async () => {
        // Checkout may open on a product-match intro before the strength step — advance
        // past it only if the strength heading is not already showing.
        if (!(await this.verify.isElementVisible(this.locators.strengthHeading).catch(() => false))) {
          await this.clickActiveContinue();
        }
        await this.verify.waitForVisibility(this.locators.strengthHeading);
      });

      await test.step('Select strength (High Strength — default) → quantity', async () => {
        await this.clickActiveContinue();
        await this.verify.waitForVisibility(this.locators.quantityHeading);
      });

      await test.step('Select quantity (12 uses/month — default) → order summary', async () => {
        await this.clickActiveContinue();
        await this.actions.click(this.locators.checkoutButton);
      });

      await test.step('Fill shipping and confirm delivery address', async () => {
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
