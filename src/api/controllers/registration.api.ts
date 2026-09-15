import { APIRequestContext, TestInfo } from '@playwright/test';
import { BaseApiClient, ApiResponseWrapper } from '../base/base.api.client';
import {
  RegisterApiRequest,
  RegisterApiResponse,
  CheckEmailAvailabilityRequest,
  CheckEmailAvailabilityResponse,
} from '@interfaces/api/registration.api.interface';

/**
 * RegistrationApiClient
 *
 * Encapsulates registration validation, email availability checks,
 * and user account onboarding endpoints.
 */
export class RegistrationApiClient extends BaseApiClient {
  constructor(requestContext: APIRequestContext, baseURL = '', testInfo?: TestInfo) {
    super(requestContext, baseURL, testInfo);
  }

  /**
   * Checks if an email is already registered or available for a new account.
   */
  async checkEmail(payload: CheckEmailAvailabilityRequest): Promise<ApiResponseWrapper<CheckEmailAvailabilityResponse>> {
    return this.post<CheckEmailAvailabilityResponse>('/api/registration/check-email', payload);
  }

  /**
   * Registers a new user account with state, email, password, and terms acceptance.
   */
  async register(payload: RegisterApiRequest): Promise<ApiResponseWrapper<RegisterApiResponse>> {
    return this.post<RegisterApiResponse>('/api/registration', payload);
  }

  /**
   * Submits patient intake questionnaire responses.
   */
  async submitMedicalIntake(userId: string | number, intakeData: Record<string, unknown>): Promise<ApiResponseWrapper<{ success: boolean; intakeId?: string }>> {
    return this.post<{ success: boolean; intakeId?: string }>(`/api/registration/${userId}/intake`, intakeData);
  }
}
