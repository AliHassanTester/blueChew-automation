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
 * Profile — Visual Regression + Design Token Tests
 *
 * Captures the /account/profile page: user details, notification toggles,
 * and sub-page navigation links.
 *
 * First run: npx playwright test tests/visual/profile.visual.spec.ts --update-snapshots
 */
test.use({ browserName: 'chromium' });

test.describe('Profile — Visual', { tag: '@visual' }, () => {
  test.beforeEach(async ({ profilePage }) => {
    await profilePage.navigate();
    await profilePage.assertFullyLoaded();
    await disableAnimations(profilePage.page);
  });

  // ── Component screenshots ─────────────────────────────────────────────────

  test('profile details section', async ({ profilePage }) => {
    await screenshotComponent(
      profilePage.userNameHeading,
      'profile-username-heading.png',
    );
  });

  test('notification toggles section', async ({ profilePage }) => {
    await screenshotComponent(
      profilePage.smsToggle,
      'profile-sms-toggle.png',
    );
  });

  test('nav menu open — profile page', async ({ profilePage }) => {
    await profilePage.nav.open();
    await profilePage.nav.assertPanelVisible();
    await screenshotPage(profilePage.page, 'profile-nav-open.png');
  });

  // ── Responsive screenshots ────────────────────────────────────────────────

  test('profile layout — mobile (375px)', async ({ profilePage }) => {
    await screenshotAtViewport(profilePage.page, 'mobile', 'profile-mobile.png');
  });

  test('profile layout — desktop (1280px)', async ({ profilePage }) => {
    await screenshotPage(profilePage.page, 'profile-desktop.png');
  });

  // ── Design token validation ───────────────────────────────────────────────

  test('user name heading font weight matches token', async ({ profilePage }) => {
    const violations = await validateTokens(
      profilePage.page,
      '[data-testid="account-profile-page"] h1, [data-testid="account-profile-page"] h2',
      {
        'font-weight': TYPOGRAPHY_TOKENS.weightBold,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('page background color matches token', async ({ profilePage }) => {
    const violations = await validateTokens(profilePage.page, 'body', {
      'background-color': COLOR_TOKENS.pageBackground,
    });
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
