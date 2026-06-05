import * as allure from 'allure-js-commons';
import { Severity } from 'allure-js-commons';
import { TestCaseData } from '@interfaces/testcase.data.interface';

/**
 * Parse a tag string like "@regression @smoke @login" into ['regression', 'smoke', 'login'].
 */
function parseTags(tags: string): string[] {
  return tags
    .split(/\s+/)
    .map((t) => t.replace(/^@/, '').trim())
    .filter(Boolean);
}

/**
 * Map test tags to an Allure severity. Smoke tests gate releases, so they are
 * the most critical; everything else defaults to normal.
 */
function deriveSeverity(tags: string[]): Severity {
  if (tags.includes('blocker')) return Severity.BLOCKER;
  if (tags.includes('smoke')) return Severity.CRITICAL;
  if (tags.includes('minor')) return Severity.MINOR;
  return Severity.NORMAL;
}

export interface AllureMetaOptions {
  /** Top-level grouping in the Allure "Behaviors" view (defaults to "BlueChew E2E"). */
  epic?: string;
  /** Feature within the epic, e.g. "Authentication". */
  feature?: string;
  /** User story within the feature, e.g. "User Login". */
  story?: string;
  /** Override the tag-derived severity. */
  severity?: Severity;
  /** Owner shown on the test page (defaults to "QA Automation"). */
  owner?: string;
}

/**
 * Applies Allure metadata from a test's TestCaseData so the report is organised
 * and filterable by epic → feature → story, severity, owner, and tags.
 *
 * Call once at the start of each test (inside the test body so the Allure
 * runtime can resolve the current test context).
 */
export async function applyAllureMetadata(
  testCaseData: TestCaseData,
  opts: AllureMetaOptions = {},
): Promise<void> {
  const tags = parseTags(testCaseData.tags);

  await allure.epic(opts.epic ?? 'BlueChew E2E');
  if (opts.feature) await allure.feature(opts.feature);
  if (opts.story) await allure.story(opts.story);

  await allure.owner(opts.owner ?? 'QA Automation');
  await allure.severity(opts.severity ?? deriveSeverity(tags));

  // Stable history id keyed on the business test-case id so trend/history
  // survives edits to the (long, templated) test title.
  await allure.allureId(testCaseData.testCase);

  await allure.description(
    `${testCaseData.testDescription}\n\n${testCaseData.testSummary}`,
  );

  if (tags.length > 0) await allure.tags(...tags);
}
