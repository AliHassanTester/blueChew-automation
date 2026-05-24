# BlueChew Automation

Playwright + TypeScript end-to-end test framework for [BlueChew](https://bluechew.com) covering the full user onboarding funnel: registration → quiz → results → medical profile → checkout → confirmation → admin verification.

---

## Prerequisites

- Node.js 18+
- npm 9+

```bash
npm install
npx playwright install chromium
```

---

## Environment Setup

Copy the example env file and fill in credentials:

```bash
cp .env.example .env.dev
```

| Variable | Description |
|---|---|
| `DEV_GATE_URL` | Dev gate bypass URL |
| `DEV_GATE_PASSWORD` | Dev gate password |
| `LOGIN_URL` | Login page URL |
| `REGISTRATION_URL` | Registration page URL |
| `POST_REGISTRATION_URL` | URL after registration (quiz) |
| `user_name` | Login test account email |
| `password` | Registration/login account password |
| `STRIPE_CARD_NUMBER` | Stripe test card number |
| `STRIPE_CARD_EXP` | Stripe test card expiry (MM/YY) |
| `STRIPE_CARD_CVV` | Stripe test card CVV |
| `ADMIN_URL` | Admin portal URL |
| `ADMIN_EMAIL` | Admin portal login email |
| `ADMIN_PASSWORD` | Admin portal login password |

---

## Running Tests

### Functional tests

```bash
npm run test:dev                    # All specs against dev environment
npm run test:prod                   # All specs against production
npm run test:ci                     # All specs (CI mode — headless, 4 workers, 1 retry)
npm run test:registration:functional # Registration → checkout funnel only
```

### Individual suites

```bash
npm run test:login        # Login spec + login visual spec
npm run test:registration # Full registration → checkout funnel + registration visual spec
```

### Visual regression tests

```bash
npm run test:visual                   # Run all visual tests against saved snapshots
npm run test:visual:update            # Regenerate ALL visual snapshots

npm run test:login:update             # Regenerate login snapshots only
npm run test:registration:update      # Regenerate registration snapshots only
npm run test:quiz:visual              # Run quiz page visual tests
npm run test:quiz:visual:update       # Regenerate quiz snapshots
npm run test:results:visual           # Run results page visual tests
npm run test:results:visual:update    # Regenerate results snapshots
```

> Run `*:update` whenever intentional UI changes are made, then commit the updated snapshots.

---

## Project Structure

```
src/
  data/           # Test data factories (registration, login)
  fixtures/       # Playwright fixture extensions (page objects wired to test context)
  interfaces/     # TypeScript interfaces for test data and page contracts
  page/           # Page objects
    login/        # LoginPage, RegistrationPage
    quiz/         # QuizPage
    results/      # ResultsPage
    medical/      # MedicalPage
    checkout/     # CheckoutPage
    confirmation/ # ConfirmationPage (ID upload → provider queue)
    admin/        # AdminPage (admin portal user search)
  specs/          # Test specs
    login/        # login.spec.ts, registration.spec.ts
  utilities/      # Shared Playwright helpers (actions, verifications, env, random)
tests/
  fixtures/       # Static test assets (e.g. sample-id.jpg for ID upload)
  visual/         # Visual regression specs and __snapshots__
constants/        # Design token definitions (colors, typography, spacing)
helpers/          # Visual test utilities (validateTokens, screenshotPage, etc.)
```

---

## Test Suites

| Spec | ID | Description |
|---|---|---|
| `login.spec.ts` | AQ-00 | Login with existing account |
| `registration.spec.ts` | AQ-01 | Full new-user onboarding: register → quiz → medical → checkout → confirmation → admin |
| `login.visual.spec.ts` | — | Login page snapshots + CSS token validation |
| `registration.visual.spec.ts` | — | Registration page snapshots + CSS token validation |
| `quiz.visual.spec.ts` | — | Quiz page snapshots + CSS token validation |
| `results.visual.spec.ts` | — | Results page snapshots + CSS token validation |

---

## Reports

After a test run, open the HTML report:

```bash
npx playwright show-report
```

For Allure:

```bash
npm run allure:generate
npm run allure:open
```

---

## Notes

- Visual snapshots are stored under `tests/visual/__snapshots__/` and committed to source control.
- The framework targets `dev.app.bluechew.com` (Angular app) and `dev.bluechew.com` (Next.js quiz/results). Both subdomains are exercised in the registration flow.
- Test emails are auto-generated per run (`aliQA.<rand>.<timestamp>@gmail.com`) and logged to the Playwright annotation panel and console.
- The checkout page has two layout variants (with and without a pre-payment order summary step). `CheckoutPage` detects which variant is active at runtime.
