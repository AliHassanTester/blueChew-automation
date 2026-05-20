import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import { Logger } from '../utils/logger.utils';
import { formatDuration } from '../utils/date.utils';

interface SuiteStats {
  passed: number;
  failed: number;
  skipped: number;
  timedOut: number;
  total: number;
  startTime: number;
}

/**
 * Custom reporter that:
 *  • Writes structured Winston logs alongside Playwright's built-in reporters
 *  • Tracks per-suite statistics
 *  • Prints a coloured summary table at the end of the run
 *
 * Registered in playwright.config.ts as: ['./reporters/custom.reporter.ts']
 */
class CustomReporter implements Reporter {
  private readonly logger = new Logger('TestRun');
  private readonly stats: SuiteStats = {
    passed: 0,
    failed: 0,
    skipped: 0,
    timedOut: 0,
    total: 0,
    startTime: 0,
  };

  onBegin(config: FullConfig, suite: Suite): void {
    this.stats.startTime = Date.now();
    const workerCount = config.workers;
    const testCount = suite.allTests().length;

    this.logger.info('════════════════════════════════════════════════');
    this.logger.info(`  Test Run Starting`);
    this.logger.info(`  Tests  : ${testCount}`);
    this.logger.info(`  Workers: ${workerCount}`);
    this.logger.info('════════════════════════════════════════════════');
  }

  onTestBegin(test: TestCase): void {
    this.stats.total++;
    this.logger.debug(`▶ ${test.titlePath().join(' › ')}`);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const duration = formatDuration(result.duration);
    const title = test.titlePath().join(' › ');

    switch (result.status) {
      case 'passed':
        this.stats.passed++;
        this.logger.info(`✓ PASS (${duration}) ${title}`);
        break;

      case 'failed':
        this.stats.failed++;
        this.logger.error(`✗ FAIL (${duration}) ${title}`);
        if (result.error?.message) {
          this.logger.error(`  Error: ${result.error.message}`);
        }
        break;

      case 'timedOut':
        this.stats.timedOut++;
        this.logger.warn(`⏱ TIMEOUT (${duration}) ${title}`);
        break;

      case 'skipped':
        this.stats.skipped++;
        this.logger.info(`⊘ SKIP ${title}`);
        break;
    }
  }

  onEnd(result: FullResult): void {
    const duration = formatDuration(Date.now() - this.stats.startTime);
    const { passed, failed, skipped, timedOut, total } = this.stats;

    this.logger.info('════════════════════════════════════════════════');
    this.logger.info(`  Test Run Complete — ${result.status.toUpperCase()}`);
    this.logger.info(`  Duration : ${duration}`);
    this.logger.info(`  Total    : ${total}`);
    this.logger.info(`  Passed   : ${passed}`);
    this.logger.info(`  Failed   : ${failed}`);
    this.logger.info(`  Timed Out: ${timedOut}`);
    this.logger.info(`  Skipped  : ${skipped}`);
    this.logger.info('════════════════════════════════════════════════');
  }
}

export default CustomReporter;
