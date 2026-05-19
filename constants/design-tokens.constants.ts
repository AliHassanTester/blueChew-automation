/**
 * Design token values as resolved by window.getComputedStyle().
 * All values must be in the exact format getComputedStyle returns
 * (resolved RGB, px, etc.) — never hex or shorthand — so comparisons
 * are deterministic.
 *
 * IMPORTANT: Verify these values against the live site before adding to CI.
 * Open DevTools on https://dev.app.bluechew.com, select the element,
 * run: window.getComputedStyle(el).getPropertyValue('<property>')
 */

export const COLOR_TOKENS = {
  /** White text on primary CTA buttons */
  primaryButtonText: 'rgb(255, 255, 255)',

  /** BlueChew primary blue — used as button background, links, focus rings */
  primaryButtonBackground: 'rgb(0, 99, 190)',

  /** Secondary / outline button text color */
  secondaryButtonText: 'rgb(0, 99, 190)',

  /** Anchor link colour */
  linkColor: 'rgb(0, 99, 190)',

  /** Validation error red */
  errorColor: 'rgb(220, 53, 69)',

  /** Default body copy */
  bodyText: 'rgb(33, 37, 41)',

  /** Heading colour */
  headingText: 'rgb(17, 24, 39)',

  /** Form input border — default (unfocused) */
  inputBorder: 'rgb(209, 213, 219)',
} as const;

export const TYPOGRAPHY_TOKENS = {
  weightBold: '700',
  weightSemiBold: '600',
  weightMedium: '500',
  weightRegular: '400',

  /** Base body font size */
  baseFontSize: '16px',

  /** Primary heading font size */
  headingFontSize: '24px',

  /** CTA button font size */
  buttonFontSize: '16px',

  /** Primary font stack as resolved by getComputedStyle */
  bodyFontFamily: 'Inter',
} as const;

export const SPACING_TOKENS = {
  /** Vertical padding inside primary buttons */
  buttonPaddingTop: '12px',
  buttonPaddingBottom: '12px',

  /** Horizontal padding inside primary buttons */
  buttonPaddingLeft: '24px',
  buttonPaddingRight: '24px',

  /** Border radius for form inputs */
  inputBorderRadius: '8px',

  /** Border radius for buttons */
  buttonBorderRadius: '8px',
} as const;
