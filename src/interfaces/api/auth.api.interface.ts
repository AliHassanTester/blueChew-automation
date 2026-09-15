export interface LoginApiRequest {
  email?: string;
  username?: string;
  password?: string;
}

export interface LoginApiResponse {
  success?: boolean;
  token?: string;
  accessToken?: string;
  user?: {
    id: string | number;
    email: string;
    firstName?: string;
    lastName?: string;
    membershipStatus?: string;
  };
  error?: string;
  message?: string;
}

export interface ForgotPasswordApiRequest {
  email: string;
}

export interface ForgotPasswordApiResponse {
  success: boolean;
  message?: string;
}

export interface SessionInfoResponse {
  authenticated: boolean;
  user?: {
    id: string | number;
    email: string;
    roles?: string[];
  };
}
