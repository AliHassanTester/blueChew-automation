# BlueChew Automation Framework

Enterprise-grade Playwright + TypeScript test automation for [app.bluechew.com](https://app.bluechew.com).

Covers functional E2E flows, native visual regression (Playwright `toHaveScreenshot`), design token validation, and accessibility audits — no external paid tooling required.

---

## Stack

| Layer | Tool |
|---|---|
| Test runner | Playwright 1.48+ |
| Language | TypeScript 5.6+ |
| Visual regression | Playwright `toHaveScreenshot()` (native) |
| Design token validation | CSS computed-style assertions |
| Accessibility | `@axe-core/playwright` — WCAG 2.1 AA |
| Reporting | Allure + Playwright HTML |
| Test data | `@faker-js/faker` |
| Auth strategy | Browser-based login → `storageState` |
| CI | Jenkins (headless Chromium) |

---

## Project Structure

```
automation/
├── components/          # Reusable UI components (NavigationComponent, etc.)
├── config/              # Environment config loader
├── constants/           # Routes, timeouts, design tokens
├── fixtures/            # Playwright fixture extensions (base, auth)
├── helpers/             # Auth, visual, file helpers
├── hooks/               # Global setup / teardown
├── interfaces/          # TypeScript interfaces
├── pages/               # Page Object Model classes
├── reporters/           # Allure config, custom reporter
├── test-data/           # Faker-based data generators
├── tests/
│   ├── accessibility/   # WCAG 2.1 AA audits (axe-core)
│   ├── e2e/             # Functional E2E flows
│   ├── regression/      # Regression suite
│   ├── smoke/           # Critical path smoke tests
│   └── visual/          # Visual regression + design token tests
├── utils/               # Logger, retry, screenshot, wait utilities
├── playwright.config.ts
└── package.json
```

---

## Setup

### Prerequisites

- Node.js >= 20
- npm >= 10

### Install

```bash
npm install
npm run install:browsers
```

### Environment

Copy `.env.example` to `.env.dev` and fill in credentials:

```env
BASE_URL=https://app.bluechew.com
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=yourpassword
HEADLESS=false          # set true for CI
DEFAULT_TIMEOUT=60000   # ms — Angular SPA has slow cold-start loads
```

---

## Authentication

The framework uses a browser-based auth strategy compatible with Angular SPAs that set httpOnly session cookies.

On the **first run**, global setup opens a headless browser, logs in via the UI, and saves the resulting cookies to `playwright-auth/admin.json`. All subsequent runs reuse this file and skip the login UI entirely.

To force a fresh login (e.g. after a password change or session expiry):

```bash
# Windows
del playwright-auth\admin.json

# Then run any test — global setup will re-authenticate
npm run test:login:functional
```

---

## Running Tests

### Full suite

```bash
npm test
```

### By test type

```bash
npm run test:e2e           # All functional E2E tests
npm run test:smoke         # @smoke tagged tests (critical path only)
npm run test:regression    # @regression tagged tests
npm run test:accessibility # WCAG 2.1 AA axe-core audits
```

---

### Login flows

```bash
npm run test:login              # All login tests — Chromium, sequential
npm run test:login:all          # All login tests — all configured browsers
npm run test:login:functional   # Happy path only (page renders + successful login)
npm run test:login:regression   # Negative cases (wrong creds, empty fields, nav links)
```

---

### Individual page suites

```bash
npm run test:membership    # MY PLAN page (/account/membership)
npm run test:orders        # Orders page (/account/orders)
npm run test:profile       # Profile page (/account/profile)
npm run test:plans         # Plans page (/plans)
npm run test:navigation    # Hamburger nav menu (all routes)
```

---

### Visual regression

```bash
npm run test:visual                # All visual tests (Chromium)
npm run test:visual:login          # Login page only
npm run test:visual:membership     # MY PLAN page only
npm run test:visual:orders         # Orders page only
npm run test:visual:profile        # Profile page only
npm run test:visual:plans          # Plans page only

# After an intentional UI change — regenerate all PNG baselines
npm run test:visual:update
```

---

### By browser / platform

```bash
npm run test:chrome     # Chromium only
npm run test:firefox    # Firefox only
npm run test:webkit     # WebKit (Safari engine)
npm run test:mobile     # Mobile Chrome + Mobile Safari viewports
```

### Debug and interactive

```bash
npm run test:headed    # Run with browser windows visible
npm run test:debug     # Open Playwright Inspector (step-through)
npm run test:ui        # Open Playwright UI mode (interactive)
```

---

## Visual Regression

Visual tests use Playwright's native `toHaveScreenshot()`. No external service or subscription required.

### Workflow

| Step | Command |
|---|---|
| Generate baselines (first time) | `npm run test:visual:update` |
| Compare against baselines | `npm run test:visual` |
| Accept intentional UI change | `npm run test:visual:update` then commit the updated PNGs |

Baseline PNG files are stored in `tests/visual/__snapshots__/` and committed to the repo so CI always has a reference to compare against.

### Design token validation

Each visual spec validates computed CSS properties against the token constants defined in `constants/design-tokens.constants.ts`:

```typescript
// Example — verifies the submit button matches the design system
const violations = await validateTokens(page, 'button[type="submit"]', {
  'color':       COLOR_TOKENS.primaryButtonText,   // 'rgb(255, 255, 255)'
  'font-weight': TYPOGRAPHY_TOKENS.weightBold,     // '700'
});
expect(violations, formatViolations(violations)).toHaveLength(0);
```

When a token value changes in the app, the failure message shows exactly which property changed and what the new computed value is — making it easy to update the constants intentionally or catch an unintended design regression.

### Stability controls

- `disableAnimations(page)` — called in every visual `beforeEach` to freeze CSS transitions
- `animations: 'disabled'` — set globally in `playwright.config.ts`
- Component-level screenshots preferred over full-page (smaller diff surface)
- `maxDiffPixels: 150` global tolerance for anti-aliasing variance across runs

---

## Design Token Reference

Defined in `constants/design-tokens.constants.ts`. All values are in the resolved format returned by `window.getComputedStyle()` (RGB, not hex).

| Group | Tokens |
|---|---|
| `COLOR_TOKENS` | `navBackground`, `navText`, `pageBackground`, `primaryButtonText`, `holdBannerText`, `inputBackground` |
| `BORDER_RADIUS_TOKENS` | `buttonPill`, `card`, `inputField` |
| `TYPOGRAPHY_TOKENS` | `weightBold`, `weightSemiBold`, `weightRegular`, `buttonTextTransform` |
| `SPACING_TOKENS` | `minTouchTarget` |

To update after a design system change: run visual tests, read the "expected / actual" diff in the failure output, update the constants, commit.

---

## Page Objects

| Class | Route | Fixture |
|---|---|---|
| `LoginPage` | `/log-in` | `base.fixture` |
| `MembershipPage` | `/account/membership` | `auth.fixture` |
| `OrdersPage` | `/account/orders` | `auth.fixture` |
| `ProfilePage` | `/account/profile` | `auth.fixture` |
| `PlansPage` | `/plans` | `auth.fixture` |

All page objects extend `BasePage` which provides `navigate()`, `fill()`, `click()`, assertion helpers, and a `waitForPageLoad()` hook that each page overrides with its specific ready signal.

The `NavigationComponent` is embedded in every authenticated page as `page.nav`. It encapsulates the two-level hamburger menu: toggle → panel → profile accordion → account links.

---

## Test Tags

| Tag | Purpose |
|---|---|
| `@smoke` | Critical path — run before every deployment |
| `@regression` | Negative cases and edge paths |
| `@e2e` | All functional end-to-end tests |
| `@visual` | Screenshot + design token tests |
| `@accessibility` | WCAG 2.1 AA axe-core audits |
| `@membership` | MY PLAN feature tests |
| `@orders` | Orders feature tests |
| `@profile` | Profile feature tests |
| `@plans` | Plans feature tests |
| `@navigation` | Nav menu tests |

```bash
# Run any tag or combination
npx playwright test --grep "@smoke"
npx playwright test --grep "@smoke|@critical"
```

---

## Reporting

```bash
# Allure (richest report — feature/story grouping, steps, attachments)
npm run allure:serve      # Generate and open in browser (quickest)
npm run allure:generate   # Build report to allure-report/
npm run allure:open       # Open a previously generated report

# Playwright HTML report
npm run report:html
```

---

## Code Quality

```bash
npm run type-check    # TypeScript strict check — zero errors expected
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier
npm run format:check  # Prettier check (non-destructive)
```

---

## CI Notes

- Set `HEADLESS=true` and `CI=true` in the pipeline environment
- `CI=true` automatically sets retries to 2 and workers to 4
- Delete `playwright-auth/admin.json` at pipeline start to force a fresh login each run
- Commit `tests/visual/__snapshots__/` — CI needs the baseline PNGs to run visual comparisons
- Visual tests run on Chromium only (`test.use({ browserName: 'chromium' })` in each visual spec)
