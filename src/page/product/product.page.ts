import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { VisualHelper } from '@utilities/visual.helper';
import { captureApplitoolsVisualCheckpoint } from '@utilities/applitools.utils';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

export class ProductPage {
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
      heroContent: {
        description: 'Product hero content',
        locator: this.page.locator('main').or(this.page.locator('body')),
      },
      selectPlanButton: {
        description: 'SELECT A PLAN button',
        locator: this.page.locator('//div[@class="cta-section"]//button'),
      },
      startNowButton: {
        description: 'START NOW / CONTINUE button (on Plan page)',
        locator: this.page
          .locator("//button[text()='START NOW']")
          .or(this.page.locator("button:has-text('START NOW')"))
          .or(this.page.locator("//button[text()='CONTINUE']"))
          .or(this.page.locator("button:has-text('CONTINUE')")),
      },
    };
  }

  async selectPlanAndProceed(): Promise<void> {
    await test.step('Select a plan and proceed to checkout funnel', async () => {
      await this.page.evaluate(() => {
        const btn = document.querySelector<HTMLElement>('.cta-section button, .cta-button');
        btn?.click();
      });
      await this.page.waitForLoadState();
      await this.actions.click(this.locators.startNowButton);
      await this.page.waitForLoadState('domcontentloaded');
    });
  }

  async navigateToProductPage(url: string, pageName: string = 'Product'): Promise<void> {
    await test.step(`Navigate to the ${pageName} page`, async () => {
      await this.actions.navigateToURL(url);
      await this.actions.waitForDomLoad();
    });
  }

  async captureProductSnapshot(visualConfig?: ApplitoolsVisualConfig, tag: string = 'Product page loaded'): Promise<void> {
    await test.step(`Capture the fully loaded ${tag} state`, async () => {
      await this.page.waitForLoadState('load').catch(() => undefined);
      if (visualConfig) {
        await captureApplitoolsVisualCheckpoint(this.page, visualConfig, tag);
      }
    });
  }
}
