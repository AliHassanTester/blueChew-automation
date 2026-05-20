/** All timeouts in milliseconds. Use named constants — never raw numbers in tests. */
export const TIMEOUTS = {
  /** Very short wait for micro-interactions (e.g. toast appearances) */
  SHORT: 3_000,

  /** Standard element visibility wait */
  ELEMENT: 10_000,

  /** Page navigation and full load */
  NAVIGATION: 30_000,

  /** API requests via the framework HTTP client */
  API_REQUEST: 30_000,

  /** Long-running operations: file uploads, heavy reports */
  LONG: 60_000,

  /** Polling interval for retry loops */
  POLL_INTERVAL: 500,
} as const;
