import { Schema } from 'ajv';
import { LoginApiRequest, ForgotPasswordApiRequest } from '@interfaces/api/auth.api.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';

// ── 1. TEST CASE METADATA (Allure & Reporting) ──────────────────────────────

export const authApiTestCaseData: TestCaseData = {
  tier: 'Tier 3 - API Automation',
  testCase: 'API-01-User-Authentication-Showcase',
  testDescription:
    'Comprehensive showcase of Tier 3 API automation: executes user authentication, benchmarks response latency, verifies AJV JSON schema contracts, propagates Bearer session tokens, verifies authenticated session state, and tests error handling on invalid credentials.',
  testSummary: 'User Authentication & Session Management API Validation',
  tags: '@tier3 @api @smoke @regression @auth @showcase',
};

// ── 2. PAYLOADS & SCENARIOS ──────────────────────────────────────────────────

export const authApiScenarios = {
  validUser: {
    email: process.env.BLUECHEW_USERNAME || 'autouser+active@bluechew.com',
    password: process.env.BLUECHEW_PASSWORD || 'TestPass123!',
  } as LoginApiRequest,

  invalidCredentials: {
    wrongPassword: {
      email: process.env.BLUECHEW_USERNAME || 'autouser+active@bluechew.com',
      password: 'WrongPassword999!',
    } as LoginApiRequest,
    emptyEmail: {
      email: '',
      password: 'TestPass123!',
    } as LoginApiRequest,
    malformedEmail: {
      email: 'not-a-valid-email-format',
      password: 'TestPass123!',
    } as LoginApiRequest,
  },

  forgotPassword: {
    valid: {
      email: process.env.BLUECHEW_USERNAME || 'autouser+active@bluechew.com',
    } as ForgotPasswordApiRequest,
  },

  performanceSla: {
    maxLoginDurationMs: 5000,
    maxSessionDurationMs: 3000,
  },
};

// ── 3. AJV JSON SCHEMAS (Contract Verification) ──────────────────────────────

export const loginSuccessSchema: Schema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    token: { type: 'string' },
    userId: { type: ['string', 'number'] },
    user: {
      type: 'object',
      properties: {
        id: { type: ['string', 'number'] },
        email: { type: 'string' },
      },
    },
  },
  required: ['success'],
};

export const loginErrorSchema: Schema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: { type: 'string' },
    message: { type: 'string' },
    statusCode: { type: 'number' },
  },
};

export const sessionSchema: Schema = {
  type: 'object',
  properties: {
    authenticated: { type: 'boolean' },
    user: {
      type: 'object',
      properties: {
        id: { type: ['string', 'number'] },
        email: { type: 'string' },
      },
    },
  },
};
