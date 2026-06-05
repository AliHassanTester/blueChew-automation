import { test, expect, type Page } from '@playwright/test';
import { getRegistrationData } from '../../src/data/login/registration.data';
import {
  disableAnimations,
  screenshotAtViewport,
  screenshotComponent,
  validateTokens,
  formatViolations,
} from '../../helpers/visual.helper';
import { COLOR_TOKENS, TYPOGRAPHY_TOKENS } from '../../constants/design-tokens.constants';

test.use({ browserName: 'chromium' });

const { registrationDetails: d } = getRegistrationData('AQ-01-Sign-up-To-Approved-Order-E2E');
const { quizAnswers } = d;
const QUIZ_URL = d.quizURL;

async function navigateToResults(page: Page): Promise<void> {
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

  await page.locator('[data-test-id="results-page-root"]').waitFor({ state: 'visible', timeout: 20_000 });
  await disableAnimations(page);
}

test.describe('Visual: Results Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToResults(page);
  });

  // ── Snapshot tests ───────────────────────────────────────────────────────────

  test('Results page — iPhone X snapshot matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'iphone-x', 'results-page-iphone-x');
  });

  test('Results page — desktop 1440p snapshot matches baseline', async ({ page }) => {
    await screenshotAtViewport(page, 'desktop-1440', 'results-page-desktop-1440');
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
        color:              COLOR_TOKENS.invertedCTAText,
        'background-color': COLOR_TOKENS.invertedCTABackground,
        'font-weight':      TYPOGRAPHY_TOKENS.weightBold,
        'font-size':        TYPOGRAPHY_TOKENS.resultsCTAFontSize,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

  test('Results page heading design tokens are compliant', async ({ page }) => {
    await page.locator('[data-test-id="results-page-root"]').waitFor({ state: 'visible' });
    const violations = await validateTokens(
      page,
      '[data-test-id="results-page-root"] h1, [data-test-id="results-page-root"] h2',
      {
        color:       COLOR_TOKENS.darkHeadingText,
        'font-size': TYPOGRAPHY_TOKENS.displayHeadingFontSize,
      },
    );
    expect(violations, formatViolations(violations)).toHaveLength(0);
  });

});
