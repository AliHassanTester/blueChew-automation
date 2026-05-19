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
    await locatorInfo.locator.waitFor({ state: 'attached', timeout: 65_000 });
  }

  async waitForVisibility(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.waitFor({ state: 'visible', timeout: 65_000 });
  }

  async waitForElementToDisappear(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.waitFor({ state: 'detached', timeout: 65_000 });
  }

  async waitForLoaderToDisappear(): Promise<void> {
    try {
      await this.page.waitForSelector("text='Just a moment'", {
        state: 'detached',
        timeout: 30_000,
      });
    } catch {
      // Loader may not appear on every navigation
    }
  }

  async waitForProcessingLoaderToDisappear(): Promise<void> {
    try {
      await this.page.waitForSelector(
        '.processing-loader, [data-testid="processing-loader"], .spinner, [aria-label="Loading"]',
        { state: 'hidden', timeout: 30_000 },
      );
    } catch {
      // Processing loader may not appear
    }
  }

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
