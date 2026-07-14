import { Page, TestInfo, test, Locator } from '@playwright/test';
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

  /** Answer tiles are indexed, so this is a dynamic builder rather than a static entry. */
  private answerButton(index: number): Locator {
    return this.page.locator(`[data-test-id="quiz-answer-${index}"]`);
  }

  private async waitForAnswerButtons(): Promise<void> {
    await this.answerButton(0).waitFor({ state: 'visible' });
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
          await this.answerButton(answers[i]).click();

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
      // After the last answer the quiz shows a loading screen then navigates
      // to /results. Wait for the results root element to confirm arrival.
      await this.verify.waitForVisibility(this.locators.resultsPageRoot);
    });
  }
}
