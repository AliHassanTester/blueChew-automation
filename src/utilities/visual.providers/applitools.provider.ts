import { Page, TestInfo } from '@playwright/test';
import { IVisualProvider } from './visual.provider.interface';

// Applitools SDK is optional — this adapter uses lazy imports so the package
// is not required unless `VISUAL_PROVIDERS` includes `applitools`.
export class ApplitoolsProvider implements IVisualProvider {
  public readonly name = 'applitools';
  private eyes: any;
  private runner: any;
  private Target: any;

  async initialize(page: Page, testInfo?: TestInfo): Promise<void> {
    try {
      const applitoolsApiKey = process.env.APPLITOOLS_API_KEY || process.env.APPLI_API_KEY;
      if (applitoolsApiKey && !process.env.APPLITOOLS_API_KEY) {
        process.env.APPLITOOLS_API_KEY = applitoolsApiKey;
      }

      if (!applitoolsApiKey) {
        throw new Error('Applitools API key is not configured');
      }

      try {
        const applitools = await import('@applitools/eyes-playwright');
        const { Eyes, VisualGridRunner, Target } = applitools;
        this.Target = Target;
        const concurrency = Number(process.env.APPLITOOLS_CONCURRENCY) || 5;
        this.runner = new VisualGridRunner({ testConcurrency: concurrency });
        this.eyes = new Eyes(this.runner, {
          apiKey: process.env.APPLITOOLS_API_KEY || process.env.APPLI_API_KEY,
        });

        await this.eyes.open(page, {
          appName: process.env.APPLITOOLS_APP || 'App',
          testName: testInfo?.title || 'Playwright Test',
        });
      } catch (importErr) {
        console.error('[applitools-provider] Failed to load @applitools/eyes-playwright. Install the package and retry.');
        throw importErr;
      }
    } catch (err) {
      this.eyes = undefined;
      throw err;
    }
  }

  async snapshot(page: Page, snapshotName: string, options?: any): Promise<void> {
    if (!this.eyes) return;
    try {
      const visualConfig = options as {
        appName?: string;
        testName?: string;
        viewport?: { width: number; height: number };
        baselineEnvName?: string;
        ignoreDisplacement?: boolean;
        checkpointName?: string;
      } | undefined;

      if (visualConfig?.appName || visualConfig?.testName || visualConfig?.viewport || visualConfig?.baselineEnvName || typeof visualConfig?.ignoreDisplacement === 'boolean') {
        this.eyes.setConfiguration?.({
          appName: visualConfig.appName,
          testName: visualConfig.testName,
          viewport: visualConfig.viewport,
          baselineEnvName: visualConfig.baselineEnvName,
          ignoreDisplacement: visualConfig.ignoreDisplacement,
        });
      }

      const checkName = visualConfig?.checkpointName || snapshotName;

      if (options?.elementCSS) {
        const selectors = Array.isArray(options.elementCSS) ? options.elementCSS : [options.elementCSS];
        for (const sel of selectors) {
          await this.eyes.check(checkName, this.Target.region(page.locator(sel)));
        }
        return;
      }

      if (options?.elementXpath) {
        const xpaths = Array.isArray(options.elementXpath) ? options.elementXpath : [options.elementXpath];
        for (const xp of xpaths) {
          await this.eyes.check(checkName, this.Target.region(page.locator(`xpath=${xp}`)));
        }
        return;
      }

      await this.eyes.check(checkName, this.Target.window().fully());
    } catch (err) {
      // do not fail tests — record annotation elsewhere
      throw err;
    }
  }

  async close(): Promise<void> {
    if (!this.eyes) return;
    try {
      await this.eyes.close();
    } catch {
      try {
        await this.eyes.abortIfNotClosed?.();
      } catch {
        // ignore
      }
    }
  }
}
