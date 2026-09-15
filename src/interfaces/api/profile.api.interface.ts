export interface UserProfileResponse {
  id: string | number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  notifications?: {
    sms: boolean;
    marketingEmail: boolean;
  };
}

export interface UpdateShippingAddressApiRequest {
  line_1: string;
  line_2?: string;
  city: string;
  state: string;
  zip: string;
}

export interface UpdateNotificationPreferencesApiRequest {
  sms?: boolean;
  email_marketing?: boolean;
}

export interface ChangePasswordApiRequest {
  oldpass: string;
  newpass: string;
  confirmpass: string;
}

export interface GenericApiSuccessResponse {
  success: boolean;
  message?: string;
}
