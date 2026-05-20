/**
 * BlueChew Design Tokens
 *
 * CSS property values as returned by window.getComputedStyle() — always
 * use the resolved RGB/px form, not hex or shorthand, so comparisons are
 * deterministic across browsers.
 *
 * How to update: run the visual suite once; token violations in the output
 * show "expected X, got Y". Copy the "got" value here, commit, and re-run.
 *
 * Figma source → export tokens → map to the constants below.
 */

export const COLOR_TOKENS = {
  // ── Navigation / header ──────────────────────────────────────────────────
  navBackground:       'rgb(0, 0, 0)',
  navText:             'rgb(255, 255, 255)',

  // ── Page surfaces ────────────────────────────────────────────────────────
  pageBackground:      'rgb(255, 255, 255)',
  cardBackgroundDark:  'rgb(0, 0, 0)',        // dark plan card

  // ── Buttons ──────────────────────────────────────────────────────────────
  primaryButtonText:   'rgb(255, 255, 255)',  // white label on primary CTA

  // ── Status / alerts ──────────────────────────────────────────────────────
  // Hold banner ("Your plan is on hold") — amber warning strip
  holdBannerText:      'rgb(0, 0, 0)',

  // ── Form elements ────────────────────────────────────────────────────────
  inputBackground:     'rgb(255, 255, 255)',
} as const;

export const BORDER_RADIUS_TOKENS = {
  buttonPill: '100px',   // RESUME PLAN / primary CTAs are fully pill-shaped
  card:        '16px',   // plan card rounded corners
  inputField:   '8px',   // login / form inputs
} as const;

export const TYPOGRAPHY_TOKENS = {
  // Font weights (as string — getComputedStyle returns numeric strings)
  weightBold:     '700',
  weightSemiBold: '600',
  weightRegular:  '400',

  // Button text transform
  buttonTextTransform: 'uppercase',
} as const;

export const SPACING_TOKENS = {
  // Minimum touch-target height for interactive elements (WCAG 2.5.5)
  minTouchTarget: '44px',
} as const;

/** Convenience bundle — import this to run full-suite token validation. */
export const DESIGN_TOKENS = {
  color:        COLOR_TOKENS,
  borderRadius: BORDER_RADIUS_TOKENS,
  typography:   TYPOGRAPHY_TOKENS,
  spacing:      SPACING_TOKENS,
} as const;
