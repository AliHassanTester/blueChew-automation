import { APIRequestContext, TestInfo } from '@playwright/test';
import { BaseApiClient, ApiResponseWrapper } from '../base/base.api.client';
import {
  LoginApiRequest,
  LoginApiResponse,
  ForgotPasswordApiRequest,
  ForgotPasswordApiResponse,
  SessionInfoResponse,
} from '@interfaces/api/auth.api.interface';

/**
 * AuthApiClient
 *
 * Encapsulates authentication, login, token refresh, and session status endpoints.
 */
export class AuthApiClient extends BaseApiClient {
  constructor(requestContext: APIRequestContext, baseURL = '', testInfo?: TestInfo) {
    super(requestContext, baseURL, testInfo);
  }

  /**
   * Authenticates a user with credentials and returns the session/token response.
   */
  async login(credentials: LoginApiRequest): Promise<ApiResponseWrapper<LoginApiResponse>> {
    return this.post<LoginApiResponse>('/api/auth/login', {
      email: credentials.email || credentials.username,
      password: credentials.password,
    });
  }

  /**
   * Requests a password reset link for the provided email address.
   */
  async forgotPassword(payload: ForgotPasswordApiRequest): Promise<ApiResponseWrapper<ForgotPasswordApiResponse>> {
    return this.post<ForgotPasswordApiResponse>('/api/auth/forgot-password', payload);
  }

  /**
   * Fetches the current authenticated session details.
   */
  async getSession(): Promise<ApiResponseWrapper<SessionInfoResponse>> {
    return this.get<SessionInfoResponse>('/api/auth/session');
  }

  /**
   * Logs out the current session and invalidates active authentication cookies/tokens.
   */
  async logout(): Promise<ApiResponseWrapper<{ success: boolean }>> {
    return this.post<{ success: boolean }>('/api/auth/logout');
  }
}
