import { RegistrationDetails } from '@interfaces/signup-to-approved-order.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';
import { getEnvVars } from '@utilities/env.utils';
import { buildTestAccount } from '@utilities/testData.generate.utils';

export interface RegistrationTestCaseData {
  testCaseData: TestCaseData;
  registrationDetails: RegistrationDetails;
}

const env = getEnvVars({
  password:           null,   // required — registration + login password
  LOGIN_URL:          '/log-in',
  QUIZ_URL:           '/quiz',
  STRIPE_CARD_NUMBER: '5555555555554444',
  STRIPE_CARD_EXP:    '12/28',
  // 737 is Adyen's test-card CVC; Stripe accepts any CVC in test mode, so it works on both.
  STRIPE_CARD_CVV:    '737',
  ADMIN_URL:          null,   // required — set in .env.dev
  ADMIN_EMAIL:        'ali@meds.com',
  ADMIN_PASSWORD:     null,   // required — set in .env.dev
});

const account = buildTestAccount('stripe');

// Card number is env-driven (STRIPE_CARD_NUMBER). Default 5555555555554444 (Mastercard) is
// the one test number on BOTH providers' test-card lists — the dev checkout randomly renders
// Stripe or Adyen, and 4242… is Stripe-only (Adyen declines it).
const cardNumber = env.STRIPE_CARD_NUMBER;

const registrationTestData: { [key: string]: RegistrationTestCaseData } = {
  'AQ-01-Sign-up-To-Approved-Order-E2E': {
    registrationDetails: {
      loginURL:        env.LOGIN_URL,
      quizURL:         env.QUIZ_URL,
      adminURL:        env.ADMIN_URL,
      adminEmail:      env.ADMIN_EMAIL,
      adminPassword:   env.ADMIN_PASSWORD,
      state:           'New York',
      email:           account.email,
      password:        env.password,
      // Q1: "All of the above" (index 2)
      // Q2: "Yes" (index 0)
      // Q3: "No, just the standard strength" (index 1)
      quizAnswers: [2, 0, 1],
      medical: account.medical,
      shipping: account.shipping,
      payment: {
        cardNumber,
        expiry:     env.STRIPE_CARD_EXP,
        cvv:        env.STRIPE_CARD_CVV,
      },
    },
    testCaseData: {
      tier: 'Tier 1 - UI Functional',
      tags: '@tier1 @regression @smoke @e2e',
      testCase: 'AQ-01-Sign-up-To-Approved-Order-E2E',
      testDescription:
        'New customer completes the full journey: sign up → quiz → results → medical → checkout → payment → provider review/approval → first order',
      testSummary:
        'Verify a new customer can sign up, complete the quiz and medical profile, purchase via checkout, be approved in provider review, and have a first order created from the admin portal.',
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
