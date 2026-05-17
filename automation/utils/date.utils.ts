/** Formats a Date as YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Returns today's date as YYYY-MM-DD */
export function today(): string {
  return formatDate(new Date());
}

/** Adds the given number of days to a date and returns the result. */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Returns a unix timestamp string — useful for generating unique identifiers. */
export function timestamp(): string {
  return Date.now().toString();
}

/** Returns a human-readable duration string, e.g. "2m 30s" */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}
