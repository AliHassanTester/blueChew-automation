/**
 * This file previously tested a generic "Dashboard" page that doesn't exist
 * in the real BlueChew application. The equivalent tests have been moved to:
 *
 *   tests/e2e/membership.spec.ts  — /account/membership (post-login landing)
 *   tests/e2e/navigation.spec.ts  — Nav menu and logout flow
 *
 * Keeping this file to avoid breaking any CI references while the team migrates.
 */

import { test } from '../../fixtures/auth.fixture';
import { addAllureMeta } from '../../reporters/allure.config';

test.describe('Account Home (MY PLAN redirect)', { tag: ['@e2e', '@regression'] }, () => {
  test.beforeEach(async ({ membershipPage }) => {
    await membershipPage.navigate();
  });

  test('authenticated user lands on /account/membership', async ({ membershipPage }) => {
    await addAllureMeta({ feature: 'Membership', severity: 'blocker', layer: 'e2e' });
    await membershipPage.assertFullyLoaded();
  });
});
