import { logTestCaseData } from '@utilities/test.helper.utils';
import { getLoginData } from '@data/login/login.data';
import { test } from '@fixtures/page.fixtures';

const scenario = getLoginData('AQ-02-User-Login');

test.describe('Feature: User Login', () => {
  test(
    `Test case: '${scenario.testCaseData.testCase}'
    Description: '${scenario.testCaseData.testDescription}'
    Tags: '${scenario.testCaseData.tags}'
  `,
    async ({ loginPage }) => {
      await logTestCaseData(test.info(), scenario.testCaseData, {
        feature: 'Authentication',
        story: 'User Login',
      });

      await test.step('Navigate to BlueChew login page', async () => {
        await loginPage.navigateToPage(scenario.loginPageDetails);
      });

      await test.step('Log in with registered credentials', async () => {
        await loginPage.loginWithCredentials(scenario.loginDetails);
      });

      await test.step('Verify successful login — account page rendered', async () => {
        await loginPage.verifySuccessfulLogin();
      });
    },
  );
});
