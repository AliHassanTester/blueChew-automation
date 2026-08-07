import { Page } from '@playwright/test';
import { VisualHelper, ApplitoolsVisualConfig } from './visual.helper';

export async function captureApplitoolsVisual(
  visual: VisualHelper,
  page: Page,
  checkpointName: string,
  visualConfig: ApplitoolsVisualConfig,
): Promise<void> {
  await visual.captureApplitoolsCheckpoint(checkpointName, visualConfig);
}
