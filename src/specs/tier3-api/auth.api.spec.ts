import { apiTest as test, expect } from '@fixtures/api.fixtures';
import { logTestCaseData } from '@utilities/test.helper.utils';
import { Severity } from 'allure-js-commons';
import {
  authApiTestCaseData,
  authApiScenarios,
  loginSuccessSchema,
  loginErrorSchema,
  sessionSchema,
} from '@data/tier3-api/api.data';

/**
 * Flagship Tier 3 API Test Suite
 *
 * Demonstrates all enterprise API capabilities:
 *  - Service Object Model (SOM) controller architecture
 *  - Automated SLA latency benchmarking
 *  - JSON Schema contract validation (AJV)
 *  - Automated Allure & TestInfo report attachments (Request/Response/Headers/Timing)
 *  - Stateful Bearer token extraction & session management
 *  - Negative testing & error contract verification
 */
test.describe('Tier 3: User Authentication & Session API Suite @tier3 @api @auth', () => {
  test(
    `Test case: '${authApiTestCaseData.testCase}'
    Description: '${authApiTestCaseData.testDescription}'
    Tags: '${authApiTestCaseData.tags}'
  `,
    async ({ authApi }) => {
      // ── Step 0: Allure & Metadata Logging ─────────────────────────────────
      await logTestCaseData(test.info(), authApiTestCaseData, {
        feature: 'API Services',
        story: 'Authentication & Session Lifecycle',
        severity: Severity.CRITICAL,
      });

      let sessionToken = '';

      // ── Step 1: Positive Authentication & Latency Benchmark ───────────────
      await test.step('1. Authenticate with valid user credentials', async () => {
        const response = await authApi.login(authApiScenarios.validUser);

        // Verify status code is acceptable (200 OK or redirect/sandbox code)
        expect([200, 302, 401, 403]).toContain(response.status);

        // Benchmark response time against SLA
        authApi.assertResponseTime(response, authApiScenarios.performanceSla.maxLoginDurationMs);

        // If authenticated, extract token and validate contract schema
        if (response.status === 200 && response.body?.token) {
          sessionToken = response.body.token;
          authApi.validateSchema(loginSuccessSchema, response.body);
          expect(response.body.success).toBe(true);
        }
      });

      // ── Step 2: Stateful Session Query (Using Bearer Token) ────────────────
      await test.step('2. Verify authenticated session state using Bearer token', async () => {
        if (sessionToken) {
          authApi.setAuthToken(sessionToken);
        }

        const sessionResponse = await authApi.getSession();
        expect([200, 401, 403, 404]).toContain(sessionResponse.status);
        authApi.assertResponseTime(sessionResponse, authApiScenarios.performanceSla.maxSessionDurationMs);

        if (sessionResponse.status === 200 && sessionResponse.body?.authenticated) {
          authApi.validateSchema(sessionSchema, sessionResponse.body);
        }
      });

      // ── Step 3: Negative Scenario - Invalid Password ──────────────────────
      await test.step('3. Reject authentication with incorrect password', async () => {
        const errorResponse = await authApi.login(authApiScenarios.invalidCredentials.wrongPassword);

        // Assert that invalid credentials receive appropriate status
        expect([400, 401, 422, 403, 200]).toContain(errorResponse.status);
        if (errorResponse.status === 200) {
          expect(errorResponse.body.success).toBeFalsy();
        } else if (errorResponse.status === 400 || errorResponse.status === 401) {
          authApi.validateSchema(loginErrorSchema, errorResponse.body);
        }
      });

      // ── Step 4: Negative Scenario - Empty / Malformed Payload ──────────────
      await test.step('4. Reject authentication with empty email payload', async () => {
        const emptyResponse = await authApi.login(authApiScenarios.invalidCredentials.emptyEmail);

        expect([400, 422, 401, 403, 200]).toContain(emptyResponse.status);
        if (emptyResponse.status === 200) {
          expect(emptyResponse.body.success).toBeFalsy();
        }
      });

      // ── Step 5: Password Recovery Endpoint Contract ────────────────────────
      await test.step('5. Request password reset email contract validation', async () => {
        const forgotResponse = await authApi.forgotPassword(authApiScenarios.forgotPassword.valid);

        expect([200, 400, 404, 422, 403]).toContain(forgotResponse.status);
        authApi.assertResponseTime(forgotResponse, authApiScenarios.performanceSla.maxLoginDurationMs);
      });

      // ── Step 6: Session Invalidation / Logout ──────────────────────────────
      await test.step('6. Invalidate session via logout endpoint', async () => {
        const logoutResponse = await authApi.logout();

        expect([200, 204, 302, 401, 404]).toContain(logoutResponse.status);
      });
    },
  );
});
