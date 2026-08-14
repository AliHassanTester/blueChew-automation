import { TestCaseData } from '@interfaces/testcase.data.interface';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import { RegistrationDetails } from '@interfaces/signup-to-approved-order.interface';
import { getEnvVars } from '@utilities/env.utils';
import { generateRandomAlphanumeric } from '@utilities/random.utils';
import {
  PRODUCT_SILDENAFIL_FIGMA_CONFIG,
  PRODUCT_TADALAFIL_FIGMA_CONFIG,
  PRODUCT_VARDENAFIL_FIGMA_CONFIG,
  PRODUCT_DAILYTAD_FIGMA_CONFIG,
  PRODUCT_MAX_FIGMA_CONFIG,
} from '@data/visual/figma.visual.data';

export interface ProductCheckoutTestCaseData {
  productName: 'Sildenafil' | 'Tadalafil' | 'Vardenafil' | 'DailyTad' | 'Max';
  url: string;
  visualConfig: ApplitoolsVisualConfig;
  registrationDetails: RegistrationDetails;
  testCaseData: TestCaseData;
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

function buildTestAccount(suffix: string) {
  const runId = `${generateRandomAlphanumeric(4)}.${Date.now()}`;
  return {
    email:         `test.${runId}+${suffix}@meds.com`,
    firstName:     `${pick(FIRST_NAMES)}.${runId}`,
    lastName:      `${pick(LAST_NAMES)}.${runId}`,
    birthday:      randomDOB(),
    streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${pick(STREETS)} ${pick(STREET_TYPES)} ${runId}`,
  };
}

function createProductScenario(
  productName: 'Sildenafil' | 'Tadalafil' | 'Vardenafil' | 'DailyTad' | 'Max',
  testCase: string,
  url: string,
  visualConfig: ApplitoolsVisualConfig,
): ProductCheckoutTestCaseData {
  const account = buildTestAccount(productName.toLowerCase());
  const tag = productName.toLowerCase();
  return {
    productName,
    url,
    visualConfig,
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
      tags: `@regression @product @${tag} @e2e @visual`,
      testCase,
      testDescription: `User can select ${productName} product plan and complete checkout flow`,
      testSummary: `Navigate to ${productName} landing page, capture visual baseline, select plan, complete registration, quiz, medical, checkout and order approval.`,
    },
  };
}

const productCheckoutTestData: { [key: string]: ProductCheckoutTestCaseData } = {
  'PRODUCT-SILDENAFIL': createProductScenario('Sildenafil', 'PRODUCT-SILDENAFIL', '/sildenafil', PRODUCT_SILDENAFIL_FIGMA_CONFIG),
  'PRODUCT-TADALAFIL':   createProductScenario('Tadalafil',  'PRODUCT-TADALAFIL',   '/tadalafil',  PRODUCT_TADALAFIL_FIGMA_CONFIG),
  'PRODUCT-VARDENAFIL':  createProductScenario('Vardenafil', 'PRODUCT-VARDENAFIL',  'https://dev.bluechew.com/vardenafil', PRODUCT_VARDENAFIL_FIGMA_CONFIG),
  'PRODUCT-DAILYTAD':   createProductScenario('DailyTad',   'PRODUCT-DAILYTAD',   'https://dev.bluechew.com/dailytad',  PRODUCT_DAILYTAD_FIGMA_CONFIG),
  'PRODUCT-MAX':        createProductScenario('Max',        'PRODUCT-MAX',        'https://dev.bluechew.com/max',       PRODUCT_MAX_FIGMA_CONFIG),
};

export function getProductCheckoutData(testCase: string): ProductCheckoutTestCaseData {
  const data = productCheckoutTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}

export function getAllProductCheckoutScenarios(): ProductCheckoutTestCaseData[] {
  return Object.values(productCheckoutTestData);
}
