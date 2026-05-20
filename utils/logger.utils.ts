import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Ensure the logs directory exists before creating transports
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const { combine, timestamp, colorize, printf, errors } = winston.format;

const consoleFormat = printf(({ level, message, label, timestamp: ts, stack }) => {
  const prefix = label ? `[${label as string}] ` : '';
  return `${ts as string} ${level}: ${prefix}${stack ?? (message as string)}`;
});

const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? (process.env.CI ? 'info' : 'debug'),
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), consoleFormat),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: combine(timestamp(), winston.format.json()),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: combine(timestamp(), winston.format.json()),
    }),
  ],
  // Don't crash the test run if logging fails
  exitOnError: false,
});

/**
 * Named logger factory. Each module or class creates its own instance
 * so log output is prefixed with the originating context.
 *
 * Usage:
 *   private readonly logger = new Logger('LoginPage');
 *   this.logger.info('Navigating to login');
 */
export class Logger {
  private readonly logger: winston.Logger;

  constructor(context: string) {
    this.logger = baseLogger.child({ label: context });
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: unknown): void {
    if (error instanceof Error) {
      this.logger.error(message, { stack: error.stack, message: error.message });
    } else {
      this.logger.error(message, { error });
    }
  }

  step(message: string): void {
    this.logger.info(`── STEP: ${message}`);
  }
}
