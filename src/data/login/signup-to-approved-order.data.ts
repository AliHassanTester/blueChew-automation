import { RegistrationDetails } from '@interfaces/signup-to-approved-order.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';
import { getEnvVars } from '@utilities/env.utils';
import { generateRandomAlphanumeric } from '@utilities/random.utils';

export interface RegistrationTestCaseData {
  testCaseData: TestCaseData;
  registrationDetails: RegistrationDetails;
}

const env = getEnvVars({
  password:           null,   // required — registration + login password
  LOGIN_URL:          'https://dev.app.bluechew.com/log-in',
  QUIZ_URL:           'https://dev.bluechew.com/quiz',
  STRIPE_CARD_NUMBER: '5555555555554444',
  STRIPE_CARD_EXP:    '12/28',
  // 737 is Adyen's test-card CVC; Stripe accepts any CVC in test mode, so it works on both.
  STRIPE_CARD_CVV:    '737',
  ADMIN_URL:          'https://dev.admin.bluechew.com',
  ADMIN_EMAIL:        'ali@meds.com',
  ADMIN_PASSWORD:     null,   // required — set in .env.dev
});

// ── Test-account generation ──────────────────────────────────────────────────
const FIRST_NAMES  = ['John', 'Jane', 'James', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda'];
const LAST_NAMES   = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const STREETS      = ['Main', 'Oak', 'Maple', 'Pine', 'Elm', 'Cedar', 'Birch', 'Walnut', 'Cherry', 'Ash'];
const STREET_TYPES = ['St', 'Ave', 'Blvd', 'Ln', 'Rd', 'Dr', 'Ct', 'Way'];

const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

/** Random date of birth (MM/DD/YYYY) for an 18–80 year-old. */
function randomDOB(): string {
  const now = new Date();
  const oldest = new Date(now.getFullYear() - 80, now.getMonth(), now.getDate()).getTime();
  const youngest = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate()).getTime();
  const d = new Date(oldest + Math.random() * (youngest - oldest));
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Builds a fresh test account. A single runId (random + timestamp) is shared across the
 * email, name and address so every field of one account carries the same suffix, making
 * automation accounts easy to find and correlate in the DB / admin portal.
 */
function buildTestAccount() {
  const runId = `${generateRandomAlphanumeric(4)}.${Date.now()}`;
  return {
    email:         `test.${runId}@automation-test.com`,
    firstName:     `${pick(FIRST_NAMES)}.${runId}`,
    lastName:      `${pick(LAST_NAMES)}.${runId}`,
    birthday:      randomDOB(),
    streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${pick(STREETS)} ${pick(STREET_TYPES)} ${runId}`,
  };
}

const account = buildTestAccount();

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
        cardNumber,
        expiry:     env.STRIPE_CARD_EXP,
        cvv:        env.STRIPE_CARD_CVV,
      },
    },
    testCaseData: {
      tags: '@regression @smoke @e2e',
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
