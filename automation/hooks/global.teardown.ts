import type { FullConfig } from '@playwright/test';
import { Logger } from '../utils/logger.utils';
import { pruneOldFiles } from '../helpers/file.helper';
import { formatDuration } from '../utils/date.utils';

const logger = new Logger('GlobalTeardown');
const suiteStartTime = Date.now();

/**
 * Runs once after the entire test suite.
 *
 * Responsibilities:
 *  1. Log total suite duration
 *  2. Prune old screenshots to prevent unbounded disk growth
 */
async function globalTeardown(_config: FullConfig): Promise<void> {
  const duration = formatDuration(Date.now() - suiteStartTime);
  logger.info('═══════════════════════════════════════════════');
  logger.info(`  Global Teardown — suite duration: ${duration}`);
  logger.info('═══════════════════════════════════════════════');

  // Keep only the newest 50 screenshots; older ones are attached to the
  // Playwright report anyway so disk copies are just for manual inspection.
  pruneOldFiles('screenshots', 50);

  logger.info('Global teardown complete');
}

export default globalTeardown;
