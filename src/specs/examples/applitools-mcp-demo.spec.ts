import { test } from '@fixtures/page.fixtures';
import { LOGIN_INITIAL_FIGMA_CONFIGS } from '@data/visual/figma.visual.data';

/**
 * Demo test case demonstrating the native Applitools Playwright fixture integration.
 * This test uses the native `{ eyes }` fixture which hooks directly into the Playwright HTML reporter,
 * making the test results fully queryable by the Applitools MCP tools (like eyes_fetch_visual_results).
 */
test.describe('Applitools MCP Native Integration Demo', () => {
  // We use the eyes fixture from our extended fixture file
  test('LOG-VISUAL-MCP-DEMO - Native Applitools Visual Checkpoints', async ({ page, loginPage, eyes }) => {
    // 1. Navigate to the login page using POM
    await loginPage.navigateToLoginPage('/log-in');

    // 2. Capture a visual checkpoint of the initial state using the native eyes fixture.
    // The MCP tool 'eyes_add_checkpoints_to_test' helps generate assertions like this.
    console.log('[Applitools Demo] Capturing step 1: Initial Login State');
    await eyes.check('01 - Login Page Initial State');

    // 3. Fill in details using POM
    await loginPage.fillLoginCredentials({ username: 'patient@bluechew.com', password: 'Password123!' });

    // 4. Capture a second checkpoint to show stepped progress in a single test run
    console.log('[Applitools Demo] Capturing step 2: Credentials Entered');
    await eyes.check('02 - Credentials Entered');
  });
});
