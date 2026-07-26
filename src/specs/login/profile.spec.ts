import { logTestCaseData } from '@utilities/test.helper.utils';
import { getProfileData } from '@data/login/profile.data';
import { test } from '@fixtures/page.fixtures';

const changePassword = getProfileData('PROF-010-Change-Password');
const updateShipping = getProfileData('PROF-011-Update-Shipping-Address');
const togglePrefs = getProfileData('PROF-012-Toggle-Notification-Preferences');

const allureMeta = { feature: 'Account', story: 'Profile' };

test.describe('Feature: Account Profile', () => {
  // Every profile scenario runs against the same authenticated account.
  test.beforeEach(async ({ loginPage }) => {
    await test.step('Log in and land on the account area', async () => {
      await loginPage.navigateToPage(changePassword.loginPageDetails);
      await loginPage.loginWithCredentials(changePassword.loginDetails);
      await loginPage.verifySuccessfulLogin();
    });
  });

  test(
    `
    Test case: '${changePassword.testCaseData.testCase}'
    Description: '${changePassword.testCaseData.testDescription}'
    Tags: '${changePassword.testCaseData.tags} @visual'
  `,
    async ({ profilePage }) => {
      await logTestCaseData(test.info(), changePassword.testCaseData, allureMeta);
      const d = changePassword.profileDetails;
      await profilePage.changePasswordAndRestore(d.currentPassword, d.tempPassword);
    },
  );

  test.only(
    `
    Test case: '${updateShipping.testCaseData.testCase}'
    Description: '${updateShipping.testCaseData.testDescription}'
    Tags: '${updateShipping.testCaseData.tags} @visual'
  `,
    async ({ profilePage }) => {
      await logTestCaseData(test.info(), updateShipping.testCaseData, allureMeta);
      const s = updateShipping.profileDetails;
      await profilePage.updateShippingAddress(s.shipping, s.shippingAlt);
    },
  );

  test(
    `
    Test case: '${togglePrefs.testCaseData.testCase}'
    Description: '${togglePrefs.testCaseData.testDescription}'
    Tags: '${togglePrefs.testCaseData.tags} @visual'
  `,
    async ({ profilePage }) => {
      await logTestCaseData(test.info(), togglePrefs.testCaseData, allureMeta);
      await profilePage.toggleNotificationPreferences();
    },
  );
});
