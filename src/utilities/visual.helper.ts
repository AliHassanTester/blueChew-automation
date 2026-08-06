import { Page, TestInfo } from '@playwright/test';
import { IVisualProvider } from './visual.providers/visual.provider.interface';
import { PercyProvider } from './visual.providers/percy.provider';
import { ApplitoolsProvider } from './visual.providers/applitools.provider';
import { UIProbeProvider } from './visual.providers/uiprobe.provider';

const dotenv = require('dotenv');
const path = require('path');

type VisualSnapshotOptions = {
  elementXpath?: string | string[];
  elementCSS?: string | string[];
  // provider-specific options may be passed through
  [key: string]: any;
};

const AVAILABLE_PROVIDERS: { [key: string]: any } = {
  percy: PercyProvider,
  applitools: ApplitoolsProvider,
  uiprobe: UIProbeProvider,
};

export class VisualHelper {
  private readonly enabled: boolean;
  private readonly providers: IVisualProvider[] = [];

  constructor(private readonly page: Page, private readonly testInfo: TestInfo) {
    dotenv.config({ path: path.resolve(process.cwd(), `.env.${process.env.ENV_TYPE || 'dev'}`) });
    dotenv.config();

    const visualProviders = (process.env.VISUAL_PROVIDERS || process.env.VISUAL_PROVIDER || 'percy').toLowerCase();
    const hasVisualProviderConfigured = visualProviders.includes('applitools') || visualProviders.includes('percy') || visualProviders.includes('uiprobe');
    const percyDisabled = process.env.PERCY_ENABLED === 'false' || process.env.PERCY_ENABLED === '0';
    this.enabled = !percyDisabled || hasVisualProviderConfigured;

    const configured = (visualProviders)
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    console.log(`[visual-helper] envType=${process.env.ENV_TYPE || 'dev'} providers=${configured.join(',')}`);

    for (const p of configured) {
      const ctor = AVAILABLE_PROVIDERS[p];
      if (ctor) {
        try {
          const instance: IVisualProvider = new ctor();
          this.providers.push(instance);
        } catch (err) {
          // ignore provider load failures — user may not have the SDK installed
        }
      }
    }
  }

  private snapshotName(checkpointName: string): string {
    const titlePath = this.testInfo.titlePath?.join(' › ') || this.testInfo.title;
    const projectPrefix = this.testInfo.project?.name ? `[${this.testInfo.project.name}] ` : '';
    return `${projectPrefix}${titlePath} — ${checkpointName}`;
  }

  async captureCheckpoint(checkpointName: string, options?: VisualSnapshotOptions): Promise<void> {
    if (!this.enabled || this.providers.length === 0) return;

    const snapshotName = this.snapshotName(checkpointName);

    for (const provider of this.providers) {
      try {
        console.log(`[visual-helper] invoking provider=${provider.name}`);
        await provider.initialize?.(this.page, this.testInfo);
        await provider.snapshot(this.page, snapshotName, options);
      } catch (err) {
        const message = `${provider.name}: ${String(err)}`;
        this.testInfo.annotations.push({ type: 'visual-provider-error', description: message });
        console.error(`[visual-helper] ${message}`);
      }
    }
  }

  async close(): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.close?.();
      } catch {
        // ignore
      }
    }
  }
}
