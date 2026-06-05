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
        .waitFor({ state: 'visible' });
    });
  }

  async clickTryGold(): Promise<void> {
    await test.step('Click TRY GOLD and navigate to medical profile', async () => {
      await this.page.locator('button.cta-button').first().click();
      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();

      // For a logged-in user (registered earlier in the test), TRY GOLD redirects
      // directly to /medical on the app domain. The app-domain dev gate cookie set
      // during the registration step is still active, so no re-prompt is expected.
      // Handle it defensively in case session state differs.
      const gateInput = this.page.locator("input[formcontrolname='password']");
      if (await gateInput.isVisible().catch(() => false)) {
        await gateInput.fill(process.env.DEV_GATE_PASSWORD || 'dev');
        await this.page.locator('[data-test-id="dev-login-submit-button"]').click();
        await this.actions.waitForDomLoad();
        await this.verify.waitForLoaderToDisappear();
      }

      // Wait for the medical profile form (first visible DS input on /medical)
      await this.page
        .locator('input[aria-label="Legal First Name"]')
        .waitFor({ state: 'visible' });
    });
  }
}
