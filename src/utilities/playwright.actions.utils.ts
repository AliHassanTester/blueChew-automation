import { Page, TestInfo } from '@playwright/test';
import { LocatorInfo } from '@interfaces/locator.info.interface';

export class PlaywrightActionFactory {
  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  async click(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.click();
  }

  async forceClick(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.click({ force: true });
  }

  async doubleClick(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.dblclick();
  }

  async sendKeys(locatorInfo: LocatorInfo, value: string): Promise<void> {
    await locatorInfo.locator.fill(value);
  }

  async sendKeysSequentially(locatorInfo: LocatorInfo, value: string): Promise<void> {
    await locatorInfo.locator.pressSequentially(value);
  }

  async clearText(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.selectText();
    await locatorInfo.locator.press('Backspace');
  }

  async pressKey(locatorInfo: LocatorInfo, key: string): Promise<void> {
    await locatorInfo.locator.press(key);
  }

  async selectRadioButtonOrCheckBox(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.check();
  }

  async deSelectRadioButtonOrCheckBox(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.uncheck();
  }

  async selectFromDropdown(locatorInfo: LocatorInfo, optionText: string): Promise<void> {
    await locatorInfo.locator.selectOption({ label: optionText });
  }

  async searchAndSelect(locatorInfo: LocatorInfo, text: string, type?: string): Promise<void> {
    await locatorInfo.locator.fill(text);
    const dropdownOption = this.page.locator(`//li[normalize-space()='${text}'] | //option[normalize-space()='${text}']`).first();
    await dropdownOption.click();
  }

  async navigateToURL(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async waitForSelector(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.waitFor({ state: 'attached', timeout: 65_000 });
  }

  async waitForVisibility(locatorInfo: LocatorInfo, timeout: number = 65_000): Promise<void> {
    await locatorInfo.locator.waitFor({ state: 'visible', timeout });
  }

  async waitForURL(regex: RegExp, timeout: number = 30_000): Promise<void> {
    await this.page.waitForURL(regex, { timeout });
  }

  async waitForDomLoad(timeout: number = 30_000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout });
  }

  async waitForSec(seconds: number): Promise<void> {
    await this.page.waitForTimeout(seconds * 1000);
  }

  async scrollIntoView(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.scrollIntoViewIfNeeded();
  }

  async scrollUntilVisible(
    locatorInfo: LocatorInfo,
    options?: { direction?: 'up' | 'down'; maxScrolls?: number },
  ): Promise<void> {
    const direction = options?.direction ?? 'down';
    const maxScrolls = options?.maxScrolls ?? 20;
    for (let i = 0; i < maxScrolls; i++) {
      const isVisible = await locatorInfo.locator.isVisible();
      if (isVisible) return;
      await this.page.keyboard.press(direction === 'down' ? 'PageDown' : 'PageUp');
      await this.page.waitForTimeout(300);
    }
  }

  async mouseHover(locatorInfo: LocatorInfo): Promise<void> {
    await locatorInfo.locator.hover();
  }

  async getText(locatorInfo: LocatorInfo): Promise<string> {
    return (await locatorInfo.locator.textContent()) ?? '';
  }

  async getInputValue(locatorInfo: LocatorInfo): Promise<string> {
    return locatorInfo.locator.inputValue();
  }

  async verifyText(locatorInfo: LocatorInfo, expected: string): Promise<void> {
    const actual = await this.getText(locatorInfo);
    if (!actual.includes(expected)) {
      this.testInfo.annotations.push({
        type: 'Soft Assertion Failure',
        description: `"${locatorInfo.description}" expected to contain "${expected}" but got "${actual}"`,
      });
    }
  }

  async embedFullPageScreenshot(description: string): Promise<void> {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.testInfo.attach(description, { body: screenshot, contentType: 'image/png' });
  }

  async refreshBrowser(): Promise<void> {
    await this.page.reload();
  }

  async uploadFile(locatorInfo: LocatorInfo, filePath: string): Promise<void> {
    await locatorInfo.locator.setInputFiles(filePath);
  }

  async dragAndDrop(source: LocatorInfo, target: LocatorInfo): Promise<void> {
    await source.locator.dragTo(target.locator);
  }
}
