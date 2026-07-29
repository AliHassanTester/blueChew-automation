import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';

/**
 * Quiz wizard (dev.bluechew.com/quiz). Stable elements live in the LocatorInfo map;
 * the answer tiles are indexed, so they stay a dynamic builder (`answerButton`).
 */
export class QuizPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);

    this.locators = {
      // ── Quiz ───────────────────────────────────────────────────────────────
      progressText: {
        description: 'Quiz Progress Indicator',
        locator: this.page.locator('[data-test-id="quiz-progress-text"]'),
      },
      resultsPageRoot: {
        description: 'Results Page Root (post-quiz navigation marker)',
        locator: this.page.locator('[data-test-id="results-page-root"]'),
      },
    };
  }

  // ── Dynamic locators ─────────────────────────────────────────────────────────
  // Answer tiles are indexed (quiz-answer-0, -1, …), so they take a runtime argument
  // and can't be a fixed entry in the locators list above — build them on demand.
  private answerButton(index: number): LocatorInfo {
    return {
      description: `Quiz Answer Tile ${index}`,
      locator: this.page.locator(`[data-test-id="quiz-answer-${index}"]`),
    };
  }

  private async waitForAnswerButtons(): Promise<void> {
    await this.verify.waitForVisibility(this.answerButton(0));
  }

  // ── Quiz answering ────────────────────────────────────────────────────────────

  async completeQuiz(answers: number[]): Promise<void> {
    await test.step('Complete quiz', async () => {
      // Transition/splash screen auto-advances — wait for first question to appear
      await this.waitForAnswerButtons();

      for (let i = 0; i < answers.length; i++) {
        const progress = await this.locators.progressText.locator
          .textContent()
          .catch(() => `${i + 1}`);

        await test.step(`Answer question ${progress?.trim() ?? i + 1}`, async () => {
          await this.waitForAnswerButtons();
          await this.actions.click(this.answerButton(answers[i]));

          if (i < answers.length - 1) {
            // Wait for progress text to change — confirms next question loaded
            await this.page.waitForFunction(
              (prev: string) => {
                const el = document.querySelector('[data-test-id="quiz-progress-text"]');
                return el !== null && el.textContent?.trim() !== prev;
              },
              progress?.trim() ?? '',
            );
          }
        });
      }
    });
  }

  async verifyQuizComplete(): Promise<void> {
    await test.step('Verify quiz complete — results page loaded', async () => {
      await this.page.waitForLoadState('load');
      await this.verify.waitForVisibility(this.locators.resultsPageRoot);
    });
  }

  /** Answer every quiz question, then confirm the results page has loaded. */
  async completeQuizAndVerify(answers: number[]): Promise<void> {
    await test.step('Complete quiz and confirm results page', async () => {
      await this.completeQuiz(answers);
      await this.verifyQuizComplete();
    });
  }
}
