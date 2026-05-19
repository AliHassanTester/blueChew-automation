import { Locator } from '@playwright/test';

export interface LocatorInfo {
  description: string;
  locator: Locator;
}
