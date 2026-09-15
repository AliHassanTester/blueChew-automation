import { test as base, APIRequestContext } from '@playwright/test';
import {
  AuthApiClient,
  ProductApiClient,
  RegistrationApiClient,
  ProfileApiClient,
  CheckoutApiClient,
  AdminApiClient,
} from '@api';

export interface ApiTestFixtures {
  apiBaseUrl: string;
  authApi: AuthApiClient;
  productApi: ProductApiClient;
  registrationApi: RegistrationApiClient;
  profileApi: ProfileApiClient;
  checkoutApi: CheckoutApiClient;
  adminApi: AdminApiClient;
}

export const apiTest = base.extend<ApiTestFixtures>({
  apiBaseUrl: async ({ baseURL }, use) => {
    const url = process.env.BLUECHEW_URL || baseURL || 'https://dev.app.bluechew.com';
    await use(url);
  },

  authApi: async ({ request, apiBaseUrl }, use, testInfo) => {
    await use(new AuthApiClient(request, apiBaseUrl, testInfo));
  },

  productApi: async ({ request, apiBaseUrl }, use, testInfo) => {
    await use(new ProductApiClient(request, apiBaseUrl, testInfo));
  },

  registrationApi: async ({ request, apiBaseUrl }, use, testInfo) => {
    await use(new RegistrationApiClient(request, apiBaseUrl, testInfo));
  },

  profileApi: async ({ request, apiBaseUrl }, use, testInfo) => {
    await use(new ProfileApiClient(request, apiBaseUrl, testInfo));
  },

  checkoutApi: async ({ request, apiBaseUrl }, use, testInfo) => {
    await use(new CheckoutApiClient(request, apiBaseUrl, testInfo));
  },

  adminApi: async ({ request, apiBaseUrl }, use, testInfo) => {
    await use(new AdminApiClient(request, apiBaseUrl, testInfo));
  },
});

export { expect } from '@playwright/test';
