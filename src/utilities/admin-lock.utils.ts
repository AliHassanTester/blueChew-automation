import * as fs from 'fs';
import * as path from 'path';

/**
 * Atomic process-level mutex that serializes access to the shared Care Portal / Admin account (ali@meds.com).
 * Allows parallel test workers to run frontend checkout flows concurrently while ensuring only ONE
 * worker interacts with the Admin Portal at any given time.
 */
export class AdminPortalLock {
  private static readonly lockDir = path.resolve(process.cwd(), '.admin-portal-lock');

  /**
   * Cleans any residual lock directory (e.g. from previous aborted test runs).
   */
  public static clean(): void {
    try {
      if (fs.existsSync(this.lockDir)) {
        fs.rmSync(this.lockDir, { recursive: true, force: true });
        console.log('[AdminLock] Cleaned residual Admin Portal lock directory.');
      }
    } catch (e) {
      console.warn('[AdminLock] Failed to clean lock directory:', e);
    }
  }

  /**
   * Acquires the exclusive Admin Portal lock. Blocks/polls until available.
   *
   * @param timeoutMs Max time to wait for the lock (default: 300,000ms / 5 mins)
   * @param pollIntervalMs Interval between acquisition attempts (default: 1,500ms)
   * @returns Release function to be invoked in a `finally` block.
   */
  public static async acquire(timeoutMs = 300_000, pollIntervalMs = 1_500): Promise<() => void> {
    const startTime = Date.now();
    const pid = process.pid;
    console.log(`[AdminLock] Worker (PID: ${pid}) waiting for Admin Portal exclusive lock...`);

    while (Date.now() - startTime < timeoutMs) {
      try {
        // fs.mkdirSync is an atomic OS operation across all processes
        fs.mkdirSync(this.lockDir);
        console.log(`[AdminLock] Worker (PID: ${pid}) ACQUIRED Admin Portal exclusive lock.`);

        let released = false;
        return () => {
          if (released) return;
          released = true;
          try {
            if (fs.existsSync(this.lockDir)) {
              fs.rmSync(this.lockDir, { recursive: true, force: true });
              console.log(`[AdminLock] Worker (PID: ${pid}) RELEASED Admin Portal exclusive lock.`);
            }
          } catch (err) {
            console.warn(`[AdminLock] Error releasing lock for PID ${pid}:`, err);
          }
        };
      } catch (err: any) {
        if (err.code === 'EEXIST') {
          // Lock is held by another worker process. Check for stale lock (> 180s old)
          try {
            const stats = fs.statSync(this.lockDir);
            if (Date.now() - stats.mtimeMs > 180_000) {
              console.warn(`[AdminLock] Stale lock detected (>180s old). Automatically clearing...`);
              fs.rmSync(this.lockDir, { recursive: true, force: true });
              continue;
            }
          } catch {}

          // Wait before next poll attempt
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        } else {
          throw err;
        }
      }
    }

    throw new Error(`[AdminLock] Timed out after ${timeoutMs / 1000}s waiting for Admin Portal exclusive lock.`);
  }
}
