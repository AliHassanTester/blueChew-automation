import { test, expect } from '../../fixtures/auth.fixture';
import {
  disableAnimations,
  screenshotPage,
  screenshotComponent,
  screenshotAtViewport,
  validateTokens,
  formatViolations,
} from '../../helpers/visual.helper';
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS } from '../../constants/design-tokens.constants';

/**
 * MY PLAN (Membership) — Visual Regression + Design Token Tests
 *
 * The test account always has its plan on hold, so hold-state UI is the
 * stable baseline (orange banner + RESUME PLAN button visible on every run).
 *
 * First run: npx playwright test tests/visual/membership.visual.spec.ts --update-snapshots
 */
test.use({ browserName: 'chromium' });

test.describe('Membership — Visual', { tag: '@visual' }, () => {
  test.beforeEach(async ({ membershipPage }) => {
    await membershipPage.navigate();
    await membershipPage.assertFullyLoaded();
    await disableAnimations(membershipPage.page);
  });

  // ── Component screenshots ─────────────────────────────────────────────────

  test('plan card — on-hold state', async ({ membershipPage }) => {
    await screenshotComponent(
      membershipPage.resumePlanButton,
      'membership-plan-card.png',
      { maxDiffPixels: 200 },
    );
  });

  test('hold banner — visible and styled', async ({ membershipPage }) => {
    await screenshotComponent(
      membershipPage.holdBanner,
      'membership-hold-banner.png',
    );
  });

  test('nav hamburger toggle — default position', async ({ membershipPage }) => {
    await screenshotComponent(
      membershipPage.nav.toggle,
      'membership-nav-toggle.png',
    );
  });

  // ── Responsive screenshots ────────────────────────────────────────────────

  test('MY PLAN layout — mobile (375px)', async ({ membershipPage }) => {
    await screenshotAtViewport(membershipPage.page, 'mobile', 'membership-mobile.png');
  });

  test('MY PLAN layout — tablet (768px)', async ({ membershipPage }) => {
    await screenshotAtViewport(membershipPage.page, 'tablet', 'membership-tablet.png');
  });

  test('MY PLAN layout — desktop (1280px)', async ({ membershipPage }) => {
    await screenshotPage(membershipPage.page, 'membership-desktop.png');
  });

  // ── Design token validation ───────────────────────────────────────────────

  test('RESUME PLAN button typography tokens match design', async ({ membershipPage }) => {
    const violations = await validateTokens(
      membershipPage.page,
      'button:has-text("RESUME PLAN"), button:has-text("Resume Plan")',
      {
        'color':       COLOR_TOKENS.primaryButtonText,
        'font-weight': TYPOGRAPHY_TOKENS.weightBold,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('page background color matches token', async ({ membershipPage }) => {
    const violations = await validateTokens(membershipPage.page, 'body', {
      'background-color': COLOR_TOKENS.pageBackground,
    });
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
