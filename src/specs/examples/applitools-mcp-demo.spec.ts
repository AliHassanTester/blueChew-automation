import { test } from '@fixtures/page.fixtures';
import { LOGIN_INITIAL_FIGMA_CONFIGS } from '@data/visual/figma.visual.data';

/**
 * Demo test case demonstrating the native Applitools Playwright fixture integration.
 * This test uses the native `{ eyes }` fixture which hooks directly into the Playwright HTML reporter,
 * making the test results fully queryable by the Applitools MCP tools (like eyes_fetch_visual_results).
 */
test.describe('Applitools MCP Native Integration Demo', () => {
  // Applitools fixture is temporarily disabled in favor of Native Playwright Visual Regression
  test.skip('LOG-VISUAL-MCP-DEMO - Native Applitools Visual Checkpoints', async ({ loginPage, visual }) => {
    // 1. Navigate to the login page using POM
    await loginPage.navigateToLoginPage('/log-in');

    // 2. Capture a visual checkpoint of the initial state
    console.log('[Visual Demo] Capturing step 1: Initial Login State');
    await visual.captureSnapshot('01-mcp-demo-initial');

    // 3. Fill in details using POM
    await loginPage.fillLoginCredentials({ username: 'patient@bluechew.com', password: 'Password123!' });

    // 4. Capture a second checkpoint
    console.log('[Visual Demo] Capturing step 2: Credentials Entered');
    await visual.captureSnapshot('02-mcp-demo-credentials');
  });
});
