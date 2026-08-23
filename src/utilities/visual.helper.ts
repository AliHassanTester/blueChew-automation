import { Page, TestInfo } from '@playwright/test';
import { captureApplitoolsVisualCheckpoint, closeActiveEyes } from './applitools.utils';
import { capturePercyVisualCheckpoint } from './percy.utils';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

export type { ApplitoolsVisualConfig };

export class VisualHelper {
  constructor(private readonly page: Page, private readonly testInfo: TestInfo) {}

  async captureApplitoolsCheckpoint(name: string, config?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
    await captureApplitoolsVisualCheckpoint(this.page, config, name);
  }

  async capturePercyCheckpoint(name: string, options?: any): Promise<void> {
    await capturePercyVisualCheckpoint(this.page, name, this.testInfo, options);
  }

  /** Dynamic checkpoint capture. Auto-routes to active providers (defaults to percy, applitools). */
  async captureCheckpoint(name: string, config?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
    const providers = (process.env.VISUAL_PROVIDERS || 'percy,applitools').toLowerCase().split(',').map((s) => s.trim());
    if (providers.includes('applitools')) await captureApplitoolsVisualCheckpoint(this.page, config, name);
    if (providers.includes('percy')) await capturePercyVisualCheckpoint(this.page, name, this.testInfo, config);
  }

  async close(): Promise<void> {
    await closeActiveEyes();
  }
}
