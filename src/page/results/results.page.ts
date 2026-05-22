import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';

export class ResultsPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
  }

  async verifyResultsPageLoaded(): Promise<void> {
    await test.step('Verify results/recommendations page loaded', async () => {
      await this.page
        .locator('[data-test-id="results-page-root"]')
        .waitFor({ state: 'visible', timeout: 20_000 });
    });
  }

  async clickTryGold(): Promise<void> {
    await test.step('Click TRY GOLD and navigate to medical profile', async () => {
      await this.page.locator('button.cta-button').first().click();
      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();
      // Wait for the medical profile form to be present
      await this.page
        .locator("input[formcontrolname='first_name']")
        .waitFor({ state: 'visible', timeout: 20_000 });
    });
  }
}
