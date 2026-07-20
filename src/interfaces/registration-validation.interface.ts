/**
 * Inputs for registration-validation (negative) scenarios that exercise the
 * register wizard without completing the full onboarding journey.
 */
export interface RegistrationValidationDetails {
  /** Login page — the register wizard is reached via its "Create an account" CTA. */
  loginURL: string;
  /** Full state name as it appears in the dropdown, e.g. "New York". */
  state: string;
  /** Email under test (for AQ-07 this is an already-registered address). */
  email: string;
  /** Any validly-formatted password — registration must be blocked before it matters. */
  password: string;
}
