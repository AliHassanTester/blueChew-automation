import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

export const AUTH_FILE_PATH = path.resolve(process.cwd(), '.auth/user.json');

export default async function globalSetup(config: FullConfig) {
  const envType = process.env.ENV_TYPE || 'dev';
  dotenv.config({ path: `.env.${envType}` });

  const authDir = path.dirname(AUTH_FILE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const username = process.env.user_name || 'ali@meds.com';
  const password = process.env.password || 'certa@123';
  const baseURL = envType === 'prod' ? 'https://app.bluechew.com' : 'https://dev.app.bluechew.com';

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL,
    httpCredentials: {
      username: process.env.HTTP_AUTH_USERNAME || 'bluechew',
      password: process.env.HTTP_AUTH_PASSWORD || 'dev',
    },
    permissions: ['camera', 'microphone'],
  });

  const page = await context.newPage();

  try {
    console.log(`[global-setup] Pre-authenticating session for: ${username}`);
    await page.goto('/log-in', { waitUntil: 'domcontentloaded', timeout: 30000 });

    const emailInput = page
      .locator("//input[@data-test-id='sign-in-email-input'] | //input[@type='email'] | //input[@placeholder='Email your email']")
      .first();
    const passwordInput = page
      .locator("//input[@data-test-id='sign-in-password-input'] | //input[@type='password']")
      .first();
    const submitButton = page
      .locator("//button[@data-test-id='sign-in-submit-button'] | //button[normalize-space()='CONTINUE']")
      .first();

    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(username);
    await passwordInput.fill(password);
    await submitButton.click();

    // Wait for redirect into the account area
    await page.waitForURL(/\/account\//, { timeout: 25000 }).catch(() => undefined);
    await page.waitForLoadState('load').catch(() => undefined);

    await context.storageState({ path: AUTH_FILE_PATH });
    console.log(`[global-setup] Successfully saved storageState to: ${AUTH_FILE_PATH}`);
  } catch (error) {
    console.error('[global-setup] Authentication failed, writing fallback state:', error);
    if (!fs.existsSync(AUTH_FILE_PATH)) {
      fs.writeFileSync(AUTH_FILE_PATH, JSON.stringify({ cookies: [], origins: [] }));
    }
  } finally {
    await browser.close();
  }
}
