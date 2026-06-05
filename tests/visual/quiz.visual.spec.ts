import { test, expect, type Page } from '@playwright/test';
import { getRegistrationData } from '../../src/data/login/registration.data';
import {
  disableAnimations,
  screenshotAtViewport,
  screenshotComponent,
  validateTokens,
  formatViolations,
} from '../../helpers/visual.helper';
import { TYPOGRAPHY_TOKENS } from '../../constants/design-tokens.constants';

test.use({ browserName: 'chromium' });

const { registrationDetails: d } = getRegistrationData('AQ-01-Sign-up-To-Approved-Order-E2E');
const QUIZ_URL = d.quizURL;

async function navigateToQuiz(page: Page): Promise<void> {
  await page.goto(QUIZ_URL, { waitUntil: 'domcontentloaded' });

  // Pass quiz-domain dev gate if present
  const gateVisible = await page
    .locator("input[formcontrolname='password']")
    .isVisible({ timeout: 5_000 })
    .catch(() => false);
  if (gateVisible) {
    await page.locator("input[formcontrolname='password']").fill(process.env.DEV_GATE_PASSWORD || 'dev');
    await page.locator("//button[normalize-space()='Submit']").click();
    await page.waitForLoadState('domcontentloaded');
    await page.goto(QUIZ_URL, { waitUntil: 'domcontentloaded' });
  }

  // Transition screen auto-advances — wait for the first question
  await page.locator('[data-test-id="quiz-answer-0"]').waitFor({ state: 'visible', timeout: 20_000 });
  await disableAnimations(page);
}

test.describe('Visual: Quiz Page (/quiz)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToQuiz(page);
  });

  // ── Snapshot tests ───────────────────────────────────────────────────────────

  test('Quiz question — iPhone X snapshot matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'iphone-x', 'quiz-question-iphone-x');
  });

  test('Quiz question — desktop 1440p snapshot matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'desktop-1440', 'quiz-question-desktop-1440');
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
        'font-weight': TYPOGRAPHY_TOKENS.weightRegular,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Quiz progress indicator design tokens are compliant', async ({ page }) => {
    await page.locator('[data-test-id="quiz-progress-text"]').waitFor({ state: 'visible' });
    const violations = await validateTokens(
      page,
      '[data-test-id="quiz-progress-text"]',
      { 'font-size': TYPOGRAPHY_TOKENS.baseFontSize },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Quiz body text uses correct font family', async ({ page }) => {
    await page.locator('[data-test-id="quiz-answer-0"]').waitFor({ state: 'visible' });
    const violations = await validateTokens(page, 'body', { 'font-family': TYPOGRAPHY_TOKENS.quizFontFamily });
    const fontViolations = violations.filter(
      (v) => !v.actual.toLowerCase().includes(TYPOGRAPHY_TOKENS.quizFontFamily.toLowerCase()),
    );
    expect(fontViolations, formatViolations(fontViolations)).toHaveLength(0);
  });
});
