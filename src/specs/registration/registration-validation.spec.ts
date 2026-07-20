import { logTestCaseData } from '@utilities/test.helper.utils';
import { getRegistrationValidationData } from '@data/registration/registration-validation.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getRegistrationValidationData('AQ-07-Register-Duplicate-Email');

test.describe('Feature: Registration Validation', () => {
  test(
    `
    Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({ registrationPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        feature: 'Onboarding',
        story: 'Registration Validation',
      });
      const d = scenario.registrationDetails;

      test.info().annotations.push({ type: 'Duplicate Email', description: d.email });

      await registrationPage.attemptRegistrationWithDuplicateEmail(d);
      await registrationPage.verifyDuplicateEmailErrorShown();
    },
  );
});
