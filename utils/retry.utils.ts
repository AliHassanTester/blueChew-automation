import { Logger } from './logger.utils';
import { TIMEOUTS } from '../constants/timeouts.constants';

const logger = new Logger('RetryUtils');

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  /** Called before each retry with the caught error and attempt number */
  onRetry?: (error: unknown, attempt: number) => void;
  /** Returns true if the error is considered retryable; rethrows otherwise */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * Executes an async operation with exponential back-off retry logic.
 * Designed for flaky network calls and intermittent UI states.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = TIMEOUTS.POLL_INTERVAL,
    onRetry,
    isRetryable = () => true,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryable(error) || attempt === maxAttempts) {
        throw error;
      }

      const waitTime = delayMs * Math.pow(2, attempt - 1); // exponential back-off
      logger.warn(`Attempt ${attempt}/${maxAttempts} failed. Retrying in ${waitTime}ms...`);

      if (onRetry) onRetry(error, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * Retries a Playwright action (e.g., click) that may fail due to element
 * instability. Distinct from `withRetry` because it handles Playwright-specific
 * TimeoutErrors differently.
 */
export async function retryAction<T>(action: () => Promise<T>, maxAttempts = 3): Promise<T> {
  return withRetry(action, {
    maxAttempts,
    delayMs: 500,
    isRetryable: (error) => {
      if (error instanceof Error) {
        return (
          error.message.includes('Timeout') ||
          error.message.includes('detached') ||
          error.message.includes('intercept')
        );
      }
      return false;
    },
    onRetry: (error, attempt) => {
      logger.warn(`UI action retry ${attempt}: ${String(error)}`);
    },
  });
}
