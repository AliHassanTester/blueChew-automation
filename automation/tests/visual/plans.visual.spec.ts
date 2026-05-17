import { test, expect } from '../../fixtures/auth.fixture';
import {
  disableAnimations,
  screenshotPage,
  screenshotComponent,
  screenshotAtViewport,
  validateTokens,
  formatViolations,
} from '../../helpers/visual.helper';
import { COLOR_TOKENS } from '../../constants/design-tokens.constants';

/**
 * Plans — Visual Regression + Design Token Tests
 *
 * The plans page is content-heavy: plan cards, FAQ accordion, reviews carousel.
 * Component-level screenshots are preferred over full-page to reduce surface area
 * of diffs and isolate regressions to specific UI regions.
 *
 * First run: npx playwright test tests/visual/plans.visual.spec.ts --update-snapshots
 */
test.use({ browserName: 'chromium' });

test.describe('Plans — Visual', { tag: '@visual' }, () => {
  test.beforeEach(async ({ plansPage }) => {
    await plansPage.navigate();
    await plansPage.assertFullyLoaded();
    await disableAnimations(plansPage.page);
    await plansPage.page.evaluate(() => window.scrollTo(0, 0));
  });

  // ── Component screenshots ─────────────────────────────────────────────────

  test('plan radio cards — default (none selected)', async ({ plansPage }) => {
    await screenshotComponent(
      plansPage.planRadios.first(),
      'plans-radio-unselected.png',
    );
  });

  test('plan radio cards — first plan selected', async ({ plansPage }) => {
    await plansPage.selectFirstPlan();
    await screenshotComponent(
      plansPage.planRadios.first(),
      'plans-radio-selected.png',
    );
  });

  test('FAQ accordion — first item expanded', async ({ plansPage }) => {
    await plansPage.faqItems.first().scrollIntoViewIfNeeded();
    await plansPage.toggleFaqItem(0);
    await screenshotComponent(
      plansPage.faqItems.first(),
      'plans-faq-expanded.png',
      { maxDiffPixels: 200 },
    );
  });

  test('reviews carousel — visible region', async ({ plansPage }) => {
    await plansPage.reviewsCarousel.scrollIntoViewIfNeeded();
    await screenshotComponent(
      plansPage.reviewsCarousel,
      'plans-reviews-carousel.png',
      { maxDiffPixels: 300 },
    );
  });

  // ── Responsive screenshots ────────────────────────────────────────────────

  test('plans layout — mobile (375px)', async ({ plansPage }) => {
    await screenshotAtViewport(plansPage.page, 'mobile', 'plans-mobile.png');
  });

  test('plans layout — tablet (768px)', async ({ plansPage }) => {
    await screenshotAtViewport(plansPage.page, 'tablet', 'plans-tablet.png');
  });

  test('plans layout — desktop (1280px)', async ({ plansPage }) => {
    await screenshotPage(plansPage.page, 'plans-desktop.png');
  });

  // ── Design token validation ───────────────────────────────────────────────

  test('page background color matches token', async ({ plansPage }) => {
    const violations = await validateTokens(plansPage.page, 'body', {
      'background-color': COLOR_TOKENS.pageBackground,
    });
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
