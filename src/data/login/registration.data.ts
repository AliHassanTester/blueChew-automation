import { RegistrationDetails } from '@interfaces/registration.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';
import { getEnvVars } from '@utilities/env.utils';
import { generateRandomAlphanumeric } from '@utilities/random.utils';

export interface RegistrationTestCaseData {
  testCaseData: TestCaseData;
  registrationDetails: RegistrationDetails;
}

const env = getEnvVars({
  password:               null,  // required — reuse login password
  DEV_GATE_URL:           'https://dev.app.bluechew.com/dev-login',
  LOGIN_URL:              'https://dev.app.bluechew.com/log-in',
  REGISTRATION_URL:       'https://dev.app.bluechew.com/register',
  POST_REGISTRATION_URL:  'https://dev.bluechew.com/quiz',
});

// aliQA prefix makes test accounts easy to identify and clean up in the DB
function generateTestEmail(): string {
  return `aliQA.${generateRandomAlphanumeric(3)}.${Date.now()}@gmail.com`;
}

const registrationTestData: { [key: string]: RegistrationTestCaseData } = {
  'AQ-01-User-Registration': {
    registrationDetails: {
      devGateURL:           env.DEV_GATE_URL,
      loginURL:             env.LOGIN_URL,
      registrationURL:      env.REGISTRATION_URL,
      state:                'New York',
      email:                generateTestEmail(),
      password:             env.password,
      postRegistrationURL:  env.POST_REGISTRATION_URL,
      // Q1: "All of the above" (index 2), Q2: "Yes" (index 0), Q3: "No, just standard" (index 1)
      quizAnswers: [2, 0, 1],
      medical: {
        firstName: 'Ali',
        lastName:  'QA',
        birthday:  '01/01/1990',
      },
      shipping: {
        streetAddress: '123 Main St',
        city:          'New York',
        state:         'New York',
        zip:           '10001',
        phone:         '2125550100',
      },
    },
    testCaseData: {
      tags: '@regression @smoke @registration',
      testCase: 'AQ-01-User-Registration',
      testDescription: 'New user can complete the full onboarding flow: registration → quiz → results → medical profile → checkout',
      testSummary:
        'Verify that a new user can register, complete the quiz, view recommendations, fill the medical profile, and reach the checkout shipping step.',
    },
  },
};

export function getRegistrationData(testCase: string): RegistrationTestCaseData {
  const data = registrationTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
