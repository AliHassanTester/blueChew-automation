import { TestCaseData } from '@interfaces/testcase.data.interface';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import { getEnvVars } from '@utilities/env.utils';

export const PRODUCT_MAX_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 9',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Desktop - 9_1440',
  ignoreDisplacement: true,
};

export interface ProductMaxTestCaseData {
  testCaseData: TestCaseData;
  url: string;
  visualConfig: ApplitoolsVisualConfig;
}

const env = getEnvVars({
  LOGIN_URL: 'https://dev.app.bluechew.com/log-in',
});

const productMaxTestData: { [key: string]: ProductMaxTestCaseData } = {
  'PRODUCT-MAX': {
    url: 'https://dev.bluechew.com/max',
    visualConfig: PRODUCT_MAX_FIGMA_CONFIG,
    testCaseData: {
      tags: '@regression @product @max @percy @visual',
      testCase: 'PRODUCT-MAX',
      testDescription: 'Product Max page loads correctly and is captured visually',
      testSummary: 'Navigate to the Product Max page and capture a visual baseline once the page is fully loaded.',
    },
  },
};

export function getProductMaxData(testCase: string): ProductMaxTestCaseData {
  const data = productMaxTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
