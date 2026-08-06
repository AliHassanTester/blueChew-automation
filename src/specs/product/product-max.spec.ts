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
    async ({ productPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        feature: 'Product',
        story: 'Product Max',
      });

      await test.step('Open Product Max and capture a visual baseline', async () => {
        await productPage.navigateToProductMax(scenario.url);
        await productPage.captureProductMaxSnapshot();
      });
    },
  );
});
