import { TestCaseData } from '@interfaces/testcase.data.interface';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import { RegistrationDetails } from '@interfaces/signup-to-approved-order.interface';
import { getEnvVars } from '@utilities/env.utils';
import { buildTestAccount } from '@utilities/testData.generate.utils';
import {
  HOMEPAGE_FIGMA_CONFIG,
  PRODUCT_SILDENAFIL_FIGMA_CONFIG,
  PRODUCT_TADALAFIL_FIGMA_CONFIG,
  PRODUCT_VARDENAFIL_FIGMA_CONFIG,
  PRODUCT_DAILYTAD_FIGMA_CONFIG,
  PRODUCT_MAX_FIGMA_CONFIG,
  PRODUCT_VMAX_FIGMA_CONFIG,
  PRODUCT_GOLD_FIGMA_CONFIG,
} from '@data/visual/figma.visual.data';

export interface ProductCheckoutTestCaseData {
  productName: 'Home' | 'Sildenafil' | 'Tadalafil' | 'Vardenafil' | 'DailyTad' | 'Max' | 'VMax' | 'Gold';
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

function createProductScenario(
  productName: 'Home' | 'Sildenafil' | 'Tadalafil' | 'Vardenafil' | 'DailyTad' | 'Max' | 'VMax' | 'Gold',
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
      medical: account.medical,
      shipping: account.shipping,
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
  'PRODUCT-HOME':       createProductScenario('Home',       'PRODUCT-HOME',       'https://dev.bluechew.com/',           HOMEPAGE_FIGMA_CONFIG),
  'PRODUCT-SILDENAFIL': createProductScenario('Sildenafil', 'PRODUCT-SILDENAFIL', '/sildenafil', PRODUCT_SILDENAFIL_FIGMA_CONFIG),
  'PRODUCT-TADALAFIL':   createProductScenario('Tadalafil',  'PRODUCT-TADALAFIL',   '/tadalafil',  PRODUCT_TADALAFIL_FIGMA_CONFIG),
  'PRODUCT-VARDENAFIL':  createProductScenario('Vardenafil', 'PRODUCT-VARDENAFIL',  'https://dev.bluechew.com/vardenafil', PRODUCT_VARDENAFIL_FIGMA_CONFIG),
  'PRODUCT-DAILYTAD':   createProductScenario('DailyTad',   'PRODUCT-DAILYTAD',   'https://dev.bluechew.com/dailytad',  PRODUCT_DAILYTAD_FIGMA_CONFIG),
  'PRODUCT-MAX':        createProductScenario('Max',        'PRODUCT-MAX',        'https://dev.bluechew.com/max',       PRODUCT_MAX_FIGMA_CONFIG),
  'PRODUCT-VMAX':       createProductScenario('VMax',       'PRODUCT-VMAX',       'https://dev.bluechew.com/vmax',      PRODUCT_VMAX_FIGMA_CONFIG),
  'PRODUCT-GOLD':       createProductScenario('Gold',       'PRODUCT-GOLD',       'https://dev.bluechew.com/gold',      PRODUCT_GOLD_FIGMA_CONFIG),
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
