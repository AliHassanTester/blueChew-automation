import { RegistrationDetails } from '@interfaces/registration.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';
import { generateRandomEmailAddress } from '@utilities/random.utils';
import { TestDataUtils } from '@utilities/testData.generate.utils';

export interface RegistrationTestCaseData {
  testCaseData: TestCaseData;
  registrationDetails: RegistrationDetails;
}

const registrationTestData: { [key: string]: RegistrationTestCaseData } = {
  'AQ-01-User-Registration': {
    registrationDetails: {
      mainURL: process.env.REGISTRATION_URL || 'https://dev.app.bluechew.com/signup',
      email: generateRandomEmailAddress(),
      password: process.env.REGISTRATION_PASSWORD || 'TestPassword123!',
      firstName: TestDataUtils.generateRandomName(),
      lastName: TestDataUtils.generateRandomLastName(),
      dateOfBirth: '01/01/1990',
      state: TestDataUtils.generateRandomState(),
    },
    testCaseData: {
      tags: '@regression @smoke @registration',
      testCase: 'AQ-01-User-Registration',
      testDescription: 'New user can complete the registration flow successfully',
      testSummary:
        'Verify that a new user can register with valid credentials and reach the post-registration state.',
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
