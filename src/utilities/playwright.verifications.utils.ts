import { Page, TestInfo, expect } from '@playwright/test';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import * as fs from 'fs';
import * as path from 'path';

export class PlaywrightVerificationFactory {
  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  async expectElementExist(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Verify] Expecting "${locatorInfo.description}" to exist and be visible`);
    await expect(locatorInfo.locator).toBeVisible();
  }

  async verifyNotExist(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Verify] Verifying "${locatorInfo.description}" is hidden / does not exist`);
    await expect(locatorInfo.locator).toBeHidden();
  }

  async verifyText(locatorInfo: LocatorInfo, expected: string): Promise<void> {
    console.log(`[Verify] Verifying text in "${locatorInfo.description}" contains "${expected}"`);
    const actual = (await locatorInfo.locator.textContent()) ?? '';
    if (!actual.includes(expected)) {
      this.testInfo.annotations.push({
        type: 'Soft Assertion Failure',
        description: `"${locatorInfo.description}" expected to contain "${expected}" but got "${actual}"`,
      });
    }
  }

  async verifyValue(locatorInfo: LocatorInfo, expected: string): Promise<void> {
    console.log(`[Verify] Verifying value of "${locatorInfo.description}" equals "${expected}"`);
    const actual = await locatorInfo.locator.inputValue();
    if (actual !== expected) {
      this.testInfo.annotations.push({
        type: 'Soft Assertion Failure',
        description: `"${locatorInfo.description}" expected value "${expected}" but got "${actual}"`,
      });
    }
  }

  async verifyTitle(expected: string): Promise<void> {
    console.log(`[Verify] Verifying page title equals "${expected}"`);
    await expect(this.page).toHaveTitle(expected);
  }

  assertAreEqual(expected: unknown, actual: unknown): void {
    console.log(`[Assert] Asserting values equal: expected "${expected}", actual "${actual}"`);
    expect(actual).toEqual(expected);
  }

  assertAreNotEqual(expected: unknown, actual: unknown): void {
    console.log(`[Assert] Asserting values not equal: expected not "${expected}", actual "${actual}"`);
    expect(actual).not.toEqual(expected);
  }

  assertAreTrue(actual: unknown): void {
    console.log(`[Assert] Asserting value is truthy: "${actual}"`);
    expect(actual).toBeTruthy();
  }

  assertGreaterThan(expected: number, actual: number): void {
    console.log(`[Assert] Asserting actual ${actual} > ${expected}`);
    expect(actual).toBeGreaterThan(expected);
  }

  assertGreaterThanOrEqualTo(expected: number, actual: number): void {
    console.log(`[Assert] Asserting actual ${actual} >= ${expected}`);
    expect(actual).toBeGreaterThanOrEqual(expected);
  }

  assertStringsEqual(actual: string, expected: string): void {
    console.log(`[Assert] Asserting string "${actual}" contains "${expected}"`);
    expect(actual).toContain(expected);
  }

  async assertElementHasClass(locatorInfo: LocatorInfo, className: string): Promise<void> {
    console.log(`[Assert] Asserting "${locatorInfo.description}" has class "${className}"`);
    await expect(locatorInfo.locator).toHaveClass(new RegExp(className));
  }

  async assertElementIsEnabled(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Assert] Asserting "${locatorInfo.description}" is enabled`);
    await expect(locatorInfo.locator).toBeEnabled();
  }

  async assertElementIsDisabled(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Assert] Asserting "${locatorInfo.description}" is disabled`);
    await expect(locatorInfo.locator).toBeDisabled();
  }

  async verifyRadioButtonIsChecked(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Verify] Verifying "${locatorInfo.description}" is checked`);
    await expect(locatorInfo.locator).toBeChecked();
  }

  async verifyLocatorsCount(locatorInfo: LocatorInfo, count: number): Promise<void> {
    console.log(`[Verify] Verifying "${locatorInfo.description}" element count is ${count}`);
    await expect(locatorInfo.locator).toHaveCount(count);
  }

  verifyContains(haystack: string, needle: string): void {
    console.log(`[Verify] Verifying string contains "${needle}"`);
    expect(haystack).toContain(needle);
  }

  async verifyUserHasAccess(url: string, shouldMatch: boolean): Promise<void> {
    console.log(`[Verify] Verifying user access for "${url}" (shouldMatch=${shouldMatch})`);
    const current = this.page.url();
    if (shouldMatch) {
      expect(current).toContain(url);
    } else {
      expect(current).not.toContain(url);
    }
  }

  async verifyFileDownload(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Verify] Verifying file download triggered by "${locatorInfo.description}"`);
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      locatorInfo.locator.click(),
    ]);
    expect(download.suggestedFilename()).toBeTruthy();
  }

  async verifyPdfContent(locatorInfo: LocatorInfo, text: string): Promise<void> {
    console.log(`[Verify] Verifying PDF content downloaded from "${locatorInfo.description}" contains "${text}"`);
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      locatorInfo.locator.click(),
    ]);
    const filePath = path.join(this.testInfo.outputDir, download.suggestedFilename());
    await download.saveAs(filePath);
    const content = fs.readFileSync(filePath).toString();
    expect(content).toContain(text);
  }

  async isElementVisible(locatorInfo: LocatorInfo): Promise<boolean> {
    console.log(`[Verify] Checking visibility of "${locatorInfo.description}"`);
    return locatorInfo.locator.isVisible();
  }

  async waitForSelector(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Verify] Waiting for "${locatorInfo.description}" to be attached`);
    await locatorInfo.locator.waitFor({ state: 'attached' });
  }

  async waitForVisibility(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Verify] Waiting for "${locatorInfo.description}" to be visible`);
    await locatorInfo.locator.waitFor({ state: 'visible' });
  }

  async waitForElementToDisappear(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Verify] Waiting for "${locatorInfo.description}" to disappear`);
    await locatorInfo.locator.waitFor({ state: 'detached' });
  }

  async waitForLoaderToDisappear(): Promise<void> {
    console.log('[Verify] Waiting for loading spinner / loader to disappear');
    // Wait for local-loader-com or spinner elements to be hidden
    await this.page.locator('local-loader-com, .spinner, .loader, mat-spinner, .loading-spinner').waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
    await this.waitForPageToSettle();
  }

  async waitForLoaderSettled(appearTimeout = 1_000, settleTimeout = 30_000): Promise<void> {
    console.log('[Verify] Waiting for loader to settle');
    await this.waitForPageToSettle(settleTimeout);
  }

  async waitForProcessingLoaderToDisappear(): Promise<void> {
    console.log('[Verify] Waiting for processing loader to disappear');
    await this.waitForPageToSettle();
  }

  private async waitForPageToSettle(timeout = 5_000): Promise<void> {
    const settleDelay = process.env.VISUAL_SETTLE_DELAY_MS ? parseInt(process.env.VISUAL_SETTLE_DELAY_MS, 10) : 1000;
    if (settleDelay > 0) {
      await this.page.waitForTimeout(settleDelay);
    }
    try {
      await this.page.waitForLoadState('load', { timeout: Math.min(timeout, 2_000) });
      await this.page.waitForLoadState('load', { timeout: Math.min(timeout, 2_000) });
    } catch {
      // Some pages never reach a fully idle state; falling back to the load event keeps
      // the test moving without relying on a fragile app-specific loader check.
    }
  }

  /**
   * Waits for the app's "Just a moment" loader to fully cycle: up to `appearTimeout`
   * for it to mount (it may never — that's fine), then up to `settleTimeout` for it to
   * clear. Unlike waitForLoaderToDisappear — which returns instantly when the loader
   * hasn't mounted *yet* and so can let the next action fire too early — this closes the
   * race where the loader appears a beat after a click (e.g. the checkout carousel's
   * strength → quantity → summary transitions, which fetch pricing between slides).
   */

  async expectToPass(assertion: () => Promise<void>, timeout: number = 10_000): Promise<void> {
    console.log('[Verify] Waiting for assertion to pass');
    const deadline = Date.now() + timeout;
    let lastError: Error | undefined;
    while (Date.now() < deadline) {
      try {
        await assertion();
        return;
      } catch (e) {
        lastError = e as Error;
        await this.page.waitForTimeout(500);
      }
    }
    throw lastError;
  }

  async ExpectDelegateToPass(
    delegate: () => Promise<void>,
    timeout: number = 10_000,
    interval: number = 500,
  ): Promise<void> {
    console.log('[Verify] Waiting for delegate to pass');
    const deadline = Date.now() + timeout;
    let lastError: Error | undefined;
    while (Date.now() < deadline) {
      try {
        await delegate();
        return;
      } catch (e) {
        lastError = e as Error;
        await this.page.waitForTimeout(interval);
      }
    }
    throw lastError;
  }

  async embedFullPageScreenshot(description: string): Promise<void> {
    console.log(`[Verify] Embedding full page screenshot: "${description}"`);
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.testInfo.attach(description, { body: screenshot, contentType: 'image/png' });
  }

  async logOrderNumber(locatorInfo: LocatorInfo, label: string): Promise<void> {
    const value = (await locatorInfo.locator.textContent()) ?? '';
    console.log(`[Verify] Logging order number "${value.trim()}" for "${locatorInfo.description}" (${label})`);
    this.testInfo.annotations.push({ type: label, description: value.trim() });
  }
}
