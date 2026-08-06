import { Page } from '@playwright/test';
import { IVisualProvider } from './visual.provider.interface';

// UIProbe adapter — placeholder implementation. Replace with real SDK calls when available.
export class UIProbeProvider implements IVisualProvider {
  public readonly name = 'uiprobe';

  async initialize(_page: Page): Promise<void> {
    // No-op: implement SDK init here when installing UIProbe
  }

  async snapshot(_page: Page, snapshotName: string): Promise<void> {
    // Placeholder: integrate UIProbe SDK snapshot call here
    // For now, just write a debug annotation or noop
    return;
  }

  async close(): Promise<void> {
    return;
  }
}
