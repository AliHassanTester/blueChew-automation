export interface TestCaseData {
  tier?: 'Tier 1 - UI Functional' | 'Tier 2 - Visual Regression' | 'Tier 3 - API Automation' | string;
  tags: string;
  testCase: string;
  testDescription: string;
  testSummary: string;
}
