/**
 * Centralized Interface Export Hub (Barrel File)
 *
 * Consolidates and re-exports all TypeScript interfaces across the test automation framework.
 * Allows clean, single-source module imports (e.g., `import { HeroesTestCaseData } from '@interfaces';`).
 */

// ── Core Framework & Infrastructure Interfaces ────────────────────────────────
export * from './locator.info.interface';
export * from './testcase.data.interface';
export * from './applitools.interface';

// ── Account & Authentication Interfaces ────────────────────────────────────────
export * from './login.interface';
export * from './login.page.interface';
export * from './profile.interface';
export * from './registration-validation.interface';
export * from './signup-to-approved-order.interface';

// ── Product, Landing Pages & Medical Funnel Interfaces ─────────────────────────
export * from './heroes.interface';
export * from './landing-max.interface';
export * from './footer-redirects.interface';
export * from './medical-negative.interface';

