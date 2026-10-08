import { TestCaseData } from '@interfaces/testcase.data.interface';
import { HeroesTestCaseData } from '@interfaces/heroes.interface';
import { getEnvVars } from '@utilities/env.utils';
import { buildTestAccount } from '@utilities/testData.generate.utils';

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

function createHeroesDirectScenario(): HeroesTestCaseData {
  const account = buildTestAccount('hero-direct');

  return {
    homeURL: 'https://dev.bluechew.com/',
    heroesURL: 'https://dev.bluechew.com/heroes',
    heroBranch: 'Army',
    registrationDetails: {
      loginURL:        env.LOGIN_URL,
      quizURL:         env.QUIZ_URL,
      adminURL:        env.ADMIN_URL,
      adminEmail:      env.ADMIN_EMAIL,
      adminPassword:   env.ADMIN_PASSWORD,
      state:           'New York',
      email:           account.email,
      password:        env.password,
      quizAnswers:     [0, 1, 2],
      medical:         account.medical,
      shipping:        account.shipping,
      payment: {
        cardNumber: env.STRIPE_CARD_NUMBER,
        expiry:     env.STRIPE_CARD_EXP,
        cvv:        env.STRIPE_CARD_CVV,
      },
    },
    testCaseData: {
      tags: '@regression @heroes @product @direct @e2e',
      testCase: 'HEROES-001-Direct-Registration-Checkout',
      testDescription: "User navigates to Homepage, clicks American Heroes footer CTA, clicks 'GET STARTED HERE', completes registration with military verification, medical profile, and proceeds to checkout with HERO coupon applied.",
      testSummary: 'Verify American Heroes direct registration flow from homepage footer to /heroes, /register?h=1, /verify-hero, /medical, and /checkout.',
    },
  };
}

function createHeroesQuizScenario(): HeroesTestCaseData {
  const account = buildTestAccount('hero-quiz');

  return {
    homeURL: 'https://dev.bluechew.com/',
    heroesURL: 'https://dev.bluechew.com/heroes',
    heroBranch: 'Army',
    quizAnswers: [0, 1, 2],
    registrationDetails: {
      loginURL:        env.LOGIN_URL,
      quizURL:         env.QUIZ_URL,
      adminURL:        env.ADMIN_URL,
      adminEmail:      env.ADMIN_EMAIL,
      adminPassword:   env.ADMIN_PASSWORD,
      state:           'New York',
      email:           account.email,
      password:        env.password,
      quizAnswers:     [0, 1, 2],
      medical:         account.medical,
      shipping:        account.shipping,
      payment: {
        cardNumber: env.STRIPE_CARD_NUMBER,
        expiry:     env.STRIPE_CARD_EXP,
        cvv:        env.STRIPE_CARD_CVV,
      },
    },
    testCaseData: {
      tags: '@regression @heroes @product @quiz @e2e',
      testCase: 'HEROES-002-Quiz-Funnel-Checkout',
      testDescription: "User navigates to Homepage, clicks American Heroes footer CTA, clicks 'TRY NOW', completes the quiz and recommendation funnel, selects strength, and completes checkout.",
      testSummary: 'Verify American Heroes quiz funnel flow from homepage footer to /heroes, /quiz, /results (Gold), and /checkout.',
    },
  };
}

const heroesTestData: { [key: string]: HeroesTestCaseData } = {
  'HEROES-001-Direct-Registration-Checkout': createHeroesDirectScenario(),
  'HEROES-002-Quiz-Funnel-Checkout':        createHeroesQuizScenario(),
};

export function getHeroesData(testCase: string): HeroesTestCaseData {
  const data = heroesTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}

export function getAllHeroesScenarios(): HeroesTestCaseData[] {
  return Object.values(heroesTestData);
}
