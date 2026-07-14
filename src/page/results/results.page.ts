import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';

/**
 * Funnel-gold / recommendations page (https://dev.bluechew.com/results).
 * The page exposes a stable `data-test-id="results-page-root"` container and a
 * `cta-button` TRY GOLD CTA.
 */
export class ResultsPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);

    this.locators = {
      resultsPageRoot: {
        description: 'Results / Recommendations Page Root',
        locator: this.page.locator('[data-test-id="results-page-root"]'),
      },
      tryGoldButton: {
        description: 'TRY GOLD CTA Button',
        locator: this.page.locator('button.cta-button').first(),
      },

      // ── Post-navigation marker — first /medical field (confirms TRY GOLD landed) ──
      medicalFirstNameInput: {
        description: 'Medical Profile First Name Input (navigation marker)',
        locator: this.page.locator('input[aria-label="Legal First Name"]'),
      },
    };
  }

  async verifyResultsPageLoaded(): Promise<void> {
    await test.step('Verify results/recommendations page loaded', async () => {
      await this.verify.waitForVisibility(this.locators.resultsPageRoot);
    });
  }

  async clickTryGold(): Promise<void> {
    await test.step('Click TRY GOLD and navigate to medical profile', async () => {
      await this.actions.click(this.locators.tryGoldButton);
      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();

      // Wait for the medical profile form (first visible DS input on /medical)
      await this.verify.waitForVisibility(this.locators.medicalFirstNameInput);
    });
  }
}
