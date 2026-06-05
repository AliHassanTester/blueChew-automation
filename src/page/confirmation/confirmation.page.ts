import { Page, TestInfo, test, expect } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import * as path from 'path';

const SAMPLE_ID_PATH = path.resolve(__dirname, '../../../tests/fixtures/sampleID.jpg');

export class ConfirmationPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
  }

  async uploadIdPhoto(): Promise<void> {
    await test.step('Upload ID photo on confirmation page', async () => {
      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();

      const uploadBtn = this.page.locator(
        'button:has-text("Upload Photo"), button:has-text("Upload"), button:has-text("UPLOAD"), button:has-text("Upload ID")',
      ).first();

      // Intercept the native file chooser opened by the Upload button
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent('filechooser'),
        uploadBtn.click(),
      ]);
      await fileChooser.setFiles(SAMPLE_ID_PATH);

      // After validation processes, click "Submit Anyway"
      await this.page.locator(
        'button:has-text("Submit Anyway"), button:has-text("Submit anyway")',
      ).first().click();
    });
  }

  async verifyConnectingToProvider(): Promise<void> {
    await test.step('Verify "Connecting you to a licensed provider" message', async () => {
      await this.page.locator('text=Connecting you to a licensed provider').waitFor({ state: 'visible' });
    });
  }

  async waitForProviderQueue(): Promise<void> {
    await test.step('Wait for provider queue (< 1 min estimated wait)', async () => {
      // Camera/microphone permissions are pre-granted via the browser context.
      // Explicit 60s wait: provider matching can exceed the default action timeout.
      await this.page.locator('text=Estimated waiting time').waitFor({ state: 'visible', timeout: 60_000 });
    });
  }

  /**
   * After the provider approves the patient in the admin/care portal, refreshing the
   * patient's page (the one left in the provider queue) resolves to the "MY PLAN"
   * membership view. Verifies the active Gold subscription and the assigned provider.
   */
  async verifyTelevisit(): Promise<void> {
    await test.step('Refresh patient page and verify plan active + provider assigned', async () => {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.verify.waitForLoaderToDisappear();

      // The refreshed queue page resolves to /account/membership; fall back to it
      // explicitly if the redirect hasn't happened.
      const banner = this.page.locator('text=Your order is being processed');
      const onPlan = await banner.waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true).catch(() => false);
      if (!onPlan) {
        await this.page.goto(new URL('/account/membership', this.page.url()).href, { waitUntil: 'domcontentloaded' });
        await this.verify.waitForLoaderToDisappear();
      }

      // Active Gold subscription shown with the reviewing provider now assigned
      await expect(this.page.locator('text=Your order is being processed')).toBeVisible({ timeout: 30_000 });
      await expect(this.page.getByText('GOLD').first()).toBeVisible();
      await expect(this.page.getByText('Ali Hasan, MD')).toBeVisible();
    });
  }
}
