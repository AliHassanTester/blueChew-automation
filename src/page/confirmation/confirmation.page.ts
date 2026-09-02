import { Page, TestInfo, test, expect } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import * as path from 'path';
import { VisualHelper } from '@utilities/visual.helper';
import { ApplitoolsVisualConfig, CONFIRMATION_FIGMA_CONFIG } from '@data/visual/figma.visual.data';

const SAMPLE_ID_PATH = path.resolve(__dirname, '../../../tests/fixtures/sampleID.jpg');

/**
 * Post-purchase confirmation page (/checkout/confirmation): ID-photo upload → provider
 * queue, then the post-approval televisit/plan view (/account/membership).
 */
export class ConfirmationPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly visual?: VisualHelper;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo, visual?: VisualHelper) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
    this.visual = visual;

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
      await this.page.waitForLoadState('load');
      if (this.visual) {
        await this.visual.captureCheckpoint('Confirmation - ID photo upload screen', CONFIRMATION_FIGMA_CONFIG);
      }
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
      await this.page.waitForLoadState('load');
      await this.verify.waitForVisibility(this.locators.connectingMessage);
    });
  }

  async waitForProviderQueue(): Promise<void> {
    await test.step('Wait for provider queue or post-queue order state', async () => {
      const queueMessage = this.locators.estimatedWaitMessage.locator;
      const connectingMessage = this.locators.connectingMessage.locator;
      const processingMessage = this.locators.orderProcessingBanner.locator;

      await expect
        .poll(async () => {
          const hasQueueMessage = await queueMessage.isVisible().catch(() => false);
          const hasConnectingMessage = await connectingMessage.isVisible().catch(() => false);
          const hasProcessingMessage = await processingMessage.isVisible().catch(() => false);
          const isOnMembershipPage = /\/account\/membership/.test(this.page.url());

          return hasQueueMessage || hasConnectingMessage || hasProcessingMessage || isOnMembershipPage;
        }, {
          timeout: 90_000,
          intervals: [1_000, 2_000, 3_000, 5_000],
        })
        .toBeTruthy();
    });
  }

  /** Upload the ID photo, then wait through provider connection into the queue. */
  async submitIdAndAwaitProvider(): Promise<void> {
    await test.step('Submit ID photo and wait for provider queue', async () => {
      await this.uploadIdPhoto();
      await this.verifyConnectingToProvider();
      await this.waitForProviderQueue();
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

  async captureConfirmationSnapshot(visualConfig: ApplitoolsVisualConfig = CONFIRMATION_FIGMA_CONFIG, tag: string = 'Confirmation page loaded'): Promise<void> {
    await test.step(`Capture the fully loaded ${tag} state`, async () => {
      await this.page.waitForLoadState('load').catch(() => undefined);
      if (this.visual) {
        await this.visual.captureCheckpoint(tag, visualConfig);
      }
    });
  }

  /** Complete full post-checkout ID submission, admin approval and televisit verification. */
  async approveAndVerifyOrder(adminPage: any, details: any): Promise<void> {
    await this.submitIdAndAwaitProvider();
    await adminPage.approveAndCreateFirstOrder(details);
    await this.verifyTelevisit();
  }
}
