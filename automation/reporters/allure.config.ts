/**
 * Allure reporter configuration helpers.
 *
 * These utilities are called from within test files to enrich the Allure
 * report with metadata — owners, stories, severities, and steps — that make
 * the report useful to stakeholders beyond just the QA team.
 */
import { allure } from 'allure-playwright';

export type Severity = 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial';
export type Layer = 'e2e' | 'api' | 'visual' | 'accessibility';

export interface AllureMeta {
  feature?: string;
  story?: string;
  suite?: string;
  owner?: string;
  severity?: Severity;
  layer?: Layer;
  issue?: string;
  testCaseId?: string;
  tags?: string[];
}

/** Applies structured metadata to the current Allure test entry. */
export async function addAllureMeta(meta: AllureMeta): Promise<void> {
  if (meta.feature) await allure.feature(meta.feature);
  if (meta.story) await allure.story(meta.story);
  if (meta.suite) await allure.suite(meta.suite);
  if (meta.owner) await allure.owner(meta.owner);
  if (meta.severity) await allure.severity(meta.severity);
  if (meta.layer) await allure.layer(meta.layer);
  if (meta.issue) await allure.issue(meta.issue, `Issue: ${meta.issue}`);
  if (meta.testCaseId) await allure.testCaseId(meta.testCaseId);
  if (meta.tags) {
    for (const tag of meta.tags) {
      await allure.tag(tag);
    }
  }
}

/**
 * Wraps an async action in a named Allure step.
 * The step appears as a collapsible entry in the test timeline.
 */
export async function step<T>(name: string, action: () => Promise<T>): Promise<T> {
  // allure.step types as Promise<void> but it correctly returns the callback result
  return allure.step(name, action as () => Promise<void>) as unknown as Promise<T>;
}
