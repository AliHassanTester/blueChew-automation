import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

// ENV_TYPE is set by the npm script (cross-env ENV_TYPE=dev) before this config
// runs, so the correct .env file is loaded before any test data file initialises.
const envType = process.env.ENV_TYPE || 'dev';
dotenv.config({ path: `.env.${envType}` });

const baseURLs: Record<string, string> = {
  dev: 'https://dev.app.bluechew.com',
  prod: 'https://app.bluechew.com',
  ci: 'https://dev.app.bluechew.com',
  demo: 'https://demo.app.bluechew.com',
};

export default defineConfig({
  testDir: '.',
  testMatch: ['src/specs/**/*.spec.ts', 'tests/visual/**/*.visual.spec.ts'],
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
    ['list'],
  ],
  use: {
    baseURL: baseURLs[envType] ?? baseURLs['dev'],
    viewport: { width: 1280, height: 720 },
    headless: !!process.env.CI,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-functional',
      testMatch: 'src/specs/**/*.spec.ts',
      use: { browserName: 'chromium' },
    },
    {
      name: 'chromium-visual',
      testMatch: 'tests/visual/**/*.visual.spec.ts',
      use: { browserName: 'chromium' },
      snapshotPathTemplate: '{testDir}/{testFileDir}/__snapshots__/{testFileName}/{arg}{ext}',
    },
  ],
});
