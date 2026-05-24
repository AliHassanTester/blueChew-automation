import { test, expect, type Page } from '@playwright/test';
import { getRegistrationData } from '../../src/data/login/registration.data';
import {
  disableAnimations,
  screenshotPage,
  screenshotComponent,
  screenshotAtViewport,
  validateTokens,
  formatViolations,
} from '../../helpers/visual.helper';
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS, SPACING_TOKENS } from '../../constants/design-tokens.constants';

test.use({ browserName: 'chromium' });

const { registrationDetails: d } = getRegistrationData('AQ-01-User-Registration');
const { devGateURL } = d;
const QUIZ_URL = d.postRegistrationURL; // https://dev.bluechew.com/quiz

/** Pass the dev gate (handles both app and quiz domains) and land on the quiz. */
async function navigateToQuiz(page: Page): Promise<void> {
  // Pass the app dev gate first (sets session cookies / clears gate wall)
  await page.goto(devGateURL, { waitUntil: 'domcontentloaded' });
  const appGateVisible = await page
    .locator("input[formcontrolname='password']")
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
  if (appGateVisible) {
    await page.locator("input[formcontrolname='password']").fill(process.env.DEV_GATE_PASSWORD || 'dev');
    await page.locator("//button[normalize-space()='Submit']").click();
    await page.waitForLoadState('domcontentloaded');
  }

  // Navigate to quiz URL (dev.bluechew.com domain)
  await page.goto(QUIZ_URL, { waitUntil: 'domcontentloaded' });

  // Handle a dev gate on the quiz domain if present
  const quizGateVisible = await page
    .locator("input[formcontrolname='password']")
    .isVisible({ timeout: 3_000 })
    .catch(() => false);
  if (quizGateVisible) {
    await page.locator("input[formcontrolname='password']").fill(process.env.DEV_GATE_PASSWORD || 'dev');
    await page.locator("//button[normalize-space()='Submit']").click();
    await page.waitForLoadState('domcontentloaded');
    await page.goto(QUIZ_URL, { waitUntil: 'domcontentloaded' });
  }

  // Dismiss splash/intro screen if the quiz hasn't started yet
  const answersVisible = await page
    .locator('[data-test-id="quiz-answer-0"]')
    .isVisible({ timeout: 4_000 })
    .catch(() => false);

  if (!answersVisible) {
    for (const text of ['Get Started', 'Begin', 'Start', 'Continue']) {
      const btn = page.locator(`button:has-text("${text}")`).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        break;
      }
    }
    await page.locator('[data-test-id="quiz-answer-0"]').waitFor({ state: 'visible', timeout: 15_000 });
  }

  await disableAnimations(page);
}

test.describe('Visual: Quiz Page (/quiz)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToQuiz(page);
  });

  // ── Snapshot tests ───────────────────────────────────────────────────────────

  test('Quiz question full-viewport snapshot matches baseline', async ({ page }) => {
    await screenshotPage(page, 'quiz-question-desktop');
  });

  test('Quiz question on mobile viewport matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'mobile', 'quiz-question-mobile');
  });

  test('Quiz question on tablet viewport matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'tablet', 'quiz-question-tablet');
  });

  test('Quiz answer button component snapshot matches baseline', async ({ page }) => {
    const firstAnswer = page.locator('[data-test-id="quiz-answer-0"]');
    await firstAnswer.waitFor({ state: 'visible' });
    await screenshotComponent(firstAnswer, 'quiz-answer-button');
  });

  // ── Design token validation ──────────────────────────────────────────────────

  test('Quiz answer button design tokens are compliant', async ({ page }) => {
    await page.locator('[data-test-id="quiz-answer-0"]').waitFor({ state: 'visible' });
    const violations = await validateTokens(
      page,
      '[data-test-id="quiz-answer-0"]',
      {
        'font-size':   TYPOGRAPHY_TOKENS.baseFontSize,
        'font-weight': TYPOGRAPHY_TOKENS.weightMedium,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Quiz progress indicator design tokens are compliant', async ({ page }) => {
    await page.locator('[data-test-id="quiz-progress-text"]').waitFor({ state: 'visible' });
    const violations = await validateTokens(
      page,
      '[data-test-id="quiz-progress-text"]',
      {
        'font-size': TYPOGRAPHY_TOKENS.baseFontSize,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Quiz body text uses correct font family', async ({ page }) => {
    await page.locator('[data-test-id="quiz-answer-0"]').waitFor({ state: 'visible' });
    // Validate font family on a paragraph/heading element — should be Inter
    const violations = await validateTokens(
      page,
      'body',
      {
        'font-family': TYPOGRAPHY_TOKENS.bodyFontFamily,
      },
    );
    // font-family check is a substring check since getComputedStyle returns full stack
    const fontViolations = violations.filter(
      (v) => !v.actual.toLowerCase().includes(TYPOGRAPHY_TOKENS.bodyFontFamily.toLowerCase()),
    );
    expect(fontViolations, formatViolations(fontViolations)).toHaveLength(0);
  });
});
