import { Page } from '@playwright/test';

/**
 * Passes the dev-environment password gate when it is presented, and no-ops when absent.
 * The gate no longer appears on every session/route, so it is always handled conditionally.
 *
 * Shared by every flow that can land on it (login, registration, quiz, results) so the
 * gate logic lives in exactly one place. Navigation and post-gate readiness waits stay with
 * each caller, since those differ per page.
 */
export async function passDevGateIfPresent(page: Page): Promise<void> {
  const gateInput = page.locator("//input[@formcontrolname='password']");
  if (!(await gateInput.isVisible().catch(() => false))) return;

  await gateInput.fill(process.env.DEV_GATE_PASSWORD || 'dev');
  await page
    .locator("[data-test-id='dev-login-submit-button']")
    .or(page.locator("//button[normalize-space()='Submit']"))
    .first()
    .click();
  await page.waitForLoadState('domcontentloaded');
}
