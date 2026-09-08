import { Page, TestInfo, test, expect } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { VisualHelper } from '@utilities/visual.helper';

export class LandingMaxPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly visual: VisualHelper;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo, visual: VisualHelper) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
    this.visual = visual;

    this.locators = {
      tryNowBtn: {
        description: 'try now button',
        locator: this.page
          .locator("//button[normalize-space()='TRY NOW']")
          .or(this.page.locator("//button[text()=' TRY NOW ']"))
          .or(this.page.locator("button:has-text('TRY NOW')"))
          .first(),
      },
      heroSectionGetStartedBtn: {
        description: 'get started button in hero section',
        locator: this.page
          .locator('//section[@class="hero-section"]//button[normalize-space()="GET STARTED"]')
          .or(this.page.locator('section.hero-section button:has-text("GET STARTED")'))
          .first(),
      },
      maxLogo: {
        description: 'MAX Logo',
        locator: this.page
          .locator('//img[@alt="MAX Logo"]')
          .or(this.page.getByAltText('MAX Logo'))
          .first(),
      },
      formulaSectionStartBtn: {
        description: 'start here button in formula section',
        locator: this.page
          .locator('//button[normalize-space()="START NOW" and @class="formula-button"]')
          .or(this.page.locator('button.formula-button:has-text("START NOW")'))
          .first(),
      },
      readSafteyInfoBtn: {
        description: 'read safety information',
        locator: this.page
          .locator('//button[normalize-space()="Read safety information"]')
          .or(this.page.locator('button:has-text("Read safety information")'))
          .first(),
      },
      startNowBtn: {
        description: 'start now button in formula section',
        locator: this.page
          .locator('//button[@class="start-now-btn"]')
          .or(this.page.locator('button.start-now-btn'))
          .first(),
      },
      topGetStartedBtn: {
        description: 'top nav get started button',
        locator: this.page
          .locator('//button[@class="btn-get-started top-cta"]')
          .or(this.page.locator('button.btn-get-started.top-cta'))
          .first(),
      },
      bottomGetStartedBtn: {
        description: 'bottom nav get started button',
        locator: this.page
          .locator('//button[@class="btn-bottom"]')
          .or(this.page.locator('button.btn-bottom'))
          .first(),
      },
      showAllBtn: {
        description: 'show all button',
        locator: this.page
          .locator('//button[normalize-space()="SHOW ALL"]')
          .or(this.page.locator('button:has-text("SHOW ALL")'))
          .first(),
      },
      faqQuestion: {
        description: 'FAQ questions',
        locator: this.page
          .locator('//span[contains(normalize-space(), "How does BlueChew MAX work?")]')
          .or(this.page.locator('span:has-text("How does BlueChew MAX work?")'))
          .first(),
      },
      faqAnswer: {
        description: 'FAQ answers',
        locator: this.page
          .locator("//p[contains(text(), 'This combination medication')]")
          .or(this.page.locator("p:has-text('This combination medication')"))
          .first(),
      },
      destinationPageHeader: {
        description: 'destination page header',
        locator: this.page
          .getByText('Choose a Plan', { exact: true })
          .or(this.page.locator('//p[text()="Choose a Plan"]'))
          .or(this.page.locator('plan-header p'))
          .or(this.page.locator('.product-plan-modal p'))
          .first(),
      },
      safetyPageHeader: {
        description: 'Important Safety Information header',
        locator: this.page
          .locator("//h1[normalize-space()='IMPORTANT SAFETY INFORMATION']")
          .or(this.page.locator("//h1[text()='IMPORTANT SAFETY INFORMATION']"))
          .first(),
      },
      backBtn: {
        description: 'back button',
        locator: this.page
          .locator('//img[@alt="back icon"]')
          .or(this.page.locator('button:has(img[alt="back icon"])'))
          .or(this.page.locator('button:has-text("Back"), .back-btn, [aria-label*="back"]'))
          .first(),
      },
    };
  }

  /**
   * Navigate to the Landing Max page and verify URL and MAX Logo visibility.
   */
  async navigateToLandingMax(url: string): Promise<void> {
    await test.step(`Navigate to MAX landing page: ${url}`, async () => {
      await this.actions.navigateToURL(url);
      await this.page.waitForLoadState('load');
      await this.verify.verifyUserHasAccess(url, true);
      await this.verify.expectElementExist(this.locators.maxLogo);
    });
  }

  /**
   * Verify the MAX Landing page is rendered by asserting the MAX logo.
   */
  async verifyLandingPageLoaded(): Promise<void> {
    await test.step('Verify MAX Landing Page loaded', async () => {
      await this.verify.expectElementExist(this.locators.maxLogo);
    });
  }

  /**
   * Click a specific CTA button, assert navigation to /plan and Choose a Plan header,
   * then click back to return to the landing page.
   */
  async verifyCtaButtonNavigation(ctaInfo: LocatorInfo): Promise<void> {
    await test.step(`Verify CTA button "${ctaInfo.description}" navigates to /max/plan and returns`, async () => {
      // Check if button is rendered/visible in current viewport (e.g. desktop top-nav is hidden on mobile)
      const isVisible = await ctaInfo.locator.isVisible().catch(() => false);
      if (!isVisible) {
        console.log(`[Action] "${ctaInfo.description}" is not visible in current viewport — skipping`);
        return;
      }

      await this.actions.scrollIntoView(ctaInfo);
      await this.actions.click(ctaInfo);
      await this.page.waitForLoadState('load');
      await this.verify.expectElementExist(this.locators.destinationPageHeader);

      // Return back to landing page
      const backButton = this.locators.backBtn;
      if (await backButton.locator.isVisible().catch(() => false)) {
        await this.actions.click(backButton);
      } else {
        await this.page.goBack();
      }
      await this.page.waitForLoadState('load');
      await this.verify.expectElementExist(this.locators.maxLogo);
    });
  }

  /**
   * Iterate and test all CTA buttons leading to the Plan selection page.
   */
  async verifyAllCtaButtons(): Promise<void> {
    await test.step('Verify all CTA buttons on MAX Landing Page', async () => {
      const ctaButtons = [
        this.locators.tryNowBtn,
        this.locators.heroSectionGetStartedBtn,
        this.locators.formulaSectionStartBtn,
        this.locators.startNowBtn,
        this.locators.topGetStartedBtn,
        this.locators.bottomGetStartedBtn,
      ];

      for (const cta of ctaButtons) {
        await this.verifyCtaButtonNavigation(cta);
      }
    });
  }

  /**
   * Click the Read Safety Information button, handle the new tab,
   * assert that the /safety-info page and IMPORTANT SAFETY INFORMATION header are loaded,
   * and then close the tab.
   */
  async verifySafetyInformation(): Promise<void> {
    await test.step('Verify Read Safety Information opens /safety-info in new tab, assert header and close', async () => {
      await this.actions.scrollIntoView(this.locators.readSafteyInfoBtn);

      const [safetyTab] = await Promise.all([
        this.page.context().waitForEvent('page'),
        this.actions.click(this.locators.readSafteyInfoBtn),
      ]);

      await safetyTab.waitForLoadState('load');

      // Assert /safety-info URL
      await safetyTab.waitForURL(/\/safety-info/);
      expect(safetyTab.url()).toContain('/safety-info');
      console.log(`[Verify] Safety Information tab verified with URL: "${safetyTab.url()}"`);

      // Assert page header //h1[text()='IMPORTANT SAFETY INFORMATION']
      const safetyHeader = safetyTab
        .locator("//h1[normalize-space()='IMPORTANT SAFETY INFORMATION']")
        .or(safetyTab.locator("//h1[text()='IMPORTANT SAFETY INFORMATION']"));
      await expect(safetyHeader).toBeVisible();
      console.log('[Verify] Safety Information header "IMPORTANT SAFETY INFORMATION" is visible');

      // Close the new tab and return to the main landing page
      await safetyTab.close();
      console.log('[Action] Closed Safety Information tab and returned to main page');
    });
  }

  /**
   * Click Show All button in FAQ section, verify FAQ question, click question, and verify answer.
   */
  async verifyFaqSection(): Promise<void> {
    await test.step('Verify FAQ Questions and Answers expansion', async () => {
      await this.actions.scrollIntoView(this.locators.showAllBtn);
      await this.actions.click(this.locators.showAllBtn);
      await this.page.waitForLoadState('load');

      await this.verify.expectElementExist(this.locators.faqQuestion);
      await this.actions.click(this.locators.faqQuestion);
      await this.verify.expectElementExist(this.locators.faqAnswer);
    });
  }

  /**
   * Execute the full verification flow for Landing Max page.
   */
  async executeFullLandingMaxFlow(url: string): Promise<void> {
    await test.step('Execute Full MAX Landing Page Flow', async () => {
      await this.navigateToLandingMax(url);
      await this.verifyAllCtaButtons();
      await this.verifySafetyInformation();
      await this.verifyFaqSection();
    });
  }
}