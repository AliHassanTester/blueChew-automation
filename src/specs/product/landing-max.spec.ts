import { test } from '@fixtures/page.fixtures';
import { logTestCaseData } from '@utilities/test.helper.utils';
import { getMaxData } from '@data/product/landing-max.data';

const scenario = getMaxData('Product-007-Landing-Max');

test.describe('Feature: Product Landing - MAX', () => {
  test.only(
    `Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({ landingMaxPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        epic: 'Product Pages',
        feature: 'Landing Max',
        story: 'MAX Landing Page Verification & CTAs',
      });

      await landingMaxPage.executeFullLandingMaxFlow(scenario.landingMaxData.mainURL);
    },
  );
});
