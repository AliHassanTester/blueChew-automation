import { Page, TestInfo, test, expect } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import * as path from 'path';

const SAMPLE_ID_PATH = path.resolve(__dirname, '../../../tests/fixtures/sampleID.jpg');

/**
 * Post-purchase confirmation page (/checkout/confirmation): ID-photo upload → provider
 * queue, then the post-approval televisit/plan view (/account/membership).
 */
export class ConfirmationPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);

    this.locators = {
      uploadPhotoButton: {
        description: 'Upload ID Photo Button',
        locator: this.page.locator(
          'button:has-text("Upload Photo"), button:has-text("Upload ID"), button:has-text("Upload"), button:has-text("UPLOAD")',
        ).first(),
      },
      submitAnywayButton: {
        description: 'Submit Anyway Button (after ID validation)',
        locator: this.page.locator(
          'button:has-text("Submit Anyway"), button:has-text("Submit anyway")',
        ).first(),
      },
      connectingMessage: {
        description: '"Connecting you to a licensed provider" Message',
        locator: this.page.locator('text=Connecting you to a licensed provider'),
      },
      estimatedWaitMessage: {
        description: 'Provider Queue "Estimated waiting time" Message',
        locator: this.page.locator('text=Estimated waiting time'),
      },

      // ── Post-approval plan / televisit view (/account/membership) ───────────
      orderProcessingBanner: {
        description: '"Your order is being processed" Banner',
        locator: this.page.locator('text=Your order is being processed'),
      },
      goldPlanLabel: {
        description: 'Active GOLD Plan Label',
        locator: this.page.getByText('GOLD').first(),
      },
    };
  }

  async uploadIdPhoto(): Promise<void> {
    await test.step('Upload ID photo on confirmation page', async () => {
      await this.actions.waitForDomLoad();
      await this.verify.waitForLoaderToDisappear();

      // Intercept the native file chooser opened by the Upload button
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent('filechooser'),
        this.actions.click(this.locators.uploadPhotoButton),
      ]);
      await fileChooser.setFiles(SAMPLE_ID_PATH);

      // After validation processes, click "Submit Anyway"
      await this.actions.click(this.locators.submitAnywayButton);
    });
  }

  async verifyConnectingToProvider(): Promise<void> {
    await test.step('Verify "Connecting you to a licensed provider" message', async () => {
      await this.verify.waitForVisibility(this.locators.connectingMessage);
    });
  }

  async waitForProviderQueue(): Promise<void> {
    await test.step('Wait for provider queue (< 1 min estimated wait)', async () => {
      // Camera/microphone permissions are pre-granted via the browser context.
      // Explicit 60s wait: provider matching can exceed the default action timeout.
      await this.locators.estimatedWaitMessage.locator.waitFor({ state: 'visible', timeout: 60_000 });
    });
  }

  /**
   * After the provider approves the patient in the admin/care portal, refreshing the
   * patient's page (the one left in the provider queue) resolves to the "MY PLAN"
   * membership view. Verifies the order is now being processed and the Gold plan is active.
   */
  async verifyTelevisit(): Promise<void> {
    await test.step('Refresh patient page and verify order processing + Gold plan active', async () => {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.verify.waitForLoaderToDisappear();

      // The refreshed queue page resolves to /account/membership; fall back to it
      // explicitly if the redirect hasn't happened.
      const onPlan = await this.locators.orderProcessingBanner.locator
        .waitFor({ state: 'visible', timeout: 15_000 })
        .then(() => true).catch(() => false);
      if (!onPlan) {
        await this.page.goto(new URL('/account/membership', this.page.url()).href, { waitUntil: 'domcontentloaded' });
        await this.verify.waitForLoaderToDisappear();
      }

      // Post-approval state: the order is now being processed and the Gold plan is active.
      // (The provider name is intentionally not asserted — it is not shown on this view
      // and varies by which provider approved.)
      await expect(this.locators.orderProcessingBanner.locator).toBeVisible({ timeout: 30_000 });
      await expect(this.locators.goldPlanLabel.locator).toBeVisible();
    });
  }
}
