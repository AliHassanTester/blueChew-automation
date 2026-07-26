# Applitools integration in the BlueChew Playwright framework

## Overview

The current implementation adds opt-in visual regression testing to the existing Playwright + TypeScript automation framework. It uses Applitools Eyes via the Playwright SDK and is designed to stay low-risk: functional test execution remains unchanged unless visual mode is explicitly enabled.

The integration is currently focused on critical user flows such as login and registration validation, with visual checkpoints captured at meaningful UI states.
# Applitools integration and multi-device visual testing

## Overview

The current implementation adds opt-in visual regression testing to the BlueChew Playwright framework. It uses Applitools Eyes through the Playwright SDK and is designed to stay low-risk: functional test execution remains unchanged unless visual mode is explicitly enabled.

The integration now also supports running the same visual flows across two device viewports:
- Desktop: 1440 × 900
- Mobile: 393 × 852

---

## What was added

### 1. Applitools dependency and runtime configuration

The project now includes the Applitools Playwright SDK and uses environment-driven configuration to control the behavior.

Key environment variables:
- `APPLITOOLS_ENABLED=true` to activate visual mode
- `APPLITOOLS_API_KEY` for the Applitools account connection
- `APPLITOOLS_APP_NAME` for the app name shown in Applitools
- `APPLITOOLS_BATCH_NAME` for the batch grouping in Applitools

The implementation is wired in the following files:
- [playwright.config.ts](../playwright.config.ts)
- [package.json](../package.json)

### 2. Central visual helper layer

The reusable visual logic lives in [src/utilities/applitools.utils.ts](../src/utilities/applitools.utils.ts).

This helper provides:
- `openEyes(...)` to start an Applitools session
- `checkWindow(...)` to capture a visual checkpoint
- `closeEyes()` to end the session cleanly
- `captureCheckpoint(...)` for one-off visual snapshots
- `runVisualStep(...)` for wrapping an action and capturing the visual state after it completes

This keeps the visual logic centralized and reusable instead of scattering it across specs.

### 3. Fixture-based wiring

The shared fixture layer in [src/fixtures/page.fixtures.ts](../src/fixtures/page.fixtures.ts) now exposes a `visual` fixture.

That fixture:
- creates an Applitools helper for the current test
- passes it into page objects that need visual checkpoints
- ensures the Eyes session is closed at the end of the test lifecycle

This is a best-practice approach because it avoids duplicating setup code in each spec and makes the visual helper available wherever the page-object layer needs it.

### 4. Page-object-level visual checkpoints

The visual logic is now attached to the page objects rather than the test specs.

Current page-object integrations:
- [src/page/login/login.page.ts](../src/page/login/login.page.ts)
  - captures the login page state
  - captures the authenticated account page state after login
- [src/page/login/signup-to-approved-order.page.ts](../src/page/login/signup-to-approved-order.page.ts)
  - captures the duplicate-email validation error state

This keeps the specs focused on business flow and leaves UI-state verification in the component layer where it belongs.

### 5. Visual test filtering and reporting

In [playwright.config.ts](../playwright.config.ts), visual mode:
- enables the Applitools reporter
- restricts execution to tests tagged with `@visual`
- uses the standard Playwright reporters for non-visual runs

The visual suite is triggered through the script in [package.json](../package.json):
- `npm run test:visual`

---

## How the current implementation works

### Execution flow

1. A test run starts using the Playwright config.
2. The config checks whether `APPLITOOLS_ENABLED=true`.
3. If visual mode is enabled:
   - the Applitools reporter is selected
   - only tests tagged with `@visual` are executed
4. The shared `visual` fixture creates an Applitools helper for the test.
5. Page objects use that helper to capture checkpoints at important UI steps.
6. Applitools receives the screenshots and groups them under the configured app and batch name.

### Visual checkpoint behavior

A checkpoint is captured in one of two patterns:

- `captureCheckpoint(...)`
  - used when the page state should be captured at a specific moment
  - opens the Eyes session, checks the window, and closes it immediately

