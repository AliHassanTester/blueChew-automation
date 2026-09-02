export { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

// ── Login Page Figma Configurations ──────────────────────────────────────────
export const LOGIN_DESKTOP_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Log in/Default',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Log in/Default_1440',
  ignoreDisplacement: true,
};

export const LOGIN_MOBILE_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Log in/Default',
  viewport: {
    width: 390,
    height: 844,
  },
  baselineEnvName: 'Log in/Default_390',
  ignoreDisplacement: true,
};

export const LOGIN_CREDENTIALS_ENTERED_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Log in/Success',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Log in/Success_1440',
  ignoreDisplacement: true,
};

export const LOGIN_ERROR_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Log in/error',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Log in/error_1440',
  ignoreDisplacement: true,
};

export const LOGIN_FORGOT_PASSWORD_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Forgot Password/ Retrieve Password',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Forgot Password/ Retrieve Password_1440',
  ignoreDisplacement: true,
};

// ── Mobile Login Figma Configurations ─────────────────────────────────────────
export const LOGIN_CREDENTIALS_ENTERED_MOBILE_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Log in/Success',
  viewport: {
    width: 390,
    height: 844,
  },
  baselineEnvName: 'Log in/Success_390',
  ignoreDisplacement: true,
};

export const LOGIN_ERROR_MOBILE_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Log in/error',
  viewport: {
    width: 390,
    height: 844,
  },
  baselineEnvName: 'Log in/error_390',
  ignoreDisplacement: true,
};

export const LOGIN_FORGOT_PASSWORD_MOBILE_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Forgot Password/ Retrieve Password',
  viewport: {
    width: 390,
    height: 844,
  },
  baselineEnvName: 'Forgot Password/ Retrieve Password_390',
  ignoreDisplacement: true,
};

// ── Combined Desktop & Mobile Login Configurations ─────────────────────────────
export const LOGIN_INITIAL_FIGMA_CONFIGS = [
  LOGIN_DESKTOP_FIGMA_CONFIG,
  LOGIN_MOBILE_FIGMA_CONFIG,
];

export const LOGIN_CREDENTIALS_ENTERED_FIGMA_CONFIGS = [
  LOGIN_CREDENTIALS_ENTERED_FIGMA_CONFIG,
  LOGIN_CREDENTIALS_ENTERED_MOBILE_FIGMA_CONFIG,
];

export const LOGIN_ERROR_FIGMA_CONFIGS = [
  LOGIN_ERROR_FIGMA_CONFIG,
  LOGIN_ERROR_MOBILE_FIGMA_CONFIG,
];

export const LOGIN_FORGOT_PASSWORD_FIGMA_CONFIGS = [
  LOGIN_FORGOT_PASSWORD_FIGMA_CONFIG,
  LOGIN_FORGOT_PASSWORD_MOBILE_FIGMA_CONFIG,
];

// ── Product Checkout Figma Configurations ────────────────────────────────────
export const PRODUCT_SILDENAFIL_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 11',
  viewport: {
    width: 1440,
    height: 7854,
  },
  baselineEnvName: 'Desktop - 11_1440',
  ignoreDisplacements: true,
};

export const PRODUCT_TADALAFIL_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 12',
  viewport: {
    width: 1440,
    height: 7809,
  },
  baselineEnvName: 'Desktop - 12_1440',
  ignoreDisplacements: true,
};

export const PRODUCT_VARDENAFIL_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 13',
  viewport: {
    width: 1440,
    height: 7972,
  },
  baselineEnvName: 'Desktop - 13_1440',
  ignoreDisplacements: true,
};

export const PRODUCT_DAILYTAD_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 14',
  viewport: {
    width: 1440,
    height: 7917,
  },
  baselineEnvName: 'Desktop - 14_1440',
  ignoreDisplacements: true,
};

export const PRODUCT_MAX_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 9',
  viewport: {
    width: 1440,
    height: 7832,
  },
  baselineEnvName: 'Desktop - 9_1440',
  ignoreDisplacements: true,
};

export const HOMEPAGE_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 9',
  viewport: {
    width: 1440,
    height: 1200,
  },
  baselineEnvName: 'Desktop - 9_1440',
  ignoreDisplacement: true,
};

export const PRODUCT_GOLD_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 9',
  viewport: {
    width: 1440,
    height: 1200,
  },
  baselineEnvName: 'Desktop - 9_1440',
  ignoreDisplacement: true,
};

