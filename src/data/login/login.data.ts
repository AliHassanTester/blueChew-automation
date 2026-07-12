import { LoginDetails } from '@interfaces/login.interface';
import { LoginPageDetails } from '@interfaces/login.page.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';
import { getEnvVars } from '@utilities/env.utils';

export interface LoginTestCaseData {
  testCaseData: TestCaseData;
  loginDetails: LoginDetails;
  loginPageDetails: LoginPageDetails;
}

const env = getEnvVars({
  user_name:      null,  // required — no fallback, test must not run with empty credentials
  password:       null,  // required
  LOGIN_URL:      'https://dev.app.bluechew.com/log-in',
  POST_LOGIN_URL: 'https://dev.app.bluechew.com/account/membership',
});

const loginTestData: { [key: string]: LoginTestCaseData } = {
  'AQ-02-User-Login': {
    loginDetails: {
      username: env.user_name,
      password: env.password,
    },
    loginPageDetails: {
      // The dev gate is presented on the login page itself, so the gate and login
      // steps share the same LOGIN_URL.
      devGateURL:   env.LOGIN_URL,
      loginURL:     env.LOGIN_URL,
      postLoginURL: env.POST_LOGIN_URL,
    },
    testCaseData: {
      tags: '@regression @smoke @login',
      testCase: 'AQ-02-User-Login',
      testDescription: 'Registered user can log in with valid credentials',
      testSummary:
        'Verify that a registered user can authenticate via the /log-in page and land on the membership dashboard.',
    },
  },
};

export function getLoginData(testCase: string): LoginTestCaseData {
  const data = loginTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
