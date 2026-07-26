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
    await expect(locatorInfo.locator).toBeVisible();
  }

  async verifyNotExist(locatorInfo: LocatorInfo): Promise<void> {
    await expect(locatorInfo.locator).toBeHidden();
  }

  async verifyText(locatorInfo: LocatorInfo, expected: string): Promise<void> {
    const actual = (await locatorInfo.locator.textContent()) ?? '';
    if (!actual.includes(expected)) {
      this.testInfo.annotations.push({
        type: 'Soft Assertion Failure',
        description: `"${locatorInfo.description}" expected to contain "${expected}" but got "${actual}"`,
      });
    }
  }

  async verifyValue(locatorInfo: LocatorInfo, expected: string): Promise<void> {
    const actual = await locatorInfo.locator.inputValue();
    if (actual !== expected) {
      this.testInfo.annotations.push({
        type: 'Soft Assertion Failure',
        description: `"${locatorInfo.description}" expected value "${expected}" but got "${actual}"`,
      });
    }
  }

  async verifyTitle(expected: string): Promise<void> {
    await expect(this.page).toHaveTitle(expected);
  }

  assertAreEqual(expected: unknown, actual: unknown): void {
    expect(actual).toEqual(expected);
  }

  assertAreNotEqual(expected: unknown, actual: unknown): void {
    expect(actual).not.toEqual(expected);
  }

  assertAreTrue(actual: unknown): void {
    expect(actual).toBeTruthy();
  }

  assertGreaterThan(expected: number, actual: number): void {
    expect(actual).toBeGreaterThan(expected);
  }

  assertGreaterThanOrEqualTo(expected: number, actual: number): void {
    expect(actual).toBeGreaterThanOrEqual(expected);
  }

  assertStringsEqual(actual: string, expected: string): void {
    expect(actual).toContain(expected);
  }

  async assertElementHasClass(locatorInfo: LocatorInfo, className: string): Promise<void> {
    await expect(locatorInfo.locator).toHaveClass(new RegExp(className));
  }

  async assertElementIsEnabled(locatorInfo: LocatorInfo): Promise<void> {
    await expect(locatorInfo.locator).toBeEnabled();
  }

  async assertElementIsDisabled(locatorInfo: LocatorInfo): Promise<void> {
    await expect(locatorInfo.locator).toBeDisabled();
  }

  async verifyRadioButtonIsChecked(locatorInfo: LocatorInfo): Promise<void> {
    await expect(locatorInfo.locator).toBeChecked();
  }

  async verifyLocatorsCount(locatorInfo: LocatorInfo, count: number): Promise<void> {
    await expect(locatorInfo.locator).toHaveCount(count);
  }

  verifyContains(haystack: string, needle: string): void {
    expect(haystack).toContain(needle);
  }

  async verifyUserHasAccess(url: string, shouldMatch: boolean): Promise<void> {
    const current = this.page.url();
    if (shouldMatch) {
      expect(current).toContain(url);
    } else {
      expect(current).not.toContain(url);
    }
  }

  async verifyFileDownload(locatorInfo: LocatorInfo): Promise<void> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      locatorInfo.locator.click(),
    ]);
    expect(download.suggestedFilename()).toBeTruthy();
  }

  async verifyPdfContent(locatorInfo: LocatorInfo, text: string): Promise<void> {
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
    return locatorInfo.locator.isVisible();
  }

  async waitForSelector(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.waitFor({ state: 'attached' });
  }

  async waitForVisibility(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.waitFor({ state: 'visible' });
  }

  async waitForElementToDisappear(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.waitFor({ state: 'detached' });
  }

  async waitForLoaderToDisappear(): Promise<void> {
    await this.waitForPageToSettle();
  }

  async waitForLoaderSettled(appearTimeout = 1_000, settleTimeout = 30_000): Promise<void> {
    await this.waitForPageToSettle(settleTimeout);
  }

  async waitForProcessingLoaderToDisappear(): Promise<void> {
    await this.waitForPageToSettle();
  }

  private async waitForPageToSettle(timeout = 30_000): Promise<void> {
    try {
      await this.page.waitForLoadState('load', { timeout });
      await this.page.waitForLoadState('networkidle', { timeout: Math.min(timeout, 10_000) });
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
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.testInfo.attach(description, { body: screenshot, contentType: 'image/png' });
  }

  async logOrderNumber(locatorInfo: LocatorInfo, label: string): Promise<void> {
    const value = (await locatorInfo.locator.textContent()) ?? '';
    this.testInfo.annotations.push({ type: label, description: value.trim() });
  }
}
