import { test } from '@fixtures/page.fixtures';
import { logTestCaseData } from '@utilities/test.helper.utils';
import { getHeroesData } from '@data/product/heroes.data';

test.describe('Feature: American Heroes Program Checkout Flows', () => {

  // ── 1. Direct Hero Registration & Checkout Flow (Jam 1: ad80c5b5-a07a-4da1-b9bc-28648ec416fa)
  const directScenario = getHeroesData('HEROES-001-Direct-Registration-Checkout');
  test(
    `Test case: '${directScenario.testCaseData.testCase}'
    Description: '${directScenario.testCaseData.testDescription}'
    Tags: '${directScenario.testCaseData.tags}'
  `,
    { tag: ['@heroes', '@direct', '@product', '@e2e'] },
    async ({ heroesPage, registrationPage, quizPage, resultsPage, medicalPage, checkoutPage }, testInfo) => {
      const d = directScenario.registrationDetails;
      await logTestCaseData(testInfo, directScenario.testCaseData, {
        epic: 'American Heroes',
        feature: 'Heroes Checkout Funnel',
        story: 'Homepage Footer → Direct Hero Registration & Checkout',
      });
      testInfo.annotations.push({ type: 'Test Email', description: d.email });

      // Step 1: Start from Homepage and navigate to /heroes via bottom footer CTA
      await heroesPage.navigateToHeroesViaFooter(directScenario.homeURL);

      // Step 2: Click "GET STARTED HERE" on American Heroes page
      await heroesPage.clickGetStartedHere();

      // Step 3: Complete 3-step registration wizard (/register?h=1)
      await registrationPage.completeRegistrationWizard(d);

      // Step 4: Complete Military Hero status verification (/verify-hero?h=1)
      await heroesPage.completeHeroStatusVerification(directScenario.heroBranch);

      // Step 5: Handle Quiz & Results if routed through recommendation funnel
      await quizPage.page.waitForURL(/\/quiz|\/medical/, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      if (heroesPage.page.url().includes('/quiz')) {
        await quizPage.completeQuiz(directScenario.quizAnswers || [0, 1, 2]);
        await resultsPage.selectGoldPlan();
      }

      // Step 6: Complete Medical Profile (/medical)
      await medicalPage.page.waitForURL(/\/medical/, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      await medicalPage.completeMedicalAndProceed(d.medical);

      // Step 7: Handle Checkout strength/frequency selection if present
      await heroesPage.selectStrengthAndFrequency();

      // Step 8: Validate Hero discount applied in order summary
      await heroesPage.verifyHeroCouponApplied();

      // Step 9: Complete checkout
      await checkoutPage.completeCheckout(d.shipping);
    },
  );

  // ── 2. Header CTA Quiz Funnel & Checkout Flow (Jam 2: 232522fb-935e-40ba-9e3e-835ebfad3ce9)
  const quizScenario = getHeroesData('HEROES-002-Quiz-Funnel-Checkout');
  test(
    `Test case: '${quizScenario.testCaseData.testCase}'
    Description: '${quizScenario.testCaseData.testDescription}'
    Tags: '${quizScenario.testCaseData.tags}'
  `,
    { tag: ['@heroes', '@quiz', '@product', '@e2e'] },
    async ({ heroesPage, quizPage, resultsPage, registrationPage, medicalPage, checkoutPage }, testInfo) => {
      const d = quizScenario.registrationDetails;
      await logTestCaseData(testInfo, quizScenario.testCaseData, {
        epic: 'American Heroes',
        feature: 'Heroes Checkout Funnel',
        story: 'Homepage Footer → Quiz Funnel & Checkout',
      });
      testInfo.annotations.push({ type: 'Test Email', description: d.email });

      // Step 1: Start from Homepage and navigate to /heroes via bottom footer CTA
      await heroesPage.navigateToHeroesViaFooter(quizScenario.homeURL);

      // Step 2: Click "TRY NOW" header CTA on American Heroes page
      await heroesPage.clickTryNow();

      // Step 3: Complete Quiz (/quiz)
      await quizPage.completeQuiz(quizScenario.quizAnswers || [0, 1, 2]);

      // Step 4: Select Gold Recommendation (/results)
      await resultsPage.selectGoldPlan();

      // Step 5: Complete Registration (/register)
      await registrationPage.page.waitForURL(/\/register/, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      await registrationPage.completeRegistrationWizard(d);

      // Step 6: Complete Hero verification if presented (/verify-hero)
      if (heroesPage.page.url().includes('/verify-hero')) {
        await heroesPage.completeHeroStatusVerification(quizScenario.heroBranch);
      }

      // Step 7: Complete Medical Profile (/medical)
      await medicalPage.page.waitForURL(/\/medical/, { waitUntil: 'domcontentloaded', timeout: 25_000 });
      await medicalPage.completeMedicalAndProceed(d.medical);

      // Step 8: Handle strength & frequency selection if on checkout carousel
      await heroesPage.selectStrengthAndFrequency();

      // Step 9: Validate Hero discount applied in order summary if hero verification completed
      if (heroesPage.page.url().includes('h=1') || heroesPage.page.url().includes('hero')) {
        await heroesPage.verifyHeroCouponApplied();
      }

      // Step 10: Complete checkout
      await checkoutPage.completeCheckout(d.shipping);
    },
  );
});
