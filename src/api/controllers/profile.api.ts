import { APIRequestContext, TestInfo } from '@playwright/test';
import { BaseApiClient, ApiResponseWrapper } from '../base/base.api.client';
import {
  UserProfileResponse,
  UpdateShippingAddressApiRequest,
  UpdateNotificationPreferencesApiRequest,
  ChangePasswordApiRequest,
  GenericApiSuccessResponse,
} from '@interfaces/api/profile.api.interface';

/**
 * ProfileApiClient
 *
 * Encapsulates endpoints for user profile management, shipping address updates,
 * notification preferences, and account security.
 */
export class ProfileApiClient extends BaseApiClient {
  constructor(requestContext: APIRequestContext, baseURL = '', testInfo?: TestInfo) {
    super(requestContext, baseURL, testInfo);
  }

  /**
   * Retrieves the current authenticated user profile details.
   */
  async getProfile(): Promise<ApiResponseWrapper<UserProfileResponse>> {
    return this.get<UserProfileResponse>('/api/user/profile');
  }

  /**
   * Updates the authenticated user's shipping address.
   */
  async updateShippingAddress(payload: UpdateShippingAddressApiRequest): Promise<ApiResponseWrapper<GenericApiSuccessResponse>> {
    return this.put<GenericApiSuccessResponse>('/api/user/shipping-address', payload);
  }

  /**
   * Updates user communication and notification preferences.
   */
  async updateNotificationPreferences(payload: UpdateNotificationPreferencesApiRequest): Promise<ApiResponseWrapper<GenericApiSuccessResponse>> {
    return this.put<GenericApiSuccessResponse>('/api/user/notifications', payload);
  }

  /**
   * Changes the user's account password.
   */
  async changePassword(payload: ChangePasswordApiRequest): Promise<ApiResponseWrapper<GenericApiSuccessResponse>> {
    return this.post<GenericApiSuccessResponse>('/api/user/change-password', payload);
  }
}
