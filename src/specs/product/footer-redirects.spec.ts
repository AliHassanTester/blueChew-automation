import { test } from '@fixtures/page.fixtures';
import { logTestCaseData } from '@utilities/test.helper.utils';
import { getFooterRedirectsData } from '@data/product/footer-redirects.data';

const scenario = getFooterRedirectsData('FOOTER-001-Bottom-Page-Redirects');

// Suppress whole-page failure screenshots so only visual snapshot comparison artifacts are captured
test.use({ screenshot: 'off' });

test.describe('Feature: Homepage Footer - Bottom Page Redirects & Visual Baseline', () => {
  test(
    `Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({ footerRedirectsPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        epic: 'Homepage',
        feature: 'Footer Navigation',
        story: 'Bottom Page Redirects & Visual Verification',
      });

      await footerRedirectsPage.executeFullFooterFlow(
        scenario.footerRedirectsData.homeURL,
        scenario.footerRedirectsData.footerLinks,
      );
    },
  );
});
