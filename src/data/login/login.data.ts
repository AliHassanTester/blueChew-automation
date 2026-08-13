import { LoginDetails } from '@interfaces/login.interface';
import { LoginPageDetails } from '@interfaces/login.page.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import { getEnvVars } from '@utilities/env.utils';
import {
  LOGIN_DESKTOP_FIGMA_CONFIG,
  LOGIN_MOBILE_FIGMA_CONFIG,
} from '@data/visual/figma.visual.data';

export interface LoginTestCaseData {
  testCaseData: TestCaseData;
  loginDetails: LoginDetails;
  loginPageDetails: LoginPageDetails;
  visualConfigs: ApplitoolsVisualConfig[];
}

const env = getEnvVars({
  user_name: null,
  password: null,
  LOGIN_URL: '/log-in',
  POST_LOGIN_URL: '/account/membership',
});

const loginTestData: { [key: string]: LoginTestCaseData } = {
  'AQ-02-User-Login': {
    loginDetails: {
      username: env.user_name,
      password: env.password,
    },
    loginPageDetails: {
      loginURL: env.LOGIN_URL,
      postLoginURL: env.POST_LOGIN_URL,
    },
    visualConfigs: [LOGIN_DESKTOP_FIGMA_CONFIG, LOGIN_MOBILE_FIGMA_CONFIG],
    testCaseData: {
      tags: '@regression @smoke @login @percy @visual',
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
