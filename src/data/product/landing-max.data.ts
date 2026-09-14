import { LandingMaxData } from '@interfaces/landing-max.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';

export interface LandingMaxTestCaseData {
  landingMaxData: LandingMaxData;
  testCaseData: TestCaseData;
}

export type landingMaxTestCaseData = LandingMaxTestCaseData;

export const landingMaxTestData: Record<string, LandingMaxTestCaseData> = {
  'Product-007-Landing-Max': {
    landingMaxData: {
      mainURL: `${process.env.baseURL || ''}/landing/max`,
    },
    testCaseData: {
      tags: '@regression @product @landing-max @e2e @visual',
      testCase: 'Landing Max',
      testDescription: 'User can select Max product plan and complete checkout flow',
      testSummary:
        'Navigate to Max landing page, capture visual baseline, select plan, complete registration, quiz, medical, checkout and order approval.',
    },
  },
};

export const LandingMaxTestCaseData = landingMaxTestData;

export function getMaxData(testCase: string): LandingMaxTestCaseData {
  const data = landingMaxTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
