export interface MedicalDetails {
  firstName: string;
  lastName: string;
  /** MM/DD/YYYY */
  birthday: string;
}

export interface ShippingDetails {
  streetAddress: string;
  aptSuite?: string;
  city: string;
  /** Full state name as it appears in the dropdown, e.g. "New York" */
  state: string;
  zip: string;
  phone: string;
}

export interface PaymentDetails {
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface RegistrationDetails {
  /** App-domain dev gate — https://dev.app.bluechew.com/dev-login */
  devGateURL: string;
  /** Login page — https://dev.app.bluechew.com/log-in */
  loginURL: string;
  /** Direct registration URL for visual tests — https://dev.app.bluechew.com/register */
  registrationURL: string;
  /** Quiz URL — where the app redirects after successful registration */
  quizURL: string;
  adminURL: string;
  adminEmail: string;
  adminPassword: string;
  state: string;
  email: string;
  password: string;
  /** 0-based answer index for each quiz question, in order */
  quizAnswers: number[];
  medical: MedicalDetails;
  shipping: ShippingDetails;
  payment: PaymentDetails;
}
