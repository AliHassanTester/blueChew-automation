import { Page, TestInfo } from '@playwright/test';
import { LocatorInfo } from '@interfaces/locator.info.interface';

export class PlaywrightActionFactory {
  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  async click(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Action] Clicking on "${locatorInfo.description}"`);
    await locatorInfo.locator.click();
  }

  async forceClick(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Action] Force clicking on "${locatorInfo.description}"`);
    await locatorInfo.locator.click({ force: true });
  }

  async doubleClick(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Action] Double clicking on "${locatorInfo.description}"`);
    await locatorInfo.locator.dblclick();
  }

  async sendKeys(locatorInfo: LocatorInfo, value: string): Promise<void> {
    const displayValue = locatorInfo.description.toLowerCase().includes('password') ? '****' : value;
    console.log(`[Action] Typing "${displayValue}" into "${locatorInfo.description}"`);
    await locatorInfo.locator.fill(value);
  }

  async sendKeysSequentially(locatorInfo: LocatorInfo, value: string): Promise<void> {
    const displayValue = locatorInfo.description.toLowerCase().includes('password') ? '****' : value;
    console.log(`[Action] Typing sequentially "${displayValue}" into "${locatorInfo.description}"`);
    await locatorInfo.locator.pressSequentially(value);
  }

  async clearText(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Action] Clearing text from "${locatorInfo.description}"`);
    await locatorInfo.locator.selectText();
    await locatorInfo.locator.press('Backspace');
  }

  async pressKey(locatorInfo: LocatorInfo, key: string): Promise<void> {
    console.log(`[Action] Pressing key "${key}" on "${locatorInfo.description}"`);
    await locatorInfo.locator.press(key);
  }

  async selectRadioButtonOrCheckBox(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Action] Checking "${locatorInfo.description}"`);
    await locatorInfo.locator.check();
  }

  async deSelectRadioButtonOrCheckBox(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Action] Unchecking "${locatorInfo.description}"`);
    await locatorInfo.locator.uncheck();
  }

  async selectFromDropdown(locatorInfo: LocatorInfo, optionText: string): Promise<void> {
    console.log(`[Action] Selecting "${optionText}" from dropdown "${locatorInfo.description}"`);
    await locatorInfo.locator.selectOption({ label: optionText });
  }

  async searchAndSelect(locatorInfo: LocatorInfo, text: string, type?: string): Promise<void> {
    console.log(`[Action] Searching and selecting "${text}" in "${locatorInfo.description}"`);
    await locatorInfo.locator.fill(text);
    const dropdownOption = this.page.locator(`//li[normalize-space()='${text}'] | //option[normalize-space()='${text}']`).first();
    await dropdownOption.click();
  }

  async navigateToURL(url: string): Promise<void> {
    console.log(`[Action] Navigating to URL: "${url}"`);
    await this.page.goto(url);
  }

  /**
   * Clicks the first visible, enabled element matching the selector.
   * Playwright auto-waits for actionability (visible + stable + enabled) using the
   * centralized actionTimeout, so callers don't need manual poll loops or settling
   * delays — this replaces the "iterate buttons, find visible+enabled, click" pattern.
   */
  async clickFirstActionable(selector: string): Promise<void> {
    console.log(`[Action] Clicking first actionable element matching selector: "${selector}"`);
    await this.page.locator(selector).filter({ visible: true }).first().click();
  }

  async waitForSelector(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Action] Waiting for "${locatorInfo.description}" to be attached`);
    await locatorInfo.locator.waitFor({ state: 'attached' });
  }

  async waitForVisibility(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Action] Waiting for "${locatorInfo.description}" to be visible`);
    await locatorInfo.locator.waitFor({ state: 'visible' });
  }

  async waitForURL(regex: RegExp): Promise<void> {
    console.log(`[Action] Waiting for URL matching: ${regex}`);
    await this.page.waitForURL(regex);
  }

  async waitForDomLoad(): Promise<void> {
    console.log('[Action] Waiting for DOMContentLoaded');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForSec(seconds: number): Promise<void> {
    console.log(`[Action] Waiting for ${seconds} second(s)`);
    await this.page.waitForTimeout(seconds * 1000);
  }

  async scrollIntoView(locatorInfo: LocatorInfo): Promise<void> {
    console.log(`[Action] Scrolling into view: "${locatorInfo.description}"`);
    await locatorInfo.locator.scrollIntoViewIfNeeded();
  }

  async scrollUntilVisible(
    locatorInfo: LocatorInfo,
    options?: { direction?: 'up' | 'down'; maxScrolls?: number },
  ): Promise<void> {
    console.log(`[Action] Scrolling until "${locatorInfo.description}" is visible`);
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
    console.log(`[Action] Hovering over "${locatorInfo.description}"`);
    await locatorInfo.locator.hover();
  }

  async getText(locatorInfo: LocatorInfo): Promise<string> {
    console.log(`[Action] Getting text from "${locatorInfo.description}"`);
    return (await locatorInfo.locator.textContent()) ?? '';
  }

  async getInputValue(locatorInfo: LocatorInfo): Promise<string> {
    console.log(`[Action] Getting input value from "${locatorInfo.description}"`);
    return locatorInfo.locator.inputValue();
  }

  async verifyText(locatorInfo: LocatorInfo, expected: string): Promise<void> {
    console.log(`[Action] Verifying text in "${locatorInfo.description}" contains "${expected}"`);
    const actual = await this.getText(locatorInfo);
    if (!actual.includes(expected)) {
      this.testInfo.annotations.push({
        type: 'Soft Assertion Failure',
        description: `"${locatorInfo.description}" expected to contain "${expected}" but got "${actual}"`,
      });
    }
  }

  async embedFullPageScreenshot(description: string): Promise<void> {
    console.log(`[Action] Embedding full page screenshot: "${description}"`);
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.testInfo.attach(description, { body: screenshot, contentType: 'image/png' });
  }

  async refreshBrowser(): Promise<void> {
    console.log('[Action] Refreshing browser page');
    await this.page.reload();
  }

  async uploadFile(locatorInfo: LocatorInfo, filePath: string): Promise<void> {
    console.log(`[Action] Uploading file "${filePath}" to "${locatorInfo.description}"`);
    await locatorInfo.locator.setInputFiles(filePath);
  }

  async dragAndDrop(source: LocatorInfo, target: LocatorInfo): Promise<void> {
    console.log(`[Action] Dragging "${source.description}" to "${target.description}"`);
    await source.locator.dragTo(target.locator);
  }
}