export const GOLD_TRANSITION_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Onboarding Default',
  testName: 'Gold Transition - Desktop',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Gold_Transition_1440',
  ignoreDisplacement: true,
};

// ── Profile Figma Configurations ─────────────────────────────────────────────
export const PROFILE_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Account Default',
  testName: 'Profile - Desktop',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Profile_1440',
  ignoreDisplacement: true,
};

// ── Registration Figma Configurations ──────────────────────────────────────────
export const REGISTRATION_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Onboarding Default',
  testName: 'Registration - Desktop',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Registration_1440',
  ignoreDisplacement: true,
};

// ── Quiz Figma Configurations ──────────────────────────────────────────
export const QUIZ_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Onboarding Default',
  testName: 'Quiz - Desktop',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Quiz_1440',
  ignoreDisplacement: true,
};

// ── Medical Intake Figma Configurations ──────────────────────────────────────
export const MEDICAL_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Medical Default',
  testName: 'Medical Intake - Desktop',
  viewport: {
    width: 1440,
    height: 1200,
  },
  baselineEnvName: 'Medical_1440',
  ignoreDisplacement: true,
};

// ── Confirmation Queue Figma Configurations ─────────────────────────────────
export const CONFIRMATION_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Order Confirmation Default',
  testName: 'Confirmation Queue - Desktop',
  viewport: {
    width: 1440,
    height: 915,
  },
  baselineEnvName: 'Confirmation_1440',
  ignoreDisplacement: true,
};

export const GOLD_MEDICAL_STEPS_FIGMA_CONFIGS: ApplitoolsVisualConfig[] = [
  // 1. Initial Page Load
  { appName: 'Login Default', testName: 'Med Intake_1', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_1_1440', ignoreDisplacement: true },
  // 2. Legal Name
  { appName: 'Login Default', testName: 'Med Intake_1', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_1_1440', ignoreDisplacement: true },
  // 3. Sex
  { appName: 'Login Default', testName: 'Med Intake_2', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_2_1440', ignoreDisplacement: true },
  // 4. Patient Status
  { appName: 'Login Default', testName: 'Med Intake_3_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_3_Desktop_1440', ignoreDisplacement: true },
  // 5. Reason
  { appName: 'Login Default', testName: 'Med Intake_4_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_4_Desktop_1440', ignoreDisplacement: true },
  // 6. Walk 1 Mile State 1
  { appName: 'Login Default', testName: 'Med Intake_5_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_5_Desktop_1440', ignoreDisplacement: true },
  // 7. Walk 1 Mile State 2
  { appName: 'Login Default', testName: 'Med Intake_5a_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_5a_Desktop_1440', ignoreDisplacement: true },
  // 8. has a medical provider ever told you...
  { appName: 'Login Default', testName: 'Med Intake_7_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_7_Desktop_1440', ignoreDisplacement: true },
  // 9. diagnosed with low blood pressure...
  { appName: 'Login Default', testName: 'Med Intake_8_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_8_Desktop_1440', ignoreDisplacement: true },
  // 10. diagnosed with high blood pressure...
  { appName: 'Login Default', testName: 'Med Intake_9_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_9_Desktop_1440', ignoreDisplacement: true },
  // 11. vitamins or supplements...
  { appName: 'Login Default', testName: 'Med Intake_10_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_10_Desktop_1440', ignoreDisplacement: true },
  // 12. medications...
  { appName: 'Login Default', testName: 'Med Intake_11.1_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_11.1_Desktop_1440', ignoreDisplacement: true },
  // 13. allergies...
  { appName: 'Login Default', testName: 'Med Intake_13_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_13_Desktop_1440', ignoreDisplacement: true },
  // 14. ever had any of the following...
  { appName: 'Login Default', testName: 'Med Intake_14a_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_14a_Desktop_1440', ignoreDisplacement: true },
  // 15. other medical conditions...
  { appName: 'Login Default', testName: 'Med Intake_15_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_15_Desktop_1440', ignoreDisplacement: true },
  // 16. list other medications...
  { appName: 'Login Default', testName: 'Med Intake_16_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_16_Desktop_1440', ignoreDisplacement: true },
  // 17. is there anything else you would like to tell us...
  { appName: 'Login Default', testName: 'Med Intake_17_Desktop', viewport: { width: 1440, height: 1200 }, baselineEnvName: 'Med Intake_17_Desktop_1440', ignoreDisplacement: true },
];
