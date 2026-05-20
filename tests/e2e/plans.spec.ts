import { test, expect } from '../../fixtures/auth.fixture';
import { addAllureMeta } from '../../reporters/allure.config';

/**
 * Plans E2E — /plans
 *
 * Tests the plan selection page. Plan variants are selected via radio buttons
 * (each with a numeric value: 81, 82, 83 confirmed in live exploration).
 * The page also includes an FAQ accordion and a reviews carousel.
 *
 * We do NOT submit plan changes in these tests to avoid mutating the production
 * account. The tests validate UI state and navigation only.
 */
test.describe('Plans', { tag: ['@e2e', '@plans'] }, () => {
  test.beforeEach(async ({ plansPage }) => {
    await plansPage.navigate();
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test(
    'plans page loads with plan options',
    { tag: ['@smoke', '@critical'] },
    async ({ plansPage }) => {
      await addAllureMeta({
        feature: 'Plans',
        story: 'View Plans',
        severity: 'blocker',
        layer: 'e2e',
      });

      await plansPage.assertFullyLoaded();
    },
  );

  test(
    'plans page has correct document title',
    { tag: '@regression' },
    async ({ plansPage }) => {
      await plansPage.assertTitle(/BlueChew.*Plans/i);
    },
  );

  // ── Plan selection ────────────────────────────────────────────────────────

  test(
    'plan radio buttons are selectable',
    { tag: '@regression' },
    async ({ plansPage }) => {
      await addAllureMeta({
        feature: 'Plans',
        story: 'Plan Radio Selection',
        severity: 'critical',
        layer: 'e2e',
      });

      await plansPage.selectFirstPlan();
      await expect(plansPage.planRadios.first()).toBeChecked();
    },
  );

  test(
    'selecting a specific plan variant (81) marks it checked',
    { tag: '@regression' },
    async ({ plansPage }) => {
      await addAllureMeta({
        feature: 'Plans',
        story: 'Select Plan By ID',
        severity: 'normal',
        layer: 'e2e',
      });

      await plansPage.selectPlanById('81');
    },
  );

  // ── FAQ accordion ─────────────────────────────────────────────────────────

  test(
    'FAQ accordion items are visible on the plans page',
    { tag: '@regression' },
    async ({ plansPage }) => {
      await addAllureMeta({
        feature: 'Plans',
        story: 'FAQ Accordion',
        severity: 'minor',
        layer: 'e2e',
      });

      await plansPage.assertFaqItemsVisible();
    },
  );

  // ── Reviews carousel ──────────────────────────────────────────────────────

  test(
    'reviews carousel is present',
    { tag: '@regression' },
    async ({ plansPage }) => {
      await expect(plansPage.reviewsCarousel).toBeVisible();
    },
  );

  // ── Navigation ────────────────────────────────────────────────────────────

  test(
    'nav menu → MY PLAN navigates to /account/membership',
    { tag: '@regression' },
    async ({ plansPage }) => {
      await plansPage.nav.goToMembership();
      await expect(plansPage.page).toHaveURL(/\/account\/membership/);
    },
  );

  test(
    'plans page is reachable via context=switch',
    { tag: '@regression' },
    async ({ plansPage, page }) => {
      await page.goto('https://app.bluechew.com/plans?context=switch', { waitUntil: 'domcontentloaded' });
      await plansPage.assertFullyLoaded();
    },
  );
});
