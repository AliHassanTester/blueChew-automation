import { Page, TestInfo } from '@playwright/test';
import { Eyes } from '@applitools/eyes-playwright';

export interface ApplitoolsVisualHelper {
  isEnabled(): boolean;
  openEyes(flowName: string, appName?: string): Promise<void>;
  checkWindow(name?: string): Promise<void>;
  closeEyes(): Promise<void>;
  captureCheckpoint(flowName: string, checkpointName: string, appName?: string): Promise<void>;
  runVisualStep<T>(flowName: string, checkpointName: string, action: () => Promise<T>, appName?: string): Promise<T>;
}

class ApplitoolsVisualHelperImpl implements ApplitoolsVisualHelper {
  private eyes: Eyes | null = null;
  private isOpen = false;

  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  isEnabled(): boolean {
    return this.getEnabledFlag() && !!this.getApiKey();
  }

  async openEyes(flowName: string, appName?: string): Promise<void> {
    if (!this.isEnabled() || this.eyes) {
      return;
    }

    const eyes = new Eyes();
    eyes.setApiKey(this.getApiKey());
    eyes.setBatch(this.getBatchName(), this.getBatchId());
    eyes.setAppName(appName || this.getAppName());
    eyes.setTestName(this.buildTestName(flowName));

    await eyes.open(this.page);
    this.eyes = eyes;
    this.isOpen = true;
  }

  async checkWindow(name?: string): Promise<void> {
    if (!this.eyes || !this.isOpen) {
      return;
    }

    await this.eyes.checkWindow(name || 'window');
  }

  async closeEyes(): Promise<void> {
    if (!this.eyes || !this.isOpen) {
      return;
    }

    try {
      await this.eyes.close(false);
    } finally {
      this.eyes = null;
      this.isOpen = false;
    }
  }

  async captureCheckpoint(flowName: string, checkpointName: string, appName?: string): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    await this.openEyes(flowName, appName);
    await this.checkWindow(checkpointName);
    await this.closeEyes();
  }

  async runVisualStep<T>(flowName: string, checkpointName: string, action: () => Promise<T>, appName?: string): Promise<T> {
    if (!this.isEnabled()) {
      return action();
    }

    await this.openEyes(flowName, appName);
    try {
      const result = await action();
      await this.checkWindow(checkpointName);
      return result;
    } finally {
      await this.closeEyes();
    }
  }

  private getEnabledFlag(): boolean {
    return process.env.APPLITOOLS_ENABLED?.toLowerCase() === 'true';
  }

  private getApiKey(): string {
    return process.env.APPLITOOLS_API_KEY || '';
  }

  private getAppName(): string {
    return process.env.APPLITOOLS_APP_NAME || 'BlueChew Automation';
  }

  private getBatchName(): string {
    return process.env.APPLITOOLS_BATCH_NAME || `BlueChew ${process.env.ENV_TYPE || 'dev'}`;
  }

  private getBatchId(): string {
    return `${process.env.ENV_TYPE || 'dev'}-${Date.now()}`;
  }

  private buildTestName(flowName: string): string {
    const suiteName = this.testInfo.titlePath?.slice(0, -1).join(' > ') || this.testInfo.title;
    return `${suiteName} - ${flowName}`;
  }
}

export function createApplitoolsVisualHelper(page: Page, testInfo: TestInfo): ApplitoolsVisualHelper {
  return new ApplitoolsVisualHelperImpl(page, testInfo);
}
