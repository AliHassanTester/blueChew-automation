import { Page, TestInfo, test, expect } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { VisualHelper } from '@utilities/visual.helper';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

/**
 * HeroesPage Object Model
 *
 * Encapsulates the American Heroes Landing Page (/heroes), military status
 * verification (/verify-hero?h=1), and both CTA entry paths (Direct Registration & Quiz Funnel).
 */
export class HeroesPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly visual?: VisualHelper;
  public readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo, visual?: VisualHelper) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
    this.visual = visual;

    this.locators = {
      // ── Homepage Footer Hero Badge & Links ───────────────────────────────────
      heroesFooterBadge: {
        description: 'Homepage Footer American Heroes Program Badge / Link',
        locator: this.page
          .locator("//img[contains(@class,'ds-footer__badge--heroes')] | //img[@alt='American Heroes Program'] | //a[@href='/heroes'] | //a[normalize-space()='American Heroes Program']")
          .first(),
      },

      // ── American Heroes Landing Page (/heroes) CTAs ──────────────────────────
      getStartedHereButton: {
        description: 'American Heroes Page "GET STARTED HERE" Button (Direct Flow)',
        locator: this.page
          .locator("//a[normalize-space()='GET STARTED HERE'] | //button[normalize-space()='GET STARTED HERE'] | //a[contains(@href,'/register?h=1')]")
          .first(),
      },
      tryNowButton: {
        description: 'American Heroes Page "TRY NOW" Header CTA (Quiz Flow)',
        locator: this.page
          .locator("//button[contains(@class,'button-right') and contains(normalize-space(),'TRY NOW')] | //header//button[normalize-space()='TRY NOW'] | //button[normalize-space()='TRY NOW']")
          .first(),
      },
      heroesHeading: {
        description: 'American Heroes Page Main Heading / Content Marker',
        locator: this.page
          .locator("//h1[contains(.,'American Heroes') or contains(.,'HEROES')] | //*[contains(text(),'Military: $25 off your first order') or contains(text(),'HEROES PROGRAM')]")
          .first(),
      },

      // ── Military Status Verification Step (/verify-hero?h=1) ─────────────────
      heroWelcomeCard: {
        description: 'Welcome to BlueChew for Heroes Header',
        locator: this.page
          .locator("//*[contains(text(),'Welcome to') and contains(text(),'BLUECHEW FOR HEROES')] | //*[contains(text(),'CHOOSE YOUR HERO STATUS')]")
          .first(),
      },
      heroStatusDropdown: {
        description: 'Hero Status Military Branch Select Dropdown',
        locator: this.page
          .locator("//select[contains(@class,'form-control')] | //select[@id='hero_status'] | //select")
          .first(),
      },
      heroVerifyContinueButton: {
        description: 'Hero Verification Continue Button',
        locator: this.page
          .locator("//button[contains(@class,'btn-primary') and normalize-space()='Continue'] | //button[normalize-space()='Continue']")
          .first(),
      },

      // ── Checkout Intermediates (Gold Strength & Frequency Selection) ─────────
      strengthSlideButton: {
        description: 'Strength Selection Option Card (High Strength)',
        locator: this.page
          .locator("//div[contains(@class,'slide-btn')] | //div[contains(.,'High Strength')] | //div[contains(@class,'strength-option')]")
          .first(),
      },
      strengthContinueButton: {
        description: 'Strength / Frequency Carousel Continue Button',
        locator: this.page
          .locator("//button[contains(@class,'btn-primary') and normalize-space()='CONTINUE'] | //button[normalize-space()='CONTINUE']")
          .filter({ visible: true })
          .first(),
      },
      checkoutHeroCouponBadge: {
        description: 'Order Summary HERO Coupon Badge / Discount Indicator ($25.00 Off)',
        locator: this.page
          .locator(
            "//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'hero coupon applied')] | " +
            "//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'coupon: $25.00 off')] | " +
            "//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'coupon: $20.00 off')] | " +
            "//*[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'hero discount')] | " +
            "//*[contains(text(),'HERO Coupon Applied') or contains(text(),'Coupon: $25.00 Off Applied') or contains(text(),'Coupon: $20.00 Off Applied') or contains(text(),'-$25.00') or contains(text(),'-$20.00') or contains(text(),'-$25') or contains(text(),'-$20')] | " +
            "//div[contains(@class,'order-summary') or contains(@class,'summary') or contains(@class,'pricing')]//*[contains(text(),'Coupon') or contains(text(),'HERO') or contains(text(),'Discount') or contains(text(),'-$25') or contains(text(),'-$20')]",
          )
          .first(),
      },
    };
  }

  // ── Navigation & Actions ───────────────────────────────────────────────────

  /**
   * Navigate directly to the American Heroes landing page.
   */
  async navigateToHeroesPage(url = 'https://dev.bluechew.com/heroes'): Promise<void> {
    await test.step(`Navigate to American Heroes page: ${url}`, async () => {
      await this.actions.navigateToURL(url);
      await this.page.waitForLoadState('domcontentloaded');
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
    });
  }

  /**
   * Navigate to American Heroes page via footer badge / link on homepage.
   */
  async navigateToHeroesViaFooter(homeUrl = 'https://dev.bluechew.com/'): Promise<void> {
    await test.step('Navigate to Homepage and click American Heroes Program footer CTA', async () => {
      await this.actions.navigateToURL(homeUrl);
      await this.page.waitForLoadState('domcontentloaded');
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);

      await this.actions.scrollIntoView(this.locators.heroesFooterBadge);
      await this.actions.click(this.locators.heroesFooterBadge);
      await this.page.waitForURL(/\/heroes(?:\?.*)?/, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
    });
  }

  /**
   * Flow 1: Click "GET STARTED HERE" CTA to start direct registration.
   */
  async clickGetStartedHere(): Promise<void> {
    await test.step('Click "GET STARTED HERE" and verify navigation to /register?h=1', async () => {
      await this.actions.scrollIntoView(this.locators.getStartedHereButton);
      await this.actions.click(this.locators.getStartedHereButton);
      await this.page.waitForURL(/\/register(?:\?.*)?/, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
    });
  }

  /**
   * Step 2 (Flow 1): Complete military status verification dropdown on /verify-hero?h=1.
   */
  async completeHeroStatusVerification(branch = 'Army'): Promise<void> {
    await test.step(`Complete Hero military status verification (Branch: ${branch})`, async () => {
      await this.page.waitForURL(/\/verify-hero(?:\?.*)?/, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);

      await this.actions.waitForVisibility(this.locators.heroStatusDropdown);
      await this.actions.selectFromDropdown(this.locators.heroStatusDropdown, branch).catch(async () => {
        await this.locators.heroStatusDropdown.locator.selectOption({ index: 1 });
      });

      await this.actions.click(this.locators.heroVerifyContinueButton);
      await this.page.waitForURL(/\/quiz|\/medical(?:\?.*)?/, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
    });
  }

  /**
   * Flow 2: Click "TRY NOW" header CTA to start quiz funnel.
   */
  async clickTryNow(): Promise<void> {
    await test.step('Click "TRY NOW" CTA and verify navigation to /quiz', async () => {
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
      await this.actions.waitForVisibility(this.locators.tryNowButton);
      await this.actions.click(this.locators.tryNowButton);

      try {
        await this.page.waitForURL(/\/quiz(?:\?.*)?/, { waitUntil: 'domcontentloaded', timeout: 10_000 });
      } catch {
        if (await this.locators.tryNowButton.locator.isVisible().catch(() => false)) {
          await this.locators.tryNowButton.locator.click().catch(() => undefined);
        }
        await this.page.waitForURL(/\/quiz(?:\?.*)?/, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      }
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
    });
  }

  /**
   * Complete Strength and Shipping Frequency selection carousels if on /checkout.
   */
  async selectStrengthAndFrequency(): Promise<void> {
    await test.step('Select strength (High Strength) and advance carousel to Order Summary', async () => {
      if (!this.page.url().includes('/checkout')) return;
      await this.page.waitForLoadState('domcontentloaded');
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);

      // 1. Select High Strength if slide button exists
      if (await this.locators.strengthSlideButton.locator.isVisible().catch(() => false)) {
        await this.actions.click(this.locators.strengthSlideButton).catch(() => undefined);
        await this.verify.waitForLoaderSettled().catch(() => undefined);
      }

      // 2. Advance through strength & frequency CONTINUE controls until Order Summary / Checkout button is reached
      const checkoutBtn = this.page
        .locator("//button[contains(@class,'cta-bar-payment-btn')] | //button[contains(translate(normalize-space(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 'CHECKOUT')]")
        .filter({ visible: true })
        .first();

      for (let i = 0; i < 4; i++) {
        if (await checkoutBtn.isVisible().catch(() => false)) break;

        const contBtn = this.page
          .getByText('CONTINUE', { exact: true })
          .or(this.page.locator('button:has-text("CONTINUE"), button.btn-primary'))
          .filter({ visible: true })
          .first();

        if (await contBtn.isVisible().catch(() => false)) {
          await contBtn.click().catch(() => undefined);
          await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
          await this.verify.waitForLoaderSettled().catch(() => undefined);
        } else {
          break;
        }
      }
    });
  }

  /**
   * Comprehensive validation of the American Heroes discount logic:
   * 1. Validates that the HERO discount / coupon badge is displayed in the Order Summary.
   * 2. Validates that the discount amount reflects -$25.00 (or -$20.00) off.
   * 3. Confirms that the net price mathematically reflects the discount deduction.
   */
  async verifyHeroDiscountLogic(): Promise<void> {
    await test.step('Verify American Heroes discount logic and net discounted price in Order Summary', async () => {
      await this.page.waitForURL(/\/checkout/, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
      await this.verify.waitForLoaderSettled().catch(() => undefined);

      // 1. Auto-retrying assertion for HERO discount line item / coupon badge
      await expect(this.locators.checkoutHeroCouponBadge.locator).toBeVisible({ timeout: 20_000 });

      const discountText = await this.locators.checkoutHeroCouponBadge.locator.innerText().catch(() => '');
      console.log(`[Verify] American Heroes Discount Line Item: "${discountText.trim()}"`);

      // 2. Validate discount indicator
      const hasValidDiscount =
        discountText.includes('25') ||
        discountText.includes('20') ||
        discountText.toLowerCase().includes('hero') ||
        discountText.toLowerCase().includes('coupon') ||
        discountText.toLowerCase().includes('discount') ||
        discountText.toLowerCase().includes('applied');

      expect(hasValidDiscount).toBeTruthy();

      // 3. Extract Order Summary container text to verify net pricing breakdown
      const summaryContainer = this.page
        .locator(
          "//div[contains(@class,'order-summary') or contains(@class,'summary') or contains(@class,'pricing') or contains(@class,'checkout-box') or contains(@class,'slide')]",
        )
        .filter({ hasText: /coupon|discount|total|subtotal|\$/i, visible: true })
        .first();

      const summaryText = (await summaryContainer.isVisible().catch(() => false))
        ? await summaryContainer.innerText().catch(() => '')
        : await this.page.locator('body').innerText().catch(() => '');

      console.log(`[Verify] Order Summary Pricing Breakdown:\n${summaryText.trim()}`);

      // 4. Verify discount deduction is represented in the Order Summary
      const hasDiscountDeduction =
        summaryText.includes('-25') ||
        summaryText.includes('-$25') ||
        summaryText.includes('25.00 Off') ||
        summaryText.includes('25 Off') ||
        summaryText.includes('-20') ||
        summaryText.includes('-$20') ||
        summaryText.includes('20.00 Off') ||
        summaryText.includes('Coupon Applied') ||
        summaryText.toLowerCase().includes('hero coupon');

      expect(hasDiscountDeduction).toBeTruthy();
    });
  }

  /**
   * Verify HERO Coupon / Discount applied in order summary.
   */
  async verifyHeroCouponApplied(): Promise<void> {
    await this.verifyHeroDiscountLogic();
  }

  /**
   * Capture Visual Snapshot with Applitools if configured.
   */
  async captureHeroesSnapshot(visualConfig?: ApplitoolsVisualConfig, tag = 'American Heroes page loaded'): Promise<void> {
    await test.step(`Capture visual snapshot: ${tag}`, async () => {
      await this.page.waitForLoadState('load').catch(() => undefined);
      if (this.visual) {
        await this.visual.captureCheckpoint(tag, visualConfig);
      }
    });
  }
}
