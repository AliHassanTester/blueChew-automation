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
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS } from '../../constants/design-tokens.constants';

test.use({ browserName: 'chromium' });

const { registrationDetails: d } = getRegistrationData('AQ-01-User-Registration');
const { devGateURL, quizAnswers } = d;
const QUIZ_URL = d.postRegistrationURL; // https://dev.bluechew.com/quiz

/** Pass dev gate, navigate to quiz, answer all questions, and wait for results page. */
async function navigateToResults(page: Page): Promise<void> {
  // Pass app dev gate
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

  // Navigate to quiz domain
  await page.goto(QUIZ_URL, { waitUntil: 'domcontentloaded' });

  // Handle quiz-domain gate if present
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

  // Dismiss splash/intro if shown before first question
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

  // Answer every quiz question
  for (let i = 0; i < quizAnswers.length; i++) {
    await page.locator('[data-test-id="quiz-answer-0"]').waitFor({ state: 'visible', timeout: 15_000 });
    const progressBefore = await page
      .locator('[data-test-id="quiz-progress-text"]')
      .textContent()
      .catch(() => `${i}`);

    await page.locator(`[data-test-id="quiz-answer-${quizAnswers[i]}"]`).click();

    if (i < quizAnswers.length - 1) {
      await page.waitForFunction(
        (prev: string) => {
          const el = document.querySelector('[data-test-id="quiz-progress-text"]');
          return el !== null && el.textContent?.trim() !== prev;
        },
        progressBefore?.trim() ?? '',
        { timeout: 10_000 },
      );
    }
  }

  // Wait for results page
  await page.locator('[data-test-id="results-page-root"]').waitFor({ state: 'visible', timeout: 20_000 });
  await disableAnimations(page);
}

test.describe('Visual: Results Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToResults(page);
  });

  // ── Snapshot tests ───────────────────────────────────────────────────────────

  test('Results page full-viewport snapshot matches baseline', async ({ page }) => {
    await screenshotPage(page, 'results-page-desktop');
  });

  test('Results page on mobile viewport matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'mobile', 'results-page-mobile');
  });

  test('Results page on tablet viewport matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'tablet', 'results-page-tablet');
  });

  test('Results CTA button component snapshot matches baseline', async ({ page }) => {
    const ctaButton = page.locator('button.cta-button').first();
    await ctaButton.waitFor({ state: 'visible' });
    await screenshotComponent(ctaButton, 'results-cta-button');
  });

  // ── Design token validation ──────────────────────────────────────────────────

  test('TRY GOLD CTA button design tokens are compliant', async ({ page }) => {
    await page.locator('button.cta-button').first().waitFor({ state: 'visible' });
    const violations = await validateTokens(
      page,
      'button.cta-button',
      {
        color:            COLOR_TOKENS.primaryButtonText,
        'background-color': COLOR_TOKENS.primaryButtonBackground,
        'font-weight':    TYPOGRAPHY_TOKENS.weightBold,
        'font-size':      TYPOGRAPHY_TOKENS.buttonFontSize,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Results page heading design tokens are compliant', async ({ page }) => {
    await page.locator('[data-test-id="results-page-root"]').waitFor({ state: 'visible' });
    // h1 or h2 inside the results root is the recommendation headline
    const violations = await validateTokens(
      page,
      '[data-test-id="results-page-root"] h1, [data-test-id="results-page-root"] h2',
      {
        color:       COLOR_TOKENS.headingText,
        'font-size': TYPOGRAPHY_TOKENS.headingFontSize,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Results page body copy design tokens are compliant', async ({ page }) => {
    await page.locator('[data-test-id="results-page-root"]').waitFor({ state: 'visible' });
    const violations = await validateTokens(
      page,
      '[data-test-id="results-page-root"] p',
      {
        color:       COLOR_TOKENS.bodyText,
        'font-size': TYPOGRAPHY_TOKENS.baseFontSize,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });
});
