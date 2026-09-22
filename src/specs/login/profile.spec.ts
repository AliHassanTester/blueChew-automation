import { logTestCaseData } from '@utilities/test.helper.utils';
import { getProfileData } from '@data/login/profile.data';
import { test, AUTH_FILE_PATH } from '@fixtures/page.fixtures';

const changePassword = getProfileData('PROF-010-Change-Password');
const updateShipping = getProfileData('PROF-011-Update-Shipping-Address');
const togglePrefs = getProfileData('PROF-012-Toggle-Notification-Preferences');

const allureMeta = { feature: 'Account', story: 'Profile' };

// Direct context storageState injection — single page, zero blank windows
test.use({ storageState: AUTH_FILE_PATH });

test.describe('Feature: Account Profile', () => {

  test(
    `
    Test case: '${changePassword.testCaseData.testCase}'
    Description: '${changePassword.testCaseData.testDescription}'
    Tags: '${changePassword.testCaseData.tags}'
  `,
    async ({ profilePage }) => {
      await logTestCaseData(test.info(), changePassword.testCaseData, allureMeta);
      await profilePage.captureProfileSnapshot();
      const d = changePassword.profileDetails;
      await profilePage.changePasswordAndRestore(d.currentPassword, d.tempPassword);
    },
  );

  test(
    `
    Test case: '${updateShipping.testCaseData.testCase}'
    Description: '${updateShipping.testCaseData.testDescription}'
    Tags: '${updateShipping.testCaseData.tags}'
  `,
    async ({ profilePage }) => {
      await logTestCaseData(test.info(), updateShipping.testCaseData, allureMeta);
      await profilePage.captureProfileSnapshot();
      const s = updateShipping.profileDetails;
      await profilePage.updateShippingAddress(s.shipping, s.shippingAlt);
    },
  );

  test(
    `
    Test case: '${togglePrefs.testCaseData.testCase}'
    Description: '${togglePrefs.testCaseData.testDescription}'
    Tags: '${togglePrefs.testCaseData.tags}'
  `,
    async ({ profilePage }) => {
      await logTestCaseData(test.info(), togglePrefs.testCaseData, allureMeta);
      await profilePage.captureProfileSnapshot();
      await profilePage.toggleNotificationPreferences();
    },
  );
});
