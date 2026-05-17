import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Resolve and load the correct .env file before the config is evaluated.
// playwright.config.ts intentionally reads env vars directly to stay
// self-contained and avoid a circular dependency with environment.config.ts.
const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFile = nodeEnv === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
const headless = process.env.HEADLESS !== 'false';
const defaultTimeout = parseInt(process.env.DEFAULT_TIMEOUT ?? '30000', 10);
const retries = isCI ? 2 : parseInt(process.env.TEST_RETRIES ?? '1', 10);
const workers = isCI ? 4 : undefined; // undefined = logical CPU count in local mode

export default defineConfig({
  testDir: './tests',

  // Run tests in each file in parallel; files run sequentially by default
  fullyParallel: true,

  // Fail the CI build if test.only is accidentally committed
  forbidOnly: isCI,

  retries,
  workers,
  timeout: defaultTimeout,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    [
      'allure-playwright',
      {
        outputFolder: 'allure-results',
        suiteTitle: false,
        environmentInfo: {
          Environment: nodeEnv,
          BaseURL: baseURL,
          Node: process.version,
          Platform: process.platform,
        },
      },
    ],
    ['./reporters/custom.reporter.ts'],
    ...(isCI
      ? ([['junit', { outputFile: 'test-results/junit.xml' }]] as [string, Record<string, string>][])
      : []),
  ],

  use: {
    baseURL,
    headless,

    // Capture artefacts only on failure to keep storage lean
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    // Granular timeouts — this is a slow Angular SPA (15-20s cold load)
    actionTimeout: 15_000,
    navigationTimeout: 60_000,

    locale: 'en-US',
    timezoneId: 'America/New_York',

    // Tag every automated request so server logs can distinguish test traffic
    extraHTTPHeaders: {
      'x-automated-test': 'true',
      'x-framework-version': '1.0.0',
    },
  },

  projects: [
    // ── Desktop browsers ──────────────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },

    // ── Mobile viewports ──────────────────────────────────────────────────
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  outputDir: 'test-results',

  expect: {
    // Assertion timeout — distinct from action/navigation timeouts
    timeout: 10_000,

    toHaveScreenshot: {
      // Tolerance for anti-aliasing and sub-pixel rendering differences.
      // Visual tests run on Chromium only (set via test.use) so cross-browser
      // rendering variance is not a factor.
      maxDiffPixels: 150,
      threshold: 0.2,
      // Animations are disabled per-test via disableAnimations() in visual.helper.ts
      animations: 'disabled',
    },

    toMatchSnapshot: {
      maxDiffPixelRatio: 0.02,
    },
  },

  // Baseline snapshots live alongside the spec files in __snapshots__ dirs.
  // To regenerate after intentional UI changes: npx playwright test --update-snapshots

  globalSetup: './hooks/global.setup.ts',
  globalTeardown: './hooks/global.teardown.ts',
});
