/**
 * Resolves multiple environment variables in one call.
 *
 * - Pass `null` for a required variable — throws if missing.
 * - Pass a string for an optional variable with a fallback.
 *
 * Collects ALL missing required vars before throwing so a single run
 * surfaces the full list rather than one variable at a time.
 *
 * @example
 * const env = getEnvVars({ user_name: null, password: null, BASE_URL: 'https://default.com' });
 * // env.user_name and env.password are guaranteed non-empty strings
 */
export function getEnvVars<T extends Record<string, string | null>>(
  vars: T,
): { [K in keyof T]: string } {
  const result = {} as { [K in keyof T]: string };
  const missing: string[] = [];

  for (const [key, fallback] of Object.entries(vars) as [keyof T & string, string | null][]) {
    const value = process.env[key];
    if (value) {
      result[key] = value;
    } else if (fallback !== null) {
      result[key] = fallback;
    } else {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        `Load your .env file before running tests (e.g. npx dotenv -e .env.dev -- npx playwright test).`,
    );
  }

  return result;
}

export function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable "${key}" is not set.`);
  }
  return value;
}

export function isDemoEnv(): boolean {
  return process.env.ENV_TYPE === 'demo';
}

export function isDevEnv(): boolean {
  return process.env.ENV_TYPE === 'dev';
}

export function isProdEnv(): boolean {
  return process.env.ENV_TYPE === 'prod';
}

export function isCIEnv(): boolean {
  return process.env.ENV_TYPE === 'ci' || !!process.env.CI;
}
