import { defineConfig, devices } from '@playwright/test';
import type { EyesFixture } from '@applitools/eyes-playwright/fixture';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Fully isolated config for verifying the Applitools MCP server — does not touch
// or inherit from the project's root playwright.config.ts / page.fixtures.ts.
dotenv.config({ path: path.resolve(__dirname, '..', '.env.dev') });

export default defineConfig<EyesFixture>({
  testDir: __dirname,
  timeout: 120_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.resolve(__dirname, 'eyes-playwright-report'), open: 'never' }],
    ['@applitools/eyes-playwright/reporter'],
  ],
  use: {
    eyesConfig: {
      apiKey: process.env.APPLITOOLS_API_KEY,
      batch: { name: 'Applitools MCP - Isolated Verification' },
      type: 'ufg',
      testConcurrency: 5,
      browsersInfo: [
        { name: 'chrome', width: 1200, height: 800 },
        { name: 'firefox', width: 1200, height: 800 },
        { chromeEmulationInfo: { deviceName: 'Pixel 5' } },
      ],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
