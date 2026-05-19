import { TestInfo } from '@playwright/test';
import { TestCaseData } from '@interfaces/testcase.data.interface';

export function logTestCaseData(testInfo: TestInfo, testCaseData: TestCaseData): void {
  testInfo.annotations.push({ type: 'Test Case', description: testCaseData.testCase });
  testInfo.annotations.push({ type: 'Description', description: testCaseData.testDescription });
  testInfo.annotations.push({ type: 'Summary', description: testCaseData.testSummary });
  testInfo.annotations.push({ type: 'Tags', description: testCaseData.tags });
}
