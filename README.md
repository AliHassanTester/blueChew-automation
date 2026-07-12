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
| `DEV_GATE_PASSWORD` | Dev gate password |
| `LOGIN_URL` | Login page URL |
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
npm run test:smoke                  # Fast smoke subset (@smoke)
npm run test:regression             # Regression subset (@regression)
npm run test:e2e                    # Sign-up → approved order E2E journey
npm run test:login                  # Login spec only
```

Suites are selected by tag (`@smoke`, `@regression`, `@e2e`) via Playwright's `--grep`, which is
also how CI picks what to run — see [`docs/e2e-ci-implementation.md`](docs/e2e-ci-implementation.md).

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
    login/        # login.spec.ts, signup-to-approved-order.spec.ts
  utilities/      # Shared Playwright helpers (actions, verifications, env, random)
tests/
  fixtures/       # Static test assets (e.g. sampleID.jpg for ID upload)
```

---

## Test Suites

| Spec | ID | Description |
|---|---|---|
| `login.spec.ts` | AQ-00 | Login with existing account |
| `signup-to-approved-order.spec.ts` | AQ-01 | Full new-customer journey: sign up → quiz → medical → checkout → payment → confirmation → provider approval → first order |

---

## Reports

After a test run, open the HTML report:

```bash
npx playwright show-report
```

### Allure report

The `allure-playwright` reporter writes results to `allure-results/` on every run.
Allure 3 (Node-based, **no Java required**) renders them.

```bash
npm run allure:serve      # generate + open in one step (quickest)
# or, separately:
npm run allure:generate   # build allure-report/ from allure-results/
npm run allure:open       # serve the generated allure-report/
npm run allure:clean      # delete allure-results/ and allure-report/
```

Each test is tagged with rich metadata so the report is organised and filterable:

- **Behaviors view** — grouped by epic → feature → story
  (e.g. *BlueChew E2E → Authentication → User Login*)
- **Severity** — derived from tags (`@smoke` → critical, else normal)
- **Tags** — parsed from the test's tag string (`@regression @smoke …`)
- **Environment widget** — environment, base URL, Node version, OS, CI flag
- **Categories tab** — failures auto-classified (timeouts, network, locator,
  assertion, skipped)

Metadata is applied centrally in [`logTestCaseData`](src/utilities/test.helper.utils.ts);
per-suite `feature`/`story` are passed from each spec. Environment and category
definitions live in the Allure reporter block of [`playwright.config.ts`](playwright.config.ts).

---

## Notes

- The framework targets `dev.app.bluechew.com` (Angular app) and `dev.bluechew.com` (Next.js quiz/results). Both subdomains are exercised in the registration flow.
- Test emails are auto-generated per run (`aliQA.<rand>.<timestamp>@gmail.com`) and logged to the Playwright annotation panel and console.
- The checkout page has two layout variants (with and without a pre-payment order summary step). `CheckoutPage` detects which variant is active at runtime.
