import { TestInfo } from '@playwright/test';
import { TestCaseData } from '@interfaces/testcase.data.interface';
import { applyAllureMetadata, AllureMetaOptions } from '@utilities/allure.helper';

/**
 * Records test-case metadata across all configured reporters:
 *  - Playwright HTML / JUnit  → via testInfo annotations
 *  - Allure                   → via epic/feature/story/severity/tags labels
 *
 * Async because the Allure runtime calls must be awaited inside the test body.
 */
export async function logTestCaseData(
  testInfo: TestInfo,
  testCaseData: TestCaseData,
  allureOptions?: AllureMetaOptions,
): Promise<void> {
  // Plain annotations — surfaced by the Playwright HTML & JUnit reporters
  testInfo.annotations.push({ type: 'Test Case', description: testCaseData.testCase });
  testInfo.annotations.push({ type: 'Description', description: testCaseData.testDescription });
  testInfo.annotations.push({ type: 'Summary', description: testCaseData.testSummary });
  testInfo.annotations.push({ type: 'Tags', description: testCaseData.tags });

  // Rich metadata — surfaced by the Allure reporter (epic/feature/story/severity/tags)
  await applyAllureMetadata(testCaseData, allureOptions);
}
