import type { Environment } from '../enums/environment.enum';

export interface Credentials {
  adminEmail: string;
  adminPassword: string;
  userEmail: string;
  userPassword: string;
}

export interface AppConfig {
  environment: Environment;
  baseUrl: string;
  apiBaseUrl: string;
  timeout: number;
  retries: number;
  headless: boolean;
  credentials: Credentials;
  slackWebhookUrl: string;
  databaseUrl: string;
}
