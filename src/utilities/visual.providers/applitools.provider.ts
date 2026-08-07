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
    if (this.eyes) return;
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
        const { Eyes, ClassicRunner, Target } = applitools;
        this.Target = Target;
        this.runner = new ClassicRunner();
        this.eyes = new Eyes(this.runner);
        this.eyes.setApiKey(applitoolsApiKey);

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
        ignoreDisplacements?: boolean;
        ignoreDisplacement?: boolean;
        checkpointName?: string;
      } | undefined;

      if (visualConfig?.appName || visualConfig?.testName || visualConfig?.viewport || visualConfig?.baselineEnvName) {
        const config = this.eyes.getConfiguration();
        if (visualConfig.appName) config.setAppName(visualConfig.appName);
        if (visualConfig.testName) config.setTestName(visualConfig.testName);
        if (visualConfig.viewport) config.setViewportSize(visualConfig.viewport);
        if (visualConfig.baselineEnvName) config.setBaselineEnvName(visualConfig.baselineEnvName);
        if (typeof visualConfig.ignoreDisplacements === 'boolean') {
          config.setIgnoreDisplacements(visualConfig.ignoreDisplacements);
        } else if (typeof visualConfig.ignoreDisplacement === 'boolean') {
          config.setIgnoreDisplacements(visualConfig.ignoreDisplacement);
        }
        this.eyes.setConfiguration(config);
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
      await this.eyes.close(false);
    } catch {
      try {
        await this.eyes.abortIfNotClosed?.();
      } catch {
        // ignore
      }
    } finally {
      if (this.runner) {
        try {
          await this.runner.getAllTestResults(false);
        } catch {
          // ignore
        }
      }
      this.eyes = undefined;
    }
  }
}

