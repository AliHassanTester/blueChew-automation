import { RegistrationValidationDetails } from '@interfaces/registration-validation.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';
import { getEnvVars } from '@utilities/env.utils';

export interface RegistrationValidationTestCaseData {
  testCaseData: TestCaseData;
  registrationDetails: RegistrationValidationDetails;
}

const env = getEnvVars({
  LOGIN_URL:             'https://dev.app.bluechew.com/log-in',
  // The duplicate email must be one that already exists. Reuse the known registered
  // login account (user_name) so the address is guaranteed to be taken.
  user_name:             null,   // required — the already-registered email
  REGISTRATION_PASSWORD: 'TestPassword123!',
});

const registrationValidationTestData: { [key: string]: RegistrationValidationTestCaseData } = {
  'AQ-07-Register-Duplicate-Email': {
    registrationDetails: {
      loginURL: env.LOGIN_URL,
      state:    'New York',
      email:    env.user_name,               // already registered → must be blocked
      password: env.REGISTRATION_PASSWORD,
    },
    testCaseData: {
      tags: '@regression @smoke @registration @negative',
      testCase: 'AQ-07-Register-Duplicate-Email',
      testDescription: 'Registration with an already-registered email is blocked',
      testSummary:
        'Verify the register wizard rejects an already-registered email with the "This email is already registered." alert and does not create an account (funnel does not advance to the quiz).',
    },
  },
};

export function getRegistrationValidationData(testCase: string): RegistrationValidationTestCaseData {
  const data = registrationValidationTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
