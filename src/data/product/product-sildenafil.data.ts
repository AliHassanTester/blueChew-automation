import { TestCaseData } from '@interfaces/testcase.data.interface';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import { RegistrationDetails } from '@interfaces/signup-to-approved-order.interface';
import { getEnvVars } from '@utilities/env.utils';
import { generateRandomAlphanumeric } from '@utilities/random.utils';

export const PRODUCT_SILDENAFIL_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Sildenafil Default',
  testName: 'Sildenafil - Desktop',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Sildenafil_1440',
  ignoreDisplacements: true,
};

export interface ProductSildenafilTestCaseData {
  testCaseData: TestCaseData;
  url: string;
  visualConfig: ApplitoolsVisualConfig;
  registrationDetails: RegistrationDetails;
}

const env = getEnvVars({
  user_name:          null,
  password:           null,
  LOGIN_URL:          '/log-in',
  QUIZ_URL:           '/quiz',
  STRIPE_CARD_NUMBER: '5555555555554444',
  STRIPE_CARD_EXP:    '12/28',
  STRIPE_CARD_CVV:    '737',
  ADMIN_URL:          null,
  ADMIN_EMAIL:        'ali@meds.com',
  ADMIN_PASSWORD:     null,
});

const FIRST_NAMES  = ['John', 'Jane', 'James', 'Mary', 'Robert'];
const LAST_NAMES   = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'];
const STREETS      = ['Main', 'Oak', 'Maple', 'Pine', 'Elm'];
const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Ln', 'Rd'];

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

function randomDOB(): string {
  const now = new Date();
  const oldest = new Date(now.getFullYear() - 80, now.getMonth(), now.getDate()).getTime();
  const youngest = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()).getTime();
  const d = new Date(oldest + Math.random() * (youngest - oldest));
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

function buildTestAccount() {
  const runId = `${generateRandomAlphanumeric(4)}.${Date.now()}`;
  return {
    email:         `test.${runId}+sildenafil@meds.com`,
    firstName:     `${pick(FIRST_NAMES)}.${runId}`,
    lastName:      `${pick(LAST_NAMES)}.${runId}`,
    birthday:      randomDOB(),
    streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${pick(STREETS)} ${pick(STREET_TYPES)} ${runId}`,
  };
}

const account = buildTestAccount();

const productSildenafilTestData: { [key: string]: ProductSildenafilTestCaseData } = {
  'PRODUCT-SILDENAFIL': {
    url: '/sildenafil',
    visualConfig: PRODUCT_SILDENAFIL_FIGMA_CONFIG,
    registrationDetails: {
      loginURL:        env.LOGIN_URL,
      quizURL:         env.QUIZ_URL,
      adminURL:        env.ADMIN_URL,
      adminEmail:      env.ADMIN_EMAIL,
      adminPassword:   env.ADMIN_PASSWORD,
      state:           'New York',
      email:           account.email,
      password:        env.password,
      quizAnswers:     [2, 0, 1],
      medical: {
        firstName: account.firstName,
        lastName:  account.lastName,
        birthday:  account.birthday,
      },
      shipping: {
        streetAddress: account.streetAddress,
        city:          'New York',
        state:         'New York',
        zip:           '10001',
        phone:         '2125550100',
      },
      payment: {
        cardNumber: env.STRIPE_CARD_NUMBER,
        expiry:     env.STRIPE_CARD_EXP,
        cvv:        env.STRIPE_CARD_CVV,
      },
    },
    testCaseData: {
      tags: '@regression @product @sildenafil @e2e @visual',
      testCase: 'PRODUCT-SILDENAFIL',
      testDescription: 'User can select Sildenafil product plan and complete checkout flow',
      testSummary: 'Navigate to Sildenafil landing page, capture visual baseline, select plan, complete registration, quiz, medical, checkout and order approval.',
    },
  },
};

export function getProductSildenafilData(testCase: string): ProductSildenafilTestCaseData {
  const data = productSildenafilTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
