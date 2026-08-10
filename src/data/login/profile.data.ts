import { LoginDetails } from '@interfaces/login.interface';
import { LoginPageDetails } from '@interfaces/login.page.interface';
import { ProfileDetails } from '@interfaces/profile.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';
import { getEnvVars } from '@utilities/env.utils';

export interface ProfileTestCaseData {
  testCaseData: TestCaseData;
  loginDetails: LoginDetails;
  loginPageDetails: LoginPageDetails;
  profileDetails: ProfileDetails;
}

const env = getEnvVars({
  user_name:             null,   // required — the account under test
  password:              null,   // required — its current password
  LOGIN_URL:             '/log-in',
  POST_LOGIN_URL:        '/account/membership',
  PROFILE_TEMP_PASSWORD: 'CertaTemp123!',
});

// Login credentials + landing are identical across the profile scenarios (same account).
const loginDetails: LoginDetails = { username: env.user_name, password: env.password };
const loginPageDetails: LoginPageDetails = { loginURL: env.LOGIN_URL, postLoginURL: env.POST_LOGIN_URL };
const profileDetails: ProfileDetails = {
  currentPassword: env.password,
  tempPassword:    env.PROFILE_TEMP_PASSWORD,
  shipping:    { streetAddress: '123 Main St', aptSuite: 'Apt 4B', city: 'Atlanta', zip: '30301' },
  shippingAlt: { streetAddress: '456 Modesto CA', aptSuite: 'Apt 2', city: 'Atlanta', zip: '30308' },
};

const profileTestData: { [key: string]: ProfileTestCaseData } = {
  'PROF-010-Change-Password': {
    loginDetails,
    loginPageDetails,
    profileDetails,
    testCaseData: {
      tags: '@regression @account @profile',
      testCase: 'PROF-010-Change-Password',
      testDescription: 'User can change the account password with a valid current + new password',
      testSummary:
        'Verify the change-password flow accepts the current password and a valid new password, confirms success, and (by switching back) proves the change took effect while restoring the original password.',
    },
  },
  'PROF-011-Update-Shipping-Address': {
    loginDetails,
    loginPageDetails,
    profileDetails,
    testCaseData: {
      tags: '@regression @account @profile',
      testCase: 'PROF-011-Update-Shipping-Address',
      testDescription: 'User can update the shipping address and the change persists',
      testSummary:
        'Verify the update-shipping form saves a new address, confirms the USPS delivery-address modal, and the new address is reflected on the profile page.',
    },
  },
  'PROF-012-Toggle-Notification-Preferences': {
    loginDetails,
    loginPageDetails,
    profileDetails,
    testCaseData: {
      tags: '@regression @account @profile',
      testCase: 'PROF-012-Toggle-Notification-Preferences',
      testDescription: 'User can toggle SMS and marketing-email notification preferences',
      testSummary:
        'Verify each notification toggle (SMS, Marketing Emails) flips state, shows the "preferences were updated" confirmation, and can be restored to its original value.',
    },
  },
};

export function getProfileData(testCase: string): ProfileTestCaseData {
  const data = profileTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
