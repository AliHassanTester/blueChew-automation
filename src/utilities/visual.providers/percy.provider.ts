import { Page, TestInfo } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import { IVisualProvider } from './visual.provider.interface';

export class PercyProvider implements IVisualProvider {
  public readonly name = 'percy';

  async initialize(_page: Page, _testInfo?: TestInfo): Promise<void> {
    // Percy uses the CLI wrapper; nothing to initialize here.
    return;
  }

  async snapshot(page: Page, snapshotName: string, options?: any): Promise<void> {
    await percySnapshot(page, snapshotName, options);
  }

  async close(): Promise<void> {
    return;
  }
}
