import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { VisualHelper } from '@utilities/visual.helper';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import {
  REGISTRATION_FIGMA_CONFIG,
  MEDICAL_FIGMA_CONFIG,
  GOLD_TRANSITION_FIGMA_CONFIG,
  CONFIRMATION_FIGMA_CONFIG,
} from '@data/visual/figma.visual.data';

export class ProductPage {
  public readonly page: Page;
  private readonly actions: PlaywrightActionFactory;
  private readonly verify: PlaywrightVerificationFactory;
  private readonly visual: VisualHelper;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo, visual: VisualHelper) {
    this.page = page;
    this.actions = new PlaywrightActionFactory(page, testInfo);
    this.verify = new PlaywrightVerificationFactory(page, testInfo);
    this.visual = visual;

    this.locators = {
      heroContent: {
        description: 'Product hero content',
        locator: this.page.locator('main').or(this.page.locator('body')),
      },
      selectPlanButton: {
        description: 'SELECT A PLAN / Product Start button',
        locator: this.page
          .locator('//div[@class="cta-section"]//button')
          .or(this.page.locator('//button[@class="product-start-button"]')),
      },
      startNowButton: {
        description: 'START NOW / CONTINUE button (on Plan page)',
        locator: this.page
          .locator("//button[text()='START NOW']")
          .or(this.page.locator("button:has-text('START NOW')"))
          .or(this.page.locator("//button[text()='CONTINUE']"))
          .or(this.page.locator("button:has-text('CONTINUE')")),
      },
    };
  }

  async selectPlanAndProceed(): Promise<void> {
    await test.step('Select a plan and proceed to checkout funnel', async () => {
      const productStartBtn = this.page
        .locator('button.product-start-button, .product-start-button, a[href*="/plan"], button:has-text("GET STARTED"), a:has-text("GET STARTED"), button:has-text("SELECT A PLAN"), a:has-text("SELECT A PLAN"), .cta-section button, .cta-button')
        .filter({ visible: true });

      if ((await productStartBtn.count()) > 0) {
        await productStartBtn.first().scrollIntoViewIfNeeded().catch(() => undefined);
        await productStartBtn.first().click({ force: true }).catch(async () => {
          await this.page.evaluate(() => {
            const btn = document.querySelector<HTMLElement>('button.product-start-button, .product-start-button, a[href*="/plan"], .cta-section button, .cta-button');
            btn?.click();
          });
        });
      } else {
        await this.page.evaluate(() => {
          const btn = document.querySelector<HTMLElement>('.cta-section button, .cta-button, button.product-start-button, .product-start-button, a[href*="/plan"]');
          btn?.click();
        });
      }

      await this.page.waitForLoadState();
      await this.locators.startNowButton.locator.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

      if (await this.locators.startNowButton.locator.isVisible().catch(() => false)) {
        await this.actions.click(this.locators.startNowButton).catch(async () => {
          await this.actions.forceClick(this.locators.startNowButton);
        });
      }
      await this.page.waitForLoadState('domcontentloaded');
    });
  }

  async navigateToProductPage(url: string, pageName: string = 'Product'): Promise<void> {
    await test.step(`Navigate to the ${pageName} page`, async () => {
      await this.actions.navigateToURL(url);
      await this.actions.waitForDomLoad();
    });
  }

  async captureProductSnapshot(visualConfig?: ApplitoolsVisualConfig, tag: string = 'Product page loaded'): Promise<void> {
    await test.step(`Capture the fully loaded ${tag} state`, async () => {
      await this.page.waitForLoadState('load').catch(() => undefined);
      await this.visual.captureCheckpoint(tag, visualConfig);
    });
  }

  /**
   * Navigate to product landing page, capture visual baseline, and select plan.
   */
  async selectPlanAndProceedToRegistration(data: any): Promise<void> {
    await this.navigateToProductPage(data.url, data.productName);
    await this.captureProductSnapshot(data.visualConfig, `${data.productName} product page`);
    await this.selectPlanAndProceed();
  }

  /**
   * Navigate to Homepage, capture visual baseline, and complete quiz funnel.
   */
  async startHomepageFunnel(data: any, quizPage: any, resultsPage: any): Promise<void> {
    await this.navigateToProductPage(data.url, 'Homepage');
    await this.captureProductSnapshot(data.visualConfig, 'Homepage loaded');
    await this.selectPlanAndProceed();
    await this.handleFunnelIntermediates(quizPage, resultsPage, data.registrationDetails?.quizAnswers);
  }

  /**
   * Handle intermediate quiz and recommendations flow if encountered.
   */
  async handleFunnelIntermediates(quizPage: any, resultsPage: any, quizAnswers?: number[]): Promise<void> {
    if (this.page.url().includes('/quiz')) {
      await test.step('Handle quiz and recommendation funnel', async () => {
        if (quizAnswers) {
          await quizPage.completeQuiz(quizAnswers);
        }
        await resultsPage.selectGoldPlan();
      });
    }
  }

  /**
   * Handle intermediate transition/informational screen (e.g. "Meet Gold") before checkout.
   */
  async handleTransitionScreen(figmaConfig?: ApplitoolsVisualConfig, tag = 'Transition Page'): Promise<void> {
    await test.step(`Handle ${tag} before checkout`, async () => {
      await this.page.waitForURL((url: URL) => !url.pathname.includes('/medical') && !url.pathname.includes('/checkout'), { timeout: 20_000 }).catch(() => undefined);
      if (figmaConfig) {
        await this.captureProductSnapshot(figmaConfig, tag);
      }
      const continueBtn = this.page.locator('button[class*="ds-button--primary"], :text-is("CONTINUE")').filter({ visible: true }).first();
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click().catch(() => undefined);
      }
    });
  }

  /**
   * Await order confirmation or account landing and capture confirmation baseline.
   */
  async captureConfirmationSnapshot(figmaConfig?: ApplitoolsVisualConfig, tag = 'Confirmation Page'): Promise<void> {
    await test.step(`Capture post-checkout ${tag} baseline`, async () => {
      await this.page.waitForURL(/\/confirmation|account/);
      await this.page.waitForLoadState('load').catch(() => undefined);
      await this.visual.captureCheckpoint(tag, figmaConfig);
    });
  }

  /**
   * Complete standard end-to-end checkout flow for standard product pages.
   */
  async executeStandardCheckoutFlow(
    scenario: any,
    fixtures: {
      registrationPage: any;
      medicalPage: any;
      checkoutPage: any;
      confirmationPage: any;
      adminPage: any;
    },
  ): Promise<void> {
    const { registrationPage, medicalPage, checkoutPage, confirmationPage, adminPage } = fixtures;
    const d = scenario.registrationDetails;

    await this.navigateToProductPage(scenario.url, scenario.productName);
    await this.captureProductSnapshot(scenario.visualConfig, `${scenario.productName} product page`);
    await this.selectPlanAndProceed();

    await registrationPage.completeRegistrationWizard(d);
    await medicalPage.completeMedicalAndProceed(d.medical);

    await checkoutPage.captureCheckoutSnapshot(scenario.visualConfig, `${scenario.productName} checkout page`);
    await checkoutPage.completeCheckoutAndPay(d.shipping, d.payment);

    await confirmationPage.submitIdAndAwaitProvider();
    await adminPage.approveAndCreateFirstOrder(d);
    await confirmationPage.verifyTelevisit();
  }

  /**
   * Execute the Homepage checkout visual flow (Homepage baseline -> Quiz/Funnel -> Medical -> Checkout baseline -> Confirmation baseline).
   */
  async executeHomeCheckoutFlow(
    scenario: any,
    fixtures: {
      registrationPage: any;
      quizPage: any;
      resultsPage: any;
      medicalPage: any;
      checkoutPage: any;
    },
  ): Promise<void> {
    const { registrationPage, quizPage, resultsPage, medicalPage, checkoutPage } = fixtures;
    const d = scenario.registrationDetails;

    await this.navigateToProductPage(scenario.url, 'Homepage');
    await this.captureProductSnapshot(scenario.visualConfig, 'Homepage loaded');
    await this.selectPlanAndProceed();
    await this.handleFunnelIntermediates(quizPage, resultsPage, d.quizAnswers);

    await registrationPage.completeRegistrationWizard(d);
    await this.page.waitForURL(/\/medical/);
    await medicalPage.completeMedicalProfile(d.medical, false);
    await this.handleTransitionScreen();

    await medicalPage.verifyNavigatedToCheckout();
    await checkoutPage.captureCheckoutSnapshot(scenario.visualConfig, 'Homepage checkout page');
    await checkoutPage.completeCheckoutAndPay(d.shipping, d.payment);
    await this.captureConfirmationSnapshot(CONFIRMATION_FIGMA_CONFIG, 'Homepage Confirmation Page');
  }

  /**
   * Execute the Gold product E2E checkout visual flow.
   */
  async executeGoldCheckoutFlow(
    scenario: any,
    fixtures: {
      registrationPage: any;
      medicalPage: any;
      checkoutPage: any;
    },
  ): Promise<void> {
    const { registrationPage, medicalPage, checkoutPage } = fixtures;
    const d = scenario.registrationDetails;

    await this.navigateToProductPage(scenario.url, scenario.productName);
    await this.captureProductSnapshot(scenario.visualConfig, 'Gold product page');
    await this.selectPlanAndProceed();

    await registrationPage.captureRegistrationSnapshot(REGISTRATION_FIGMA_CONFIG, 'Gold Registration Page');
    await registrationPage.completeRegistrationWizard(d);
    await this.page.waitForURL(/\/medical/);
    await medicalPage.captureMedicalSnapshot(MEDICAL_FIGMA_CONFIG, 'Gold Medical Page');
    await medicalPage.completeMedicalProfile(d.medical, false);
    await this.handleTransitionScreen(GOLD_TRANSITION_FIGMA_CONFIG, 'Gold Transition Page');

    await medicalPage.verifyNavigatedToCheckout();
    await checkoutPage.captureCheckoutSnapshot(scenario.visualConfig, 'Gold checkout page');
    await checkoutPage.completeCheckoutAndPay(d.shipping, d.payment);
    await this.captureConfirmationSnapshot(CONFIRMATION_FIGMA_CONFIG, 'Gold Confirmation Page');
  }

  /**
   * Execute the isolated Gold medical questionnaire visual flow (progressive step-by-step checkpoints).
   */
  async executeGoldMedicalVisualFlow(
    scenario: any,
    fixtures: {
      registrationPage: any;
      medicalPage: any;
    },
  ): Promise<void> {
    const { registrationPage, medicalPage } = fixtures;
    const d = scenario.registrationDetails;

    await this.navigateToProductPage(scenario.url, scenario.productName);
    await this.captureProductSnapshot(scenario.visualConfig, 'Gold product page');
    await this.selectPlanAndProceed();
    await registrationPage.completeRegistrationWizard(d);

    await this.page.waitForURL(/\/medical/);
    await medicalPage.captureGoldMedicalCheckpoint('Gold Medical Page');
    await medicalPage.completeMedicalProfile(d.medical, true);

    await this.handleTransitionScreen(GOLD_TRANSITION_FIGMA_CONFIG, 'Gold Transition Page');
  }
}
