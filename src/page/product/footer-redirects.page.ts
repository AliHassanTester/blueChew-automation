import { Page, TestInfo, test, expect } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { VisualHelper } from '@utilities/visual.helper';
import { FooterRedirectItem } from '@interfaces/footer-redirects.interface';

export class FooterRedirectsPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly visual: VisualHelper;
  public readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo, visual: VisualHelper) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
    this.visual = visual;

    this.locators = {
      footerContainer: {
        description: 'Homepage Main Footer Container',
        locator: this.page
          .locator("//footer[contains(@class, 'ds-footer')] | //footer | //app-footer//footer")
          .first(),
      },
      helpHeading: {
        description: 'Footer HELP Section Heading',
        locator: this.page
          .locator("//footer//h3[normalize-space()='HELP'] | //h3[normalize-space()='HELP']")
          .first(),
      },
      learnHeading: {
        description: 'Footer LEARN Section Heading',
        locator: this.page
          .locator("//footer//h3[normalize-space()='LEARN'] | //h3[normalize-space()='LEARN']")
          .first(),
      },
      footerLogo: {
        description: 'Footer BlueChew Logo',
        locator: this.page
          .locator("//footer//div[contains(@class, 'ds-footer__logo')]//img | //footer//img[@alt='BlueChew']")
          .first(),
      },
      legalLinksContainer: {
        description: 'Footer Legal Links Container',
        locator: this.page
          .locator("//footer//*[contains(@class, 'ds-footer__legal-links')] | //footer//*[contains(@class, 'ds-footer__legal')]")
          .first(),
      },
    };
  }

  /**
   * Get a dynamic LocatorInfo wrapper for any footer link.
   */
  public getFooterLinkLocatorInfo(item: FooterRedirectItem): LocatorInfo {
    const xpathSelector = item.linkSelector.startsWith('//')
      ? `//footer${item.linkSelector}`
      : `//footer//${item.linkSelector}`;
    return {
      description: item.description || `Footer link: "${item.name}"`,
      locator: this.page.locator(xpathSelector).first(),
    };
  }

  /**
   * Navigate to the homepage and wait for DOM stabilization.
   */
  async navigateToHomePage(url: string = '/'): Promise<void> {
    await test.step(`Navigate to Homepage: ${url}`, async () => {
      await this.actions.navigateToURL(url);
      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear().catch(() => undefined);
    });
  }

  /**
   * Scroll down to the bottom of the page and verify footer visibility.
   */
  async scrollToFooter(): Promise<void> {
    await test.step('Scroll down to the footer section', async () => {
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await this.actions.scrollIntoView(this.locators.footerContainer);
      await this.verify.expectElementExist(this.locators.footerContainer);
    });
  }

  /**
   * Capture a component-level visual baseline of the entire footer widget.
   */
  async captureFooterVisualBaseline(snapshotName: string = 'homepage-footer-component'): Promise<void> {
    await test.step(`[Visual] Capture Footer Component Baseline: "${snapshotName}"`, async () => {
      await this.scrollToFooter();
      await this.visual.captureElementSnapshot(this.locators.footerContainer, snapshotName, {
        maxDiffPixelRatio: 0.01,
      });
    });
  }

  /**
   * Verify a single footer redirect:
   * - Clicks the link (or handles new tab if isNewTab)
   * - Executes at least 2 assertions:
   *     Assertion 1: URL matches expected pattern
   *     Assertion 2: Page Title matches expected pattern (and element is verified)
   * - Cleans up (closes new tab or navigates back to homepage)
   */
  async verifyFooterRedirect(item: FooterRedirectItem): Promise<void> {
    await test.step(`Verify [${item.section}] redirect: "${item.name}"`, async () => {
      const linkLocatorInfo = this.getFooterLinkLocatorInfo(item);

      // Scroll link into view inside footer
      await this.actions.scrollIntoView(linkLocatorInfo);

      if (item.isNewTab) {
        // ── Handle New Tab / Popup Redirect (e.g. External Swag Store) ────────
        console.log(`[Action] Clicking new-tab link "${item.name}"`);
        const [popupTab] = await Promise.all([
          this.page.context().waitForEvent('page'),
          this.actions.click(linkLocatorInfo),
        ]);

        await popupTab.waitForLoadState('domcontentloaded');
        await popupTab.waitForLoadState('load').catch(() => undefined);

        // Assertion 1: Verify Endpoint URL
        const popupUrl = popupTab.url();
        console.log(`[Assert] Endpoint URL: Verifying new tab URL matches "${item.expectedUrlPattern}". Current: "${popupUrl}"`);
        expect(popupUrl).toMatch(item.expectedUrlPattern);

        // Assertion 2: Verify Primary Prominent Locator
        const primaryEl = popupTab.locator(item.primaryLocatorSelector).filter({ visible: true }).first();
        await expect(primaryEl).toBeVisible({ timeout: 15_000 });
        console.log(`[Assert] Primary Locator: Verified "${item.primaryLocatorDescription}" is visible`);

        // Assertion 3: Verify Secondary Prominent Locator
        const secondaryEl = popupTab.locator(item.secondaryLocatorSelector).filter({ visible: true }).first();
        await expect(secondaryEl).toBeVisible({ timeout: 15_000 });
        console.log(`[Assert] Secondary Locator: Verified "${item.secondaryLocatorDescription}" is visible`);

        // Assertion 4: Verify Page Title
        const popupTitle = await popupTab.title();
        console.log(`[Assert] Page Title: Verifying title matches "${item.expectedTitlePattern}". Current: "${popupTitle}"`);
        expect(popupTitle).toMatch(item.expectedTitlePattern);

        // Close new tab and return to main page
        await popupTab.close();
        console.log(`[Action] Closed new tab "${item.name}" and returned focus to main homepage`);
      } else {
        // ── Handle Same-Tab Redirect ──────────────────────────────────────────
        console.log(`[Action] Clicking same-tab link "${item.name}"`);
        await this.actions.click(linkLocatorInfo);
        await this.page.waitForLoadState('load').catch(() => undefined);

        // Assertion 1: Verify Endpoint URL
        await expect(this.page).toHaveURL(item.expectedUrlPattern);
        console.log(`[Assert] Endpoint URL: Verified page URL matches "${item.expectedUrlPattern}". Current: "${this.page.url()}"`);

        // Assertion 2: Verify Primary Prominent Locator (e.g. Main Heading / Banner)
        const primaryEl = this.page.locator(item.primaryLocatorSelector).filter({ visible: true }).first();
        await expect(primaryEl).toBeVisible({ timeout: 15_000 });
        console.log(`[Assert] Primary Locator: Verified "${item.primaryLocatorDescription}" is visible`);

        // Assertion 3: Verify Secondary Prominent Locator (e.g. CTA / Key Content Element)
        const secondaryEl = this.page.locator(item.secondaryLocatorSelector).filter({ visible: true }).first();
        await expect(secondaryEl).toBeVisible({ timeout: 15_000 });
        console.log(`[Assert] Secondary Locator: Verified "${item.secondaryLocatorDescription}" is visible`);

        // Assertion 4: Verify Page Title
        await expect(this.page).toHaveTitle(item.expectedTitlePattern);
        console.log(`[Assert] Page Title: Verified title matches "${item.expectedTitlePattern}". Current: "${await this.page.title()}"`);

        // Return back to the homepage and scroll to footer for subsequent redirects
        console.log('[Action] Navigating back to homepage for next redirect check');
        await this.navigateToHomePage('/');
        await this.scrollToFooter();
      }
    });
  }

  /**
   * Iterate and verify all footer redirect links.
   */
  async verifyAllFooterRedirects(footerLinks: FooterRedirectItem[]): Promise<void> {
    await test.step(`Verify all ${footerLinks.length} footer redirect links across HELP, LEARN, and LEGAL sections`, async () => {
      await this.scrollToFooter();

      for (const link of footerLinks) {
        await this.verifyFooterRedirect(link);
      }
    });
  }

  /**
   * Execute the full end-to-end footer flow (Navigate -> Visual Baseline -> All Redirect Verifications).
   */
  async executeFullFooterFlow(homeUrl: string, footerLinks: FooterRedirectItem[]): Promise<void> {
    await test.step('Execute Full Homepage Footer Bottom Page Redirects Flow', async () => {
      await this.navigateToHomePage(homeUrl);
      await this.captureFooterVisualBaseline('01-homepage-footer-baseline');
      await this.verifyAllFooterRedirects(footerLinks);
    });
  }
}
