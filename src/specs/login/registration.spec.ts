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
    async ({ registrationPage }) => {
      logTestCaseData(test.info(), scenario.testCaseData);

      await test.step('Navigate to registration page', async () => {
        await registrationPage.navigateToRegistrationPage(scenario.registrationDetails.mainURL);
        await registrationPage.verifyRegistrationPageLoaded();
      });

      await test.step('Fill in registration credentials', async () => {
        await registrationPage.fillEmailAndPassword(scenario.registrationDetails);
      });

      await test.step('Fill in personal details', async () => {
        await registrationPage.fillPersonalDetails(scenario.registrationDetails);
      });

      await test.step('Accept terms and submit', async () => {
        await registrationPage.acceptTermsIfPresent();
        await registrationPage.submitRegistration();
      });

      await test.step('Verify registration success', async () => {
        await registrationPage.verifyRegistrationSuccess();
      });
    },
  );
});
