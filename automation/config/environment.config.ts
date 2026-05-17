import * as dotenv from 'dotenv';
import * as path from 'path';
import { Environment } from '../enums/environment.enum';
import type { AppConfig } from '../interfaces/config.interface';

/**
 * Resolves the correct .env file and constructs a typed AppConfig object.
 * Called once at module load time so every import shares the same instance.
 */
function loadConfig(): AppConfig {
  const rawEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();

  // Map NODE_ENV values to their corresponding .env file names
  const envFileMap: Record<string, string> = {
    [Environment.DEVELOPMENT]: '.env.dev',
    [Environment.PRODUCTION]: '.env.prod',
    [Environment.QA]: '.env.qa',
    [Environment.STAGING]: '.env.staging',
    [Environment.UAT]: '.env.uat',
  };

  const envFile = envFileMap[rawEnv] ?? '.env.dev';

  // dotenv.config is idempotent — safe to call multiple times; later calls
  // won't overwrite values already set (e.g. by the CI environment).
  dotenv.config({ path: path.resolve(process.cwd(), envFile) });

  const environment = Object.values(Environment).includes(rawEnv as Environment)
    ? (rawEnv as Environment)
    : Environment.DEVELOPMENT;

  return {
    environment,
    baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
    apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3001',
    timeout: parseInt(process.env.DEFAULT_TIMEOUT ?? '30000', 10),
    retries: parseInt(process.env.TEST_RETRIES ?? '1', 10),
    headless: process.env.HEADLESS !== 'false',
    credentials: {
      adminEmail: process.env.ADMIN_EMAIL ?? '',
      adminPassword: process.env.ADMIN_PASSWORD ?? '',
      userEmail: process.env.USER_EMAIL ?? '',
      userPassword: process.env.USER_PASSWORD ?? '',
    },
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL ?? '',
    databaseUrl: process.env.DATABASE_URL ?? '',
  };
}

export const appConfig: AppConfig = loadConfig();
