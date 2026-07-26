import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

// ENV_TYPE is set by the npm script (cross-env ENV_TYPE=dev) before this config
// runs, so the correct .env file is loaded before any test data file initialises.
const envType = process.env.ENV_TYPE || 'dev';
dotenv.config({ path: `.env.${envType}` });

const baseURLs: Record<string, string> = {
  dev: 'https://dev.app.bluechew.com',
  prod: 'https://app.bluechew.com',
};

const desktopViewport = { width: 1440, height: 900 };
const mobileViewport = { width: 393, height: 852 };

const reporters: Array<readonly [string] | readonly [string, Record<string, unknown>]> = [
  ['@applitools/eyes-playwright/reporter', { outputFolder: 'playwright-report', open: 'never' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['allure-playwright', {
    resultsDir: 'allure-results',
    detail: true,
    environmentInfo: {
      Environment: envType,
      Base_URL: baseURLs[envType] ?? baseURLs['dev'],
      Node_Version: process.version,
      OS: `${process.platform} ${process.arch}`,
      CI: process.env.CI ? 'true' : 'false',
    },
    categories: [
      {
        name: 'Timeouts',
        matchedStatuses: ['broken', 'failed'],
        messageRegex: '.*Timeout.*exceeded.*',
      },
      {
        name: 'Network / connection issues',
        matchedStatuses: ['broken', 'failed'],
        messageRegex: '.*(net::|ECONNREFUSED|ERR_|ENOTFOUND).*',
      },
      {
        name: 'Element not found / not visible',
        matchedStatuses: ['broken', 'failed'],
        messageRegex: '.*(locator|waiting for|not visible|outside of the viewport).*',
      },
      {
        name: 'Assertion failures (product defects)',
        matchedStatuses: ['failed'],
        messageRegex: '.*(expect|toHaveLength|toBe|toEqual|toContain).*',
      },
      {
        name: 'Ignored / skipped tests',
        matchedStatuses: ['skipped'],
      },
    ],
  }],
  ['list'],
];

export default defineConfig({
  testDir: '.',
  testMatch: ['src/specs/**/*.spec.ts'],
  // Per-test ceiling — the maximum wall-clock time any single test may run before
  // it is force-failed. The full onboarding flow legitimately runs ~10 min, so this
  // is a generous last-resort safety net; individual stuck actions are caught much
  // sooner by actionTimeout / navigationTimeout below.
  timeout: 900_000,
  // Web-first assertion timeout — expect(locator).toBeVisible(), toHaveText(), etc.
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : 1,
  reporter: reporters,
  use: {
    baseURL: baseURLs[envType] ?? baseURLs['dev'],
    // The dev app domain is behind HTTP auth; Playwright answers the 401 challenge
    // on every context automatically, so no per-test auth step is needed.
    httpCredentials: {
      username: process.env.HTTP_AUTH_USERNAME || '',
      password: process.env.HTTP_AUTH_PASSWORD || '',
    },
    headless: !!process.env.CI,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // Default timeout for a single action (click, fill, selectOption, check…)
    // when no explicit timeout is passed — stops a stuck element from hanging
    // until the per-test ceiling. Explicit waitFor({ timeout }) calls override this.
    actionTimeout: 30_000,
    // Default timeout for navigations (goto, waitForURL, waitForLoadState).
    // The Angular SPA + dev-gate redirects can be slow, so this is more generous.
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      testMatch: 'src/specs/**/*.spec.ts',
      use: {
        browserName: 'chromium',
        viewport: desktopViewport,
      },
    },
    {
      name: 'chromium-mobile',
      testMatch: 'src/specs/**/*.spec.ts',
      use: {
        browserName: 'chromium',
        viewport: mobileViewport,
      },
    },
  ],
  grep: process.env.APPLITOOLS_ENABLED === 'true' ? /@visual/ : undefined,
});
