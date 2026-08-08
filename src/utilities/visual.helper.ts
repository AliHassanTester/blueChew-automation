import { Page, TestInfo } from '@playwright/test';
import { captureApplitoolsVisualCheckpoint } from './applitools.utils';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

export type { ApplitoolsVisualConfig };

export class VisualHelper {
  constructor(private readonly page: Page, private readonly testInfo: TestInfo) {}

  /**
   * Captures a visual snapshot checkpoint via Applitools.
   */
  async captureApplitoolsCheckpoint(
    checkpointName: string,
    visualConfig: ApplitoolsVisualConfig,
  ): Promise<void> {
    await captureApplitoolsVisualCheckpoint(this.page, visualConfig, checkpointName);
  }

  /**
   * Generic checkpoint capture method. Auto-routes to Applitools if API key is set.
   */
  async captureCheckpoint(checkpointName: string, visualConfig?: ApplitoolsVisualConfig): Promise<void> {
    await captureApplitoolsVisualCheckpoint(this.page, visualConfig, checkpointName);
  }

  async close(): Promise<void> {
    // Teardown hook
  }
}
