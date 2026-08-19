import { Page, TestInfo } from '@playwright/test';
import { captureApplitoolsVisualCheckpoint } from './applitools.utils';
import { capturePercyVisualCheckpoint } from './percy.utils';
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
   * Captures a visual snapshot checkpoint via Percy.
   */
  async capturePercyCheckpoint(
    checkpointName: string,
    options?: any,
  ): Promise<void> {
    await capturePercyVisualCheckpoint(this.page, checkpointName, this.testInfo, options);
  }

  /**
   * Dynamic checkpoint capture method. Auto-routes to active providers specified in VISUAL_PROVIDERS env.
   * Active providers default to: percy, applitools.
   */
  async captureCheckpoint(checkpointName: string, visualConfig?: ApplitoolsVisualConfig): Promise<void> {
    const rawProviders = process.env.VISUAL_PROVIDERS || 'percy,applitools';
    const providers = rawProviders.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

    if (providers.includes('applitools')) {
      await captureApplitoolsVisualCheckpoint(this.page, visualConfig, checkpointName);
    }

    if (providers.includes('percy')) {
      await capturePercyVisualCheckpoint(this.page, checkpointName, this.testInfo);
    }
  }

  async close(): Promise<void> {
    // Teardown hook
  }
}
