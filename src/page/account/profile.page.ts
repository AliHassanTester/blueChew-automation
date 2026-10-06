import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { ShippingAddressInput } from '@interfaces/profile.interface';
import { VisualHelper } from '@utilities/visual.helper';
import { ApplitoolsVisualConfig, PROFILE_FIGMA_CONFIG } from '@data/visual/figma.visual.data';

/**
 * Account → Profile area (/account/profile and its edit sub-pages). Locators are XPath
 * anchored on stable hooks (formcontrolname, role, DS component text) derived from a live
 * DOM capture of each page + its post-submit state. The change-password / update-shipping
 * forms render as DS cards reachable directly by URL.
 */
export class ProfilePage {
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
      // ── Notification preferences (profile page) — each toggle wraps a role=switch ──
      smsToggle: {
        description: 'SMS Notification Toggle',
        locator: this.page.locator("//ds-toggle[@formcontrolname='sms']//button[@role='switch']"),
      },
      emailToggle: {
        description: 'Marketing Emails Toggle',
        locator: this.page.locator("//ds-toggle[@formcontrolname='email_marketing']//button[@role='switch']"),
      },
      preferencesSnackbar: {
        description: 'Preferences Updated Snackbar',
        locator: this.page.locator(
          "//div[@id='snackbar'][contains(@class,'success')][contains(normalize-space(),'preferences were updated')]",
        ),
      },
      shippingSummary: {
        description: 'Profile — Shipping Address summary row',
        locator: this.page.locator("//button[contains(normalize-space(.),'Shipping Address')]"),
      },

      // ── Change password form (/account/profile/change-password) ───────────────
      currentPasswordInput: {
        description: 'Current Password Input',
        locator: this.page.locator("//ds-input[@formcontrolname='oldpass']//input"),
      },
      newPasswordInput: {
        description: 'New Password Input',
        locator: this.page.locator("//ds-input[@formcontrolname='newpass']//input"),
      },
      confirmPasswordInput: {
        description: 'Confirm New Password Input',
        locator: this.page.locator("//ds-input[@formcontrolname='confirmpass']//input"),
      },
      changePasswordSubmit: {
        description: 'Change Password Submit (Confirm)',
        locator: this.page.locator("//button[@type='submit'][normalize-space()='Confirm']"),
      },
      passwordUpdatedSuccess: {
        description: 'Password Updated Success Message',
        locator: this.page.locator("//p[contains(@class,'profile-edit-modal-wrapper__success-text')]"),
      },

