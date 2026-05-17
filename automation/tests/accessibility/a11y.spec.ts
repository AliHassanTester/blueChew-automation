import { test, expect } from '../../fixtures/base.fixture';
import { test as authTest } from '../../fixtures/auth.fixture';
import AxeBuilder from '@axe-core/playwright';
import { addAllureMeta } from '../../reporters/allure.config';

// Axe results are browser-engine-specific; Chromium is the standard for a11y audits.
test.use({ browserName: 'chromium' });
authTest.use({ browserName: 'chromium' });

/**
 * Accessibility Audit — WCAG 2.1 AA (app.bluechew.com)
 *
 * Uses @axe-core/playwright to audit pages for common accessibility violations.
 * Run weekly in CI or before releases.
 */
test.describe('Accessibility Audit', { tag: '@accessibility' }, () => {

  test('Login page meets WCAG 2.1 AA', async ({ loginPage, page }) => {
    await addAllureMeta({
      feature: 'Accessibility',
      story: 'Login Page',
      severity: 'critical',
      layer: 'accessibility',
      owner: 'frontend-team',
    });

    await loginPage.navigate();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(
      results.violations,
      `Login page a11y violations:\n` +
        results.violations.map((v) => `  [${v.impact}] ${v.id}: ${v.description}`).join('\n'),
    ).toEqual([]);
  });

  test('Login form inputs have associated labels', async ({ loginPage, page }) => {
    await addAllureMeta({
      feature: 'Accessibility',
      story: 'Form Labels',
      severity: 'critical',
    });

    await loginPage.navigate();

    const results = await new AxeBuilder({ page })
      .include('form')
      .withTags(['wcag2a'])
      .analyze();

    const labelViolations = results.violations.filter((v) =>
      ['label', 'label-content-name-mismatch', 'form-field-multiple-labels'].includes(v.id),
    );

    expect(
      labelViolations,
      `Form label violations:\n` +
        labelViolations.map((v) => `  ${v.id}: ${v.description}`).join('\n'),
    ).toHaveLength(0);
  });

  authTest('MY PLAN page meets WCAG 2.1 AA', async ({ membershipPage, page }) => {
    await addAllureMeta({
      feature: 'Accessibility',
      story: 'MY PLAN Page',
      severity: 'critical',
      layer: 'accessibility',
    });

    await membershipPage.navigate();
    await membershipPage.assertFullyLoaded();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(
      results.violations,
      `MY PLAN page a11y violations:\n` +
        results.violations.map((v) => `  [${v.impact}] ${v.id}: ${v.description}`).join('\n'),
    ).toEqual([]);
  });

  authTest('MY PLAN page is keyboard navigable', async ({ membershipPage, page }) => {
    await addAllureMeta({
      feature: 'Accessibility',
      story: 'Keyboard Navigation',
      severity: 'normal',
    });

    await membershipPage.navigate();

    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  authTest('Profile page meets WCAG 2.1 AA', async ({ profilePage, page }) => {
    await addAllureMeta({
      feature: 'Accessibility',
      story: 'Profile Page',
      severity: 'critical',
      layer: 'accessibility',
    });

    await profilePage.navigate();
    await profilePage.assertFullyLoaded();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(
      results.violations,
      `Profile page a11y violations:\n` +
        results.violations.map((v) => `  [${v.impact}] ${v.id}: ${v.description}`).join('\n'),
    ).toEqual([]);
  });
});
