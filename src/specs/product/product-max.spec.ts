import { Eyes, Target, ClassicRunner, Configuration } from '@applitools/eyes-playwright';
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

      const runner = new ClassicRunner();
      const eyes = new Eyes(runner);

      try {
        await test.step('Open Product Max and capture a visual baseline', async () => {
          await productPage.navigateToProductMax(scenario.url);
          await productPage.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
          await productPage.page.waitForTimeout(2000).catch(() => undefined);

          // Configure Applitools Eyes Configuration Object
          const config = new Configuration();
          config.setApiKey(apiKey);
          config.setAppName('Login Default'); // Must match Figma file / baseline app name
          config.setTestName('Desktop - 9'); // Must match Figma frame / baseline test name
          config.setViewportSize({ width: 1440, height: 915 });
          config.setBaselineEnvName('Desktop - 9_1440');
          config.setIgnoreDisplacements(true);
          eyes.setConfiguration(config);

          // Open Eyes session with page
          await eyes.open(productPage.page);

          await eyes.check('Product Max page loaded', Target.window().fully());

          // Synchronously close eyes to ensure snapshot upload is finished before test step completes
          await eyes.close(false);
        });
      } finally {
        await eyes.abortIfNotClosed().catch(() => undefined);
        await runner.getAllTestResults(false).catch(() => undefined);
      }
    },
  );
});


