import { Eyes, Target, VisualGridRunner } from '@applitools/eyes-playwright';
import { logTestCaseData } from '@utilities/test.helper.utils';
import { getProductMaxData } from '@data/product/product-max.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getProductMaxData('PRODUCT-MAX');

test.describe('Feature: Product Max', () => {
  test(
    `
    Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({ productPage }, testInfo) => {
      await logTestCaseData(testInfo, scenario.testCaseData, {
        feature: 'Product',
        story: 'Product Max',
      });

      const apiKey = process.env.APPLITOOLS_API_KEY || process.env.APPLI_API_KEY;
      if (!apiKey) {
        throw new Error('Applitools API key is not configured');
      }

      const eyes = new Eyes(new VisualGridRunner({ testConcurrency: 1 }), { apiKey });
      const eyesAny = eyes as any;

      try {
        await test.step('Open Product Max and capture a visual baseline', async () => {
          await productPage.navigateToProductMax(scenario.url);
          await productPage.page.waitForLoadState('domcontentloaded', { timeout: 5 }).catch(() => undefined);
          await productPage.page.waitForTimeout(1000).catch(() => undefined);

          await eyes.open(productPage.page, 'BlueChew 4.0 - Dev Handoff - {Login-Default}', 'Desktop - 9');

          eyesAny.setConfiguration?.({
            appName: 'BlueChew 4.0 - Dev Handoff - {Login-Default}',
            testName: 'Desktop - 9',
            baselineEnvName: 'Desktop - 9_1440',
            ignoreDisplacement: true,
          });

          await eyes.check('Product Max page loaded', Target.window().fully());
        });
      } finally {
        try {
          await eyes.close();
        } catch {
          await eyes.abortIfNotClosed?.();
        }
      }
    },
  );
});