- `runVisualStep(...)`
  - used when a UI action should be executed and then the resulting state should be visually validated
  - wraps the action, captures the post-action state, and closes the session afterward

This makes the implementation flexible for both simple page-state validation and more complex flow-based checks.

---

## Current visual coverage

The integration currently captures visual checkpoints for these flows:

### Login flow
- Login page rendering
- Authenticated account page after successful login

### Registration validation flow
- Duplicate-email validation error state

These are good candidates for visual regression monitoring because they represent high-value, user-visible states that are sensitive to layout or rendering changes.

---

## Dedicated page and checkpoint coverage

The visual suite is organized around the following page objects and the specific states each one captures.

### LoginPage
- Login - initial form
- Login - authenticated account overview

### RegistrationPage
- Registration - duplicate email error

### QuizPage
- Quiz - completed results overview

### ResultsPage
- Results - recommendations overview

### MedicalPage
- Medical profile - completed questionnaire

### CheckoutPage
- Checkout - order summary
- Checkout - confirmation

### ConfirmationPage
- Confirmation - provider queue
- Confirmation - post-approval plan

### ProfilePage
- Profile - password change success
- Profile - shipping address updated
- Profile - preferences overview

### AdminPage
- Admin - portal dashboard
- Admin - users list
- Admin - user detail
- Admin - approval state

This page-by-page map makes it easier to understand what each visual checkpoint represents and keeps the Applitools dashboard organized by user journey and page state.

---

## Advantages added by this implementation

### 1. Opt-in and low-risk

The integration does not affect standard functional test runs unless the visual mode flag is enabled. That means:
- normal regression runs remain stable
- visual testing can be introduced gradually
- teams can decide when to run visual validation

### 2. Cleaner test specs

Specs now focus on business behavior rather than visual setup details.

Before, visual logic might have cluttered the spec layer. Now the spec remains focused on:
- navigating through the flow
- entering data
- asserting functional outcomes

The visual logic lives in the page object and shared utility layer.

### 3. Reusable and maintainable helper layer

The shared helper reduces duplication and provides a consistent approach for future visual checkpoints.

That means future pages can be extended quickly by calling the same helper rather than introducing ad hoc Applitools calls throughout the codebase.

### 4. Better organization in Applitools

The helper builds flow-based test names and uses meaningful checkpoint names. This makes the Applitools dashboard easier to read and group by user journey rather than by random screenshot names.

### 5. Stronger UI regression protection

This setup adds visibility into layout and rendering issues that functional assertions would miss. Examples include:
- broken styling
- shifted layout
- hidden elements
- visual regressions after UI changes

### 6. Improved reporting for visual runs

When visual mode is enabled, the Playwright run uses the Applitools reporter instead of relying only on the standard HTML report. This gives a more appropriate experience for visual test execution and keeps the output aligned with the purpose of the run.

---

## Notes and considerations

### Requirements for a real run

To execute visual tests successfully, the environment needs:
- a valid Applitools API key
- the correct app name and batch naming configuration
- a running test environment that the browser can access

### Baseline behavior

Applitools works by comparing new screenshots against existing baselines. The first run usually establishes or updates the baseline depending on account configuration.

### Best-practice guidance

For the long-term health of the setup:
- keep visual assertions focused on stable, high-value states
- avoid over-capturing every minor UI transition
- use clear checkpoint names that describe the user-visible state
- add visual coverage only where visual regressions matter most

---

## Recommended usage

Run the visual suite with:

```bash
npm run test:visual
```

This will:
- enable Applitools
- run only the `@visual` tests
- capture the configured checkpoints
- send the results to the Applitools dashboard
### 1. Applitools orchestration

The project now includes a shared visual helper layer in [src/utilities/applitools.utils.ts](../src/utilities/applitools.utils.ts) that provides:
- `openEyes(...)` to start an Applitools session
- `checkWindow(...)` to capture a checkpoint
- `closeEyes()` to end the session cleanly
- `captureCheckpoint(...)` for one-off visual snapshots
- `runVisualStep(...)` for wrapping an action and capturing the post-action state

