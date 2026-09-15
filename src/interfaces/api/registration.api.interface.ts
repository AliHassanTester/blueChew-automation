export interface RegisterApiRequest {
  state: string;
  email: string;
  password?: string;
  agreeTerms?: boolean;
}

export interface RegisterApiResponse {
  success: boolean;
  userId?: string | number;
  token?: string;
  error?: string;
  message?: string;
  code?: string | number;
}

export interface CheckEmailAvailabilityRequest {
  email: string;
}

export interface CheckEmailAvailabilityResponse {
  available: boolean;
  message?: string;
}
