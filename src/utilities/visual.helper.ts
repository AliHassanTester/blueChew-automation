import { Page, TestInfo } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import { Region, SnapshotOptions } from '@percy/core';

type VisualSnapshotOptions = SnapshotOptions & {
  elementXpath?: string | string[];
  elementCSS?: string | string[];
};

export class VisualHelper {
  private readonly enabled = process.env.PERCY_ENABLED !== 'false' && process.env.PERCY_ENABLED !== '0';

  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  private snapshotName(checkpointName: string): string {
    const titlePath = this.testInfo.titlePath?.join(' › ') || this.testInfo.title;
    const projectPrefix = this.testInfo.project?.name ? `[${this.testInfo.project.name}] ` : '';
    return `${projectPrefix}${titlePath} — ${checkpointName}`;
  }

  async captureCheckpoint(
    checkpointName: string,
    options?: VisualSnapshotOptions,
  ): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const { elementXpath, elementCSS, ...baseOptions } = options ?? {};
    const regions: Region[] = [];

    if (elementXpath) {
      const entries = Array.isArray(elementXpath) ? elementXpath : [elementXpath];
      regions.push(
        ...entries.map((path) => ({
          algorithm: 'css',
          elementSelector: { elementXpath: path },
        } as Region)),
      );
    }

    if (elementCSS) {
      const entries = Array.isArray(elementCSS) ? elementCSS : [elementCSS];
      regions.push(
        ...entries.map((selector) => ({
          algorithm: 'css',
          elementSelector: { elementCSS: selector },
        } as Region)),
      );
    }

    const snapshotOptions: SnapshotOptions = {
      ...baseOptions,
      ...(regions.length ? { regions } : {}),
    };

    await percySnapshot(this.page, this.snapshotName(checkpointName), snapshotOptions);
  }
}