This keeps the logic centralized and reusable rather than scattering Applitools calls through the test files.

### 2. Fixture-based access to the visual helper

The shared fixture setup in [src/fixtures/page.fixtures.ts](../src/fixtures/page.fixtures.ts) exposes a `visual` fixture that page objects can consume. This gives the page-object layer access to the helper without making the specs responsible for setup details.

### 3. Page-object-level checkpoints

Visual checkpoints are now attached to the page objects rather than the specs.

Examples:
- [src/page/login/login.page.ts](../src/page/login/login.page.ts)
  - captures the login page state
  - captures the authenticated account page state
- [src/page/login/signup-to-approved-order.page.ts](../src/page/login/signup-to-approved-order.page.ts)
  - captures the duplicate-email validation error state

This keeps specs focused on business behavior and makes the visual assertions easier to maintain.

### 4. Multi-device viewport support

The Playwright config now defines two projects so the same test suite runs for both desktop and mobile viewports:
- `chromium-desktop` with a viewport of 1440 × 900
- `chromium-mobile` with a viewport of 393 × 852

This is configured in [playwright.config.ts](../playwright.config.ts).

---

## How it works

### Visual mode activation

Applitools only runs when the environment variable `APPLITOOLS_ENABLED=true` is set.

In that mode:
- the Applitools reporter is selected
- tests tagged with `@visual` are included in the run
- the configured checkpoints are sent to Applitools for comparison

### Device execution model

Each test is executed once per configured project:
1. desktop project
2. mobile project

That means a single spec can produce two visual runs, one for each viewport, without duplicating the test logic itself.

### Why this is useful

It gives coverage for both:
- wide-screen layouts and spacing
- mobile-specific stacking, overflow, and tap targets

This is especially important for responsive apps where the same UI may render very differently across devices.

---

## Selective execution

You can run only one viewport set at a time by targeting the specific Playwright project.

### Run only desktop tests

```bash
npx playwright test --project=chromium-desktop
```

### Run only mobile tests

```bash
npx playwright test --project=chromium-mobile
```

### Recommended custom commands

To make this simpler for the team, add npm scripts such as:

```json
"test:visual:desktop": "cross-env ENV_TYPE=dev APPLITOOLS_ENABLED=true npx playwright test src/specs --project=chromium-desktop --grep @visual",
"test:visual:mobile": "cross-env ENV_TYPE=dev APPLITOOLS_ENABLED=true npx playwright test src/specs --project=chromium-mobile --grep @visual"
```

These commands make it easy to run only the desktop or only the mobile visual suite without changing the test code.

---

## Best practices used in the implementation

- Keep visual logic centralized in shared helpers
- Keep specs focused on functional flow and test data
- Use page objects for UI-state capture
- Use project-based configuration for device matrix coverage
- Keep visual testing opt-in so regular functional runs stay simple
- Use meaningful checkpoint names that reflect the user-visible state

---

## Benefits added by this implementation

### 1. Responsive UI coverage

The suite now validates the UI for both desktop and mobile layouts, which helps catch responsive regressions.

### 2. Lower maintenance cost

The same tests run across devices without branching logic in each spec.

### 3. Better visual regression detection

Layout issues that only show up on one device type are easier to detect.

### 4. Cleaner test structure

The business flow remains in the specs while the visual orchestration lives in the helper and page-object layer.

### 5. Flexible execution

You can run the full matrix, only desktop, or only mobile depending on the need.

---

## Summary

The current Applitools integration is a practical, maintainable, and low-risk addition to the framework. It keeps the test suite clean, centralizes visual logic, improves regression coverage, and provides a stronger reporting path for UI-sensitive flows.
The current implementation now provides a robust visual testing foundation for both desktop and mobile experiences. It combines Applitools-based visual validation with Playwright project-based device coverage, while keeping the test structure maintainable and easy to extend.