      // ── Update shipping address form (/account/profile/update-shipping-address) ─
      shippingStreetInput: {
        description: 'Shipping Street Address Input',
        locator: this.page.locator("//ds-input[@formcontrolname='line_1']//input"),
      },
      shippingAptInput: {
        description: 'Shipping Apartment/Suite Input',
        locator: this.page.locator("//ds-input[@formcontrolname='line_2']//input"),
      },
      shippingCityInput: {
        description: 'Shipping City Input',
        locator: this.page.locator("//ds-input[@formcontrolname='city']//input"),
      },
      shippingZipInput: {
        description: 'Shipping ZIP Input',
        locator: this.page.locator("//ds-input[@formcontrolname='zip']//input"),
      },
      saveShippingButton: {
        description: 'Save Changes Button',
        locator: this.page.locator("//button[normalize-space()='Save changes']"),
      },
      confirmAddressButton: {
        description: 'Confirm Delivery Address Modal — Confirm Button',
        locator: this.page.locator(
          "//*[@aria-label='Confirm Your Delivery Address']//button[normalize-space()='Confirm']",
        ),
      },
    };
  }

  private async waitForProfileReady(): Promise<void> {
    await this.page.waitForLoadState('load').catch(() => undefined);
    await this.verify.waitForLoaderToDisappear();
  }

  private async ensureAuthenticated(targetUrl?: string, currentPassword?: string): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
    const loginInput = this.page
      .locator("//input[@data-test-id='sign-in-email-input'] | //input[@type='email'] | //input[contains(@placeholder,'Email')]")
      .first();
    const isLogin =
      this.page.url().includes('/log-in') ||
      (await loginInput.waitFor({ state: 'visible', timeout: 3500 }).then(() => true).catch(() => false));
    if (isLogin || this.page.url().includes('/log-in')) {
      console.log('[ProfilePage] Session expired or redirected to login; re-authenticating...');
      const email = process.env.user_name || 'ali@meds.com';
      const pass = currentPassword || process.env.password || 'certa@123';
      if (await loginInput.isVisible().catch(() => false)) {
        await loginInput.fill(email);
        const passInput = this.page
          .locator("//input[@data-test-id='sign-in-password-input'] | //input[@type='password']")
          .first();
        await passInput.fill(pass);
        const submitBtn = this.page
          .locator("//button[@data-test-id='sign-in-submit-button'] | //button[normalize-space()='CONTINUE']")
          .first();
        await submitBtn.click();
        await this.page.waitForURL(/\/account/, { timeout: 25_000 }).catch(() => undefined);
        if (targetUrl) {
          await this.actions.navigateToURL(targetUrl);
          await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
        }
      }
    }
  }

  // ── PROF-010 ────────────────────────────────────────────────────────────────

  /**
   * Complete E2E Password Verification:
   * 1. Updates password from current → temporary password and asserts success.
   * 2. Navigates to /log-in and verifies successful authentication using the new temporary password.
   * 3. Restores the original password in a finally block so subsequent test suites never fail.
   */
  async changePasswordAndRestore(currentPassword: string, tempPassword: string): Promise<void> {
    await test.step('E2E Change Password Flow: Modify → Authenticate with New Password → Restore', async () => {
      try {
        await test.step('Step 1: Change current → temporary password', async () => {
          await this.submitPasswordChange(currentPassword, tempPassword);
        });

        await test.step('Step 2: Verify login with the new temporary password on /log-in', async () => {
          await this.actions.navigateToURL('/log-in');
          await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
          await this.ensureAuthenticated('/account/profile', tempPassword);
          await this.page.waitForURL(/\/account/, { timeout: 25_000 });
          await this.verify.waitForLoaderToDisappear();
        });
      } finally {
        await test.step('Step 3: Restore original password', async () => {
          await this.submitPasswordChange(tempPassword, currentPassword);
        });
      }
    });
  }

  /** Opens the change-password card, submits old/new/confirm, and asserts the success message. */
  private async submitPasswordChange(oldPassword: string, newPassword: string): Promise<void> {
    await this.actions.navigateToURL('/account/profile/change-password');
    await this.ensureAuthenticated('/account/profile/change-password', oldPassword);
    if (this.page.url().includes('/account') && !this.page.url().includes('change-password')) {
      await this.actions.navigateToURL('/account/profile/change-password');
    }
    await this.actions.waitForVisibility(this.locators.currentPasswordInput);
    await this.actions.sendKeys(this.locators.currentPasswordInput, oldPassword);
    await this.actions.sendKeys(this.locators.newPasswordInput, newPassword);
    await this.actions.sendKeys(this.locators.confirmPasswordInput, newPassword);
    await this.actions.click(this.locators.changePasswordSubmit);
    await this.actions.waitForVisibility(this.locators.passwordUpdatedSuccess);
    await this.verify.expectElementExist(this.locators.passwordUpdatedSuccess);
    await this.waitForProfileReady();
  }

  // ── PROF-011 ────────────────────────────────────────────────────────────────

  /**
   * Saves a new shipping address, confirms the USPS modal, and verifies it persisted.
   * Picks whichever of the two candidate addresses differs from the currently-saved one,
   * so the form is always dirty ("Save changes" enables) and the test is idempotent.
   */
  async updateShippingAddress(primary: ShippingAddressInput, alternate: ShippingAddressInput): Promise<void> {
    let target: ShippingAddressInput = primary;
    await test.step('Update shipping address and verify it persists', async () => {
      await test.step('Fill the form with an address different from the current one, and save', async () => {
        await this.actions.navigateToURL('/account/profile/update-shipping-address');
        await this.ensureAuthenticated('/account/profile/update-shipping-address');
        if (this.page.url().includes('/account') && !this.page.url().includes('update-shipping-address')) {
          await this.actions.navigateToURL('/account/profile/update-shipping-address');
        }
        await this.actions.waitForVisibility(this.locators.shippingStreetInput);
        const currentStreet = (await this.actions.getInputValue(this.locators.shippingStreetInput)).trim();
        target = currentStreet === primary.streetAddress ? alternate : primary;

        await this.actions.sendKeys(this.locators.shippingStreetInput, target.streetAddress);
        await this.actions.sendKeys(this.locators.shippingAptInput, target.aptSuite ?? '');
        await this.actions.sendKeys(this.locators.shippingCityInput, target.city);
        await this.actions.sendKeys(this.locators.shippingZipInput, target.zip);
        await this.actions.click(this.locators.saveShippingButton);
      });

      await test.step('Confirm the delivery-address modal (shown on USPS non-exact match)', async () => {
        // Conditional — an exact USPS match saves without asking for confirmation.
        try {
          await this.locators.confirmAddressButton.locator.waitFor({ state: 'visible', timeout: 6000 });
          await this.actions.click(this.locators.confirmAddressButton);
          await this.locators.confirmAddressButton.locator.waitFor({ state: 'detached', timeout: 8000 }).catch(() => undefined);
        } catch {
          // No confirmation prompt — address accepted as entered.
        }
        await this.verify.waitForLoaderToDisappear();
      });

      await test.step('Reload the profile and assert the new address is shown', async () => {
        if (!this.page.url().includes('/account/profile')) {
          await this.actions.navigateToURL('/account/profile');
        }
        await this.actions.waitForDomLoad();
        if (this.visual) {
          await this.visual.captureCheckpoint('Profile - shipping address updated', PROFILE_FIGMA_CONFIG);
        }
        await this.verify.waitForLoaderToDisappear();
        await this.actions.waitForVisibility(this.locators.shippingSummary);

        const normalizedStreet = target.streetAddress.replace(/\s+/g, ' ').trim();
        await this.verify.expectToPass(async () => {
          const summary = await this.actions.getText(this.locators.shippingSummary);
          const normalizedSummary = summary.replace(/\s+/g, ' ').trim();
          this.verify.verifyContains(normalizedSummary, normalizedStreet);
        }, 15000);
        await this.waitForProfileReady();
      });
    });
  }

  // ── PROF-012 ────────────────────────────────────────────────────────────────

  /** Flips each notification toggle (SMS + Marketing Emails), verifies it, then restores. */
  async toggleNotificationPreferences(): Promise<void> {
    await test.step('Toggle SMS + Marketing Email preferences and restore each', async () => {
      await this.actions.navigateToURL('/account/profile');
      await this.page.waitForLoadState('load');
      await this.verify.waitForLoaderToDisappear();

      await this.toggleAndRestore(this.locators.smsToggle);
      await this.toggleAndRestore(this.locators.emailToggle);
    });
  }

  /** Reads a toggle's state, flips it (asserting the change + confirmation), then flips it back. */
  private async toggleAndRestore(toggle: LocatorInfo): Promise<void> {
    await test.step(`Toggle "${toggle.description}", verify the change, then restore it`, async () => {
      await this.actions.waitForVisibility(toggle);
      const original = await toggle.locator.getAttribute('aria-checked');

      await this.actions.click(toggle);
      await this.actions.waitForVisibility(this.locators.preferencesSnackbar);
      this.verify.assertAreNotEqual(original, await toggle.locator.getAttribute('aria-checked'));
      await this.verify.waitForElementToDisappear(this.locators.preferencesSnackbar);

      await this.actions.click(toggle);
      await this.actions.waitForVisibility(this.locators.preferencesSnackbar);
      this.verify.assertAreEqual(original, await toggle.locator.getAttribute('aria-checked'));
      await this.verify.waitForElementToDisappear(this.locators.preferencesSnackbar);
    });
  }

  async captureProfileSnapshot(visualConfig: ApplitoolsVisualConfig = PROFILE_FIGMA_CONFIG, tag: string = 'Profile page loaded'): Promise<void> {
    await test.step(`Capture the fully loaded ${tag} state`, async () => {
      if (this.page.url() === 'about:blank' || !this.page.url().includes('/account')) {
        await this.actions.navigateToURL('/account/profile');
      }
      await this.page.waitForLoadState('load').catch(() => undefined);
      if (this.visual) {
        await this.visual.captureCheckpoint(tag, visualConfig);
      }
    });
  }
}
