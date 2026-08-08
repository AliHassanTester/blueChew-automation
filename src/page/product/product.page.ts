import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { VisualHelper } from '@utilities/visual.helper';
import { captureApplitoolsVisualCheckpoint, PRODUCT_MAX_FIGMA_CONFIG } from '@utilities/applitools.utils';

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
      pageContainer: {
        description: 'Product Max page container',
        locator: this.page.locator('body'),
      },
      heroContent: {
        description: 'Product Max hero content',
        locator: this.page.locator('main').or(this.page.locator('body')),
      },
    };
  }

  async navigateToProductMax(url: string): Promise<void> {
    await test.step('Navigate to the product max page', async () => {
      await this.actions.navigateToURL(url);
      await this.actions.waitForDomLoad();
    });
  }

  async captureProductMaxSnapshot(): Promise<void> {
    await test.step('Capture the fully loaded product max page state', async () => {
      await this.page.waitForLoadState('load').catch(() => undefined);
      await this.verify.expectElementExist(this.locators.pageContainer);
      await captureApplitoolsVisualCheckpoint(this.page, PRODUCT_MAX_FIGMA_CONFIG, 'Product Max page loaded');
    });
  }
}
