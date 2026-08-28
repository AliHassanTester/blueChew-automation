import { Page } from '@playwright/test';
import { captureApplitoolsVisualCheckpoint, closeActiveEyes } from './applitools.utils';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

export type { ApplitoolsVisualConfig };

export class VisualHelper {
  constructor(private readonly page: Page) {}

  async captureApplitoolsCheckpoint(name: string, config?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
    await captureApplitoolsVisualCheckpoint(this.page, config, name);
  }

  /** Dynamic checkpoint capture. Auto-routes to active providers (defaults to applitools). */
  async captureCheckpoint(name: string, config?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
    const providers = (process.env.VISUAL_PROVIDERS || 'applitools').toLowerCase().split(',').map((s) => s.trim());
    if (providers.includes('applitools')) {
      await captureApplitoolsVisualCheckpoint(this.page, config, name);
    }
  }

  async close(): Promise<void> {
    await closeActiveEyes();
  }
}
