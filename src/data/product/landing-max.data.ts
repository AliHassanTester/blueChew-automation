import { LandingMaxData } from "@interfaces/landing-max.interface";
import { TestCaseData } from "@interfaces/testcase.data.interface";

export interface landingMaxTestCaseData {
    landingMaxData:LandingMaxData;
    testCaseData: TestCaseData;
}
export const LandingMaxTestCaseData:  { [key: string]: landingMaxTestCaseData } = {
   'Product-007-Landing-Max':{
    landingMaxData:
    {
    mainURL: `${process.env.baseURL || ''}/landing/max`
},
    testCaseData: {
      tags: `@regression @product @landing-max @e2e @visual`,
      testCase:'Landing Max',
      testDescription: `User can select Max product plan and complete checkout flow`,
      testSummary: `Navigate to Max landing page, capture visual baseline, select plan, complete registration, quiz, medical, checkout and order approval.`,
    },
}
}

export function getMaxData(testCase: string): landingMaxTestCaseData {
  const data = LandingMaxTestCaseData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
