/** Application route paths — relative to BASE_URL (app.bluechew.com) */
export const ROUTES = {
  // Auth
  LOGIN: '/log-in',
  REGISTER: '/register',
  FORGOT_EMAIL: '/auth/forgot-email',
  FORGOT_PASSWORD: '/auth/forgot-password',

  // Account (post-login landing)
  MEMBERSHIP: '/account/membership',
  ORDERS: '/account/orders',
  PROFILE: '/account/profile',
  PROFILE_CHANGE_EMAIL: '/account/profile/change-email-otp',
  PROFILE_CHANGE_PHONE: '/account/profile/change-phone',
  PROFILE_CHANGE_PASSWORD: '/account/profile/change-password',
  PROFILE_MFA: '/account/profile/enable-mfa',
  PROFILE_SHIPPING: '/account/profile/update-shipping-address',
  PROFILE_BILLING: '/account/profile/billing/update',
  MEDICAL: '/account/medical',

  // Plans / upgrade
  PLANS: '/plans',
  PLANS_SWITCH: '/plans?context=switch',

  // Other authenticated pages
  REFER: '/refer',
  CONTACT: '/contact',
  ABOUT: '/about',
  FAQ: '/faq/general',
  REVIEWS: '/reviews',

  // Marketing site (bluechew.com) — used by some nav links
  MARKETING_QUIZ: '/quiz',
  MARKETING_HEROES: '/heroes',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
