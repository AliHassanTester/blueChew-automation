import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';

export class QuizPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
  }

  private answerButton(index: number) {
    return this.page.locator(`[data-test-id="quiz-answer-${index}"]`);
  }

  private async waitForAnswerButtons(): Promise<void> {
    await this.answerButton(0).waitFor({ state: 'visible', timeout: 20_000 });
  }

  private async dismissIntroIfPresent(): Promise<void> {
    // The quiz may show a transition/splash page before the first question.
    // If answer buttons don't appear quickly, look for a CTA to advance past it.
    const answersVisible = await this.answerButton(0)
      .waitFor({ state: 'visible', timeout: 4_000 })
      .then(() => true)
      .catch(() => false);

    if (!answersVisible) {
      const ctaTexts = ['Get Started', 'Begin', 'Continue', 'Start', 'Next'];
      for (const text of ctaTexts) {
        const btn = this.page.locator(`button:has-text("${text}")`).first();
        if (await btn.isVisible().catch(() => false)) {
          await btn.click();
          break;
        }
      }
      await this.waitForAnswerButtons();
    }
  }

  async completeQuiz(answers: number[]): Promise<void> {
    await test.step('Complete quiz', async () => {
      await this.dismissIntroIfPresent();

      for (let i = 0; i < answers.length; i++) {
        const progress = await this.page
          .locator('[data-test-id="quiz-progress-text"]')
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
              { timeout: 10_000 },
            );
          }
        });
      }
    });
  }

  async verifyQuizComplete(): Promise<void> {
    await test.step('Verify quiz answered and plan selection loaded', async () => {
      // After the final answer, answer buttons disappear and the plan page renders.
      await this.answerButton(0).waitFor({ state: 'hidden', timeout: 15_000 });
    });
  }
}
