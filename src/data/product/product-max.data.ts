import { TestCaseData } from '@interfaces/testcase.data.interface';
import { getEnvVars } from '@utilities/env.utils';

export interface ProductMaxTestCaseData {
  testCaseData: TestCaseData;
  url: string;
}

const env = getEnvVars({
  LOGIN_URL: 'https://dev.app.bluechew.com/log-in',
});

const productMaxTestData: { [key: string]: ProductMaxTestCaseData } = {
  'PRODUCT-MAX': {
    url: 'https://dev.bluechew.com/max',
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
