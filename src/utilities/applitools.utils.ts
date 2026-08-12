import { Page } from '@playwright/test';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

export type { ApplitoolsVisualConfig };

/**
 * Common centralized utility to capture visual checkpoints using Applitools Eyes.
 * Disabled until finalized.
 */
export async function captureApplitoolsVisualCheckpoint(
  _page: Page,
  _visualConfigs?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[],
  _checkpointTag?: string,
): Promise<void> {
  // Applitools helper disabled until finalized
  return Promise.resolve();
}
