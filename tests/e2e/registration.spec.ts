/**
 * Registration E2E — app.bluechew.com/register
 *
 * Tests verify the registration page is reachable and its key UI elements
 * are present. We do not create real accounts in CI since this is production.
 * Full registration flow testing requires a staging environment.
 */
import { test, expect } from '../../fixtures/base.fixture';
import { addAllureMeta } from '../../reporters/allure.config';

test.describe('Registration Page', { tag: ['@e2e', '@regression'] }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://app.bluechew.com/register', { waitUntil: 'domcontentloaded' });
  });

  test(
    'registration page is reachable',
    { tag: '@smoke' },
    async ({ page }) => {
      await addAllureMeta({
        feature: 'Registration',
        story: 'Page Reachable',
        severity: 'critical',
        layer: 'e2e',
      });

      expect(page.url()).toMatch(/\/register/);
    },
  );

  test(
    'registration page has Log In link',
    { tag: '@regression' },
    async ({ page }) => {
      const loginLink = page.locator('a[href*="log-in"]');
      await expect(loginLink).toBeVisible();
    },
  );

  test(
    'navigating to Log In from registration works',
    { tag: '@regression' },
    async ({ page }) => {
      const loginLink = page.locator('a[href*="log-in"]').first();
      await loginLink.click();
      await expect(page).toHaveURL(/\/log-in/);
    },
  );
});
