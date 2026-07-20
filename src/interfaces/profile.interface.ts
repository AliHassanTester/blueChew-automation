/** A shipping address entered on the account → profile → update-shipping form. */
export interface ShippingAddressInput {
  streetAddress: string;
  aptSuite?: string;
  city: string;
  zip: string;
}

/** Inputs for the account-profile scenarios (change password, shipping, preferences). */
export interface ProfileDetails {
  /** The account's real current password (used as the "old password" and restored to). */
  currentPassword: string;
  /** A throwaway password the change-password flow switches to and back from. */
  tempPassword: string;
  /**
   * Two deterministic addresses. The update-shipping flow saves whichever one differs
   * from the currently-stored address, so "Save changes" always enables (the form must
   * be dirty) and the test stays idempotent across runs.
   */
  shipping: ShippingAddressInput;
  shippingAlt: ShippingAddressInput;
}
