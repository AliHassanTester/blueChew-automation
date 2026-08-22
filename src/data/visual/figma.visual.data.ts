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
