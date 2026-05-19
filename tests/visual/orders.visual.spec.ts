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
 * Orders — Visual Regression + Design Token Tests
 *
 * The test account has at least one order card and a hold banner visible.
 * The order card list is a stable UI region — mask user-specific order IDs
 * if they vary between environments.
 *
 * First run: npx playwright test tests/visual/orders.visual.spec.ts --update-snapshots
 */
test.use({ browserName: 'chromium' });

test.describe('Orders — Visual', { tag: '@visual' }, () => {
  test.beforeEach(async ({ ordersPage }) => {
    await ordersPage.navigate();
    await ordersPage.assertFullyLoaded();
    await disableAnimations(ordersPage.page);
  });

  // ── Component screenshots ─────────────────────────────────────────────────

  test('first order card — layout and actions', async ({ ordersPage }) => {
    await screenshotComponent(
      ordersPage.orderCards.first(),
      'orders-first-card.png',
      { maxDiffPixels: 200 },
    );
  });

  test('hold banner on orders page', async ({ ordersPage }) => {
    await screenshotComponent(
      ordersPage.holdBanner,
      'orders-hold-banner.png',
    );
  });

  // ── Responsive screenshots ────────────────────────────────────────────────

  test('orders layout — mobile (375px)', async ({ ordersPage }) => {
    await screenshotAtViewport(ordersPage.page, 'mobile', 'orders-mobile.png');
  });

  test('orders layout — tablet (768px)', async ({ ordersPage }) => {
    await screenshotAtViewport(ordersPage.page, 'tablet', 'orders-tablet.png');
  });

  test('orders layout — desktop (1280px)', async ({ ordersPage }) => {
    await screenshotPage(ordersPage.page, 'orders-desktop.png');
  });

  // ── Design token validation ───────────────────────────────────────────────

  test('Contact Support button text color matches token', async ({ ordersPage }) => {
    const violations = await validateTokens(
      ordersPage.page,
      'button:has-text("Contact Support")',
      {
        'font-weight': TYPOGRAPHY_TOKENS.weightBold,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('page background color matches token', async ({ ordersPage }) => {
    const violations = await validateTokens(ordersPage.page, 'body', {
      'background-color': COLOR_TOKENS.pageBackground,
    });
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
