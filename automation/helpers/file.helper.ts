import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger.utils';

const logger = new Logger('FileHelper');

/** Creates a directory and all parent directories if they don't exist. */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.debug(`Created directory: ${dirPath}`);
  }
}

/** Deletes a directory and all its contents. Safe to call even if it doesn't exist. */
export function removeDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    logger.debug(`Removed directory: ${dirPath}`);
  }
}

/** Writes JSON content to a file, creating parent directories as needed. */
export function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/** Reads and parses a JSON file. */
export function readJson<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

/** Returns true if the file exists and is readable. */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/** Returns the size of a file in bytes, or -1 if it doesn't exist. */
export function fileSize(filePath: string): number {
  if (!fs.existsSync(filePath)) return -1;
  return fs.statSync(filePath).size;
}

/** Cleans old artefact files from a directory, keeping the newest N. */
export function pruneOldFiles(dirPath: string, keepNewest = 10): void {
  if (!fs.existsSync(dirPath)) return;

  const files = fs
    .readdirSync(dirPath)
    .map((name) => ({ name, mtime: fs.statSync(path.join(dirPath, name)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  files.slice(keepNewest).forEach(({ name }) => {
    fs.unlinkSync(path.join(dirPath, name));
    logger.debug(`Pruned old file: ${name}`);
  });
}
