export interface AdminSearchUserRequest {
  q: string;
}

export interface AdminUserSummary {
  id: string | number;
  email: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface AdminSearchUserResponse {
  users: AdminUserSummary[];
  total: number;
}

export interface AdminApprovePatientRequest {
  patientId: string | number;
  providerNotes?: string;
  status: 'Approved' | 'Rejected' | 'Pending';
}

export interface AdminApprovePatientResponse {
  success: boolean;
  status: string;
}
