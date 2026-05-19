import * as fs from 'fs';
import * as path from 'path';
import { chromium } from '@playwright/test';
import type { Page } from '@playwright/test';
import { Logger } from '../utils/logger.utils';
import { appConfig } from '../config/environment.config';
import { ROUTES } from '../constants/routes.constants';
import { TIMEOUTS } from '../constants/timeouts.constants';

const AUTH_STATE_DIR = path.resolve(process.cwd(), 'playwright-auth');
const ADMIN_STATE_FILE = path.join(AUTH_STATE_DIR, 'admin.json');
const USER_STATE_FILE = path.join(AUTH_STATE_DIR, 'user.json');

const logger = new Logger('AuthHelper');

/**
 * Detects the dev environment gate page and submits the password if present.
 * The gate sets a session cookie so subsequent navigations in the same context
 * skip it automatically.
 */
export async function handleDevGateIfPresent(page: Page): Promise<void> {
  const password = process.env.DEV_GATE_PASSWORD;
  if (!password) return;

  const gateInput = page.locator('[data-test-id="dev-login-password-input"]');
  if (!(await gateInput.isVisible())) return;

  await gateInput.fill(password);
  await gateInput.press('Enter');
  await gateInput.waitFor({ state: 'detached', timeout: TIMEOUTS.NAVIGATION });
}

export const AUTH_STATE_FILES = {
  admin: ADMIN_STATE_FILE,
  user: USER_STATE_FILE,
} as const;

function ensureAuthDir(): void {
  if (!fs.existsSync(AUTH_STATE_DIR)) {
    fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });
  }
}

/**
 * Logs in via the BlueChew UI and persists the resulting session cookies as a
 * Playwright storageState file. This is the correct approach for Angular SPAs
 * that use httpOnly session cookies — you cannot inject tokens from an API call
 * because the cookies are set by the server during the browser-based login flow.
 *
 * The saved state is loaded by auth.fixture.ts so tests skip the login UI entirely.
 */
async function saveAuthState(email: string, password: string, statePath: string, label: string): Promise<void> {
  ensureAuthDir();
  logger.info(`Saving ${label} auth state via browser login...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    await page.goto(`${appConfig.baseUrl}${ROUTES.LOGIN}`, {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUTS.NAVIGATION,
    });

    await handleDevGateIfPresent(page);

    // Wait for the Angular form to render (no data-testids — use native input types)
    await page.locator('input[type="email"]').waitFor({ state: 'visible', timeout: TIMEOUTS.NAVIGATION });
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to account/membership — the post-login landing page
    await page.waitForURL((url) => url.pathname.includes('/account/'), {
      timeout: TIMEOUTS.NAVIGATION,
    });

    await context.storageState({ path: statePath });
    logger.info(`${label} auth state saved → ${statePath}`);
  } finally {
    await browser.close();
  }
}

export async function saveAdminAuthState(): Promise<void> {
  await saveAuthState(
    appConfig.credentials.adminEmail,
    appConfig.credentials.adminPassword,
    ADMIN_STATE_FILE,
    'admin',
  );
}

export async function saveUserAuthState(): Promise<void> {
  await saveAuthState(
    appConfig.credentials.userEmail,
    appConfig.credentials.userPassword,
    USER_STATE_FILE,
    'user',
  );
}
