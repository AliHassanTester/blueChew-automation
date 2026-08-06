import { Page, TestInfo } from '@playwright/test';

export interface IVisualProvider {
  name: string;
  initialize?(page: Page, testInfo?: TestInfo): Promise<void>;
  snapshot(page: Page, snapshotName: string, options?: unknown): Promise<void>;
  close?(): Promise<void>;
}

export type VisualProviderCtor = new (...args: any[]) => IVisualProvider;
