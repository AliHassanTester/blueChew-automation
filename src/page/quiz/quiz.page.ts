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
    await this.answerButton(0).waitFor({ state: 'visible' });
  }

  // ── Navigation (used by visual tests for direct navigation to quiz) ──────────

  async navigateToQuiz(quizURL: string): Promise<void> {
    await test.step('Navigate to quiz page and pass dev gate if present', async () => {
      await this.actions.navigateToURL(quizURL);
      await this.actions.waitForDomLoad();

      const gateInput = this.page.locator("input[formcontrolname='password']");
      if (await gateInput.isVisible().catch(() => false)) {
        await gateInput.fill(process.env.DEV_GATE_PASSWORD || 'dev');
        await this.page.locator("//button[normalize-space()='Submit']").click();
        await this.actions.waitForDomLoad();
        await this.actions.navigateToURL(quizURL);
        await this.actions.waitForDomLoad();
      }

      // Transition screen auto-advances — wait for first question
      await this.waitForAnswerButtons();
    });
  }

  // ── Quiz answering ────────────────────────────────────────────────────────────

  async completeQuiz(answers: number[]): Promise<void> {
    await test.step('Complete quiz', async () => {
      // After registration redirects here, the quiz-domain dev gate may appear
      // (separate from the app-domain gate passed at test start)
      const gateInput = this.page.locator("input[formcontrolname='password']");
      if (await gateInput.isVisible().catch(() => false)) {
        await gateInput.fill(process.env.DEV_GATE_PASSWORD || 'dev');
        await this.page.locator("//button[normalize-space()='Submit']").click();
        await this.actions.waitForDomLoad();
      }

      // Transition/splash screen auto-advances — wait for first question to appear
      await this.waitForAnswerButtons();

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
      await this.page
        .locator('[data-test-id="results-page-root"]')
        .waitFor({ state: 'visible' });
    });
  }
}
