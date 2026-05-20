import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger.utils';

const logger = new Logger('TestDataHelper');

/**
 * Loads a JSON fixture from the test-data/ directory.
 * Type parameter T lets callers get a typed result without casting.
 */
export function loadFixture<T>(filename: string): T {
  const filePath = path.resolve(process.cwd(), 'test-data', filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Fixture not found: ${filePath}`);
  }

  logger.debug(`Loading fixture: ${filename}`);
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content) as T;
}

/**
 * Returns a random item from an array.
 * Useful for selecting a random test user or product from a fixture.
 */
export function randomFrom<T>(array: T[]): T {
  if (array.length === 0) throw new Error('Cannot pick from empty array');
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Returns a unique test identifier that includes a timestamp.
 * Append to email addresses or usernames to avoid collision between parallel test runs.
 */
export function uniqueId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Generates a test email that is guaranteed unique across concurrent runs. */
export function uniqueEmail(domain = 'testqa.example.com'): string {
  return `${uniqueId('qa')}@${domain}`;
}
