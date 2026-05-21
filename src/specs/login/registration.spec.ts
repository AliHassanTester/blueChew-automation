import { logTestCaseData } from '@utilities/test.helper.utils';
import { getRegistrationData } from '@data/login/registration.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getRegistrationData('AQ-01-User-Registration');

test.describe('Feature: User Registration', () => {
  test(
    `
    Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({ registrationPage, quizPage }) => {
      logTestCaseData(test.info(), scenario.testCaseData);

      await test.step('Navigate to registration page via Sign Up link', async () => {
        await registrationPage.navigateToRegistrationPage(scenario.registrationDetails);
      });

      await test.step('Complete registration wizard (state → email → password)', async () => {
        await registrationPage.completeRegistrationWizard(scenario.registrationDetails);
      });

      await test.step('Verify successful registration and quiz page loaded', async () => {
        await registrationPage.verifyRegistrationSuccess(scenario.registrationDetails.postRegistrationURL);
      });

      await quizPage.completeQuiz(scenario.registrationDetails.quizAnswers);
      await quizPage.verifyQuizComplete();
    },
  );
});
