import { APIRequestContext, TestInfo } from '@playwright/test';
import { BaseApiClient, ApiResponseWrapper } from '../base/base.api.client';
import {
  AdminSearchUserRequest,
  AdminSearchUserResponse,
  AdminApprovePatientRequest,
  AdminApprovePatientResponse,
} from '@interfaces/api/admin.api.interface';

/**
 * AdminApiClient
 *
 * Encapsulates internal admin and provider review API actions:
 * searching users, viewing medical intakes, and approving/rejecting patients.
 */
export class AdminApiClient extends BaseApiClient {
  constructor(requestContext: APIRequestContext, baseURL = '', testInfo?: TestInfo) {
    super(requestContext, baseURL, testInfo);
  }

  /**
   * Searches users/patients by email, name, or ID in the admin panel.
   */
  async searchUsers(query: AdminSearchUserRequest): Promise<ApiResponseWrapper<AdminSearchUserResponse>> {
    return this.get<AdminSearchUserResponse>('/api/admin/users', {
      params: { q: query.q },
    });
  }

  /**
   * Approves or rejects a patient's medical intake and prescription.
   */
  async approvePatient(payload: AdminApprovePatientRequest): Promise<ApiResponseWrapper<AdminApprovePatientResponse>> {
    return this.post<AdminApprovePatientResponse>(`/api/admin/patients/${payload.patientId}/status`, {
      status: payload.status,
      providerNotes: payload.providerNotes,
    });
  }

  /**
   * Triggers a test order process reset or cleanup for a patient.
   */
  async resetPatientTestState(patientId: string | number): Promise<ApiResponseWrapper<{ success: boolean }>> {
    return this.post<{ success: boolean }>(`/api/admin/patients/${patientId}/reset`);
  }
}
