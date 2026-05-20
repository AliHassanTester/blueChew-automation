import * as fs from 'fs';
import type { FullConfig } from '@playwright/test';
import { saveAdminAuthState, AUTH_STATE_FILES } from '../helpers/auth.helper';
import { Logger } from '../utils/logger.utils';
import { appConfig } from '../config/environment.config';
import { ensureDir } from '../helpers/file.helper';

const logger = new Logger('GlobalSetup');

/**
 * Runs once before the entire test suite.
 *
 * Responsibilities:
 *  1. Log the active environment and configuration
 *  2. Pre-authenticate admin and user sessions via API and persist the state
 *     so individual tests can skip the login UI entirely
 *  3. Ensure runtime output directories exist
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  logger.info('═══════════════════════════════════════════════');
  logger.info('  Enterprise Playwright Framework — Global Setup');
  logger.info('═══════════════════════════════════════════════');
  logger.info(`Environment : ${appConfig.environment}`);
  logger.info(`App URL     : ${appConfig.baseUrl}`);
  logger.info('───────────────────────────────────────────────');

  // Ensure output directories exist before tests run
  for (const dir of ['logs', 'screenshots', 'videos', 'traces', 'playwright-auth']) {
    ensureDir(dir);
  }

  // Pre-authenticate so tests don't need to log in via the UI.
  // Skip if state file is already present — avoids hammering the site on every run.
  // Delete playwright-auth/admin.json to force a refresh.
  const stateExists = fs.existsSync(AUTH_STATE_FILES.admin);
  if (stateExists) {
    logger.info('Auth state already present — skipping browser login.');
    // Mirror admin state to user state (same account)
    fs.copyFileSync(AUTH_STATE_FILES.admin, AUTH_STATE_FILES.user);
  } else {
    try {
      await saveAdminAuthState();
      // Both admin and user use the same account — reuse the same state file
      fs.copyFileSync(AUTH_STATE_FILES.admin, AUTH_STATE_FILES.user);
    } catch (error) {
      logger.warn('Auth state setup failed — tests that require authentication will fail.', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info('Global setup complete');
}

export default globalSetup;
