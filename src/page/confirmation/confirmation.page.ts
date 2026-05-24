import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import * as path from 'path';

const SAMPLE_ID_PATH = path.resolve(__dirname, '../../../tests/fixtures/sample-id.jpg');

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
      await this.page.waitForTimeout(2_000);

      const uploadBtn = this.page.locator(
        'button:has-text("Upload Photo"), button:has-text("Upload"), button:has-text("UPLOAD"), button:has-text("Upload ID")',
      ).first();
      await uploadBtn.waitFor({ state: 'visible', timeout: 15_000 });

      // Intercept the native file chooser opened by the Upload button
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent('filechooser', { timeout: 10_000 }),
        uploadBtn.click(),
      ]);
      await fileChooser.setFiles(SAMPLE_ID_PATH);

      // Wait for validation to process, then click "Submit Anyway"
      const submitAnyway = this.page.locator(
        'button:has-text("Submit Anyway"), button:has-text("Submit anyway")',
      ).first();
      await submitAnyway.waitFor({ state: 'visible', timeout: 30_000 });
      await submitAnyway.click();
      await this.page.waitForTimeout(1_000);
    });
  }

  async verifyConnectingToProvider(): Promise<void> {
    await test.step('Verify "Connecting you to a licensed provider" message', async () => {
      await this.page
        .locator('text=Connecting you to a licensed provider')
        .waitFor({ state: 'visible', timeout: 30_000 });
    });
  }

  async waitForProviderQueue(): Promise<void> {
    await test.step('Wait for provider queue (< 1 min estimated wait)', async () => {
      // Camera/microphone permissions are pre-granted via browser context
      await this.page
        .locator('text=Estimated waiting time')
        .waitFor({ state: 'visible', timeout: 60_000 });
    });
  }
}
