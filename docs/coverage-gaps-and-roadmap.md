# Playwright E2E — Coverage & Contribution Plan

> **Scope:** Playwright end-to-end tests only. Backend unit/integration tests, Angular
> component (Karma) specs, and CI-trigger wiring are **out of scope for this doc** — the focus
> is the E2E landscape across the repos and **what our suite (`blueChew-automation`) can
> contribute** on top of it. Flow-level view: [`automation-flows.md`](automation-flows.md).

## 0. Sources (verified, pinned)

| Repo | Ref | Inspected |
|---|---|---|
| `blueChew-automation` (ours) | working tree | ✅ directly |
| `meds-com/bluechew` (monorepo) | `bf1b989` / `develop` | ✅ cloned & swept |
| `bluechew-patient-portal` | `da4f726` / `develop` | ✅ cloned & swept |

> Re-pin the SHAs and re-sweep on each portal migration — the monorepo is actively absorbing units.

---

## 1. Playwright E2E that already exists

### 1.1 `blueChew-automation` (ours) — real deployed stack
| ID | Title | Tags |
|---|---|---|
| AQ-01 | Sign-up → Approved Order (full cross-portal E2E) | `@regression @smoke @e2e` |
| AQ-02 | User Login | `@regression @smoke @login` |

AQ-01 spans **patient → admin → care/provider** in one journey: register → quiz → results →
medical → checkout → payment → ID upload → provider queue → admin approval → add order →
subscription-started → televisit. Runs against **deployed** envs (Chromium only). Payment note:
dev checkout renders **Stripe *or* Adyen**; `5555…` works on both, `4242…` is Adyen-declined;
AQ-01 forces Stripe via a `+stripe` email sub-address.

### 1.2 `meds-com/bluechew` — admin portal Playwright (orphaned)
`apps/admin/portal/e2e/` — 5 spec files, POM, `data-test-id`, tags `@smoke`/`@legacy`/`@migration`:
- `smoke/app-shell` — loads login shell (unauth).
- `legacy/login` — form visible; **wrong-credentials → auth error**; credentialed login (`skip` w/o creds); one `fixme`.
- `legacy/app-structure` — login shell loads.
- `legacy/fulfillment` — fulfillment tabs + caps/rules routes reachable (`skip` w/o creds); mutations `fixme`.
- `migration/admin-service-migration` — **API-contract** checks via Playwright `request` (`skip` w/o API + auth).

Net: legacy-parity + shell smoke + API contracts, heavily `skip`/`fixme`-gated. Real
always-on coverage ≈ "login shell renders and rejects bad creds." *(No workflow runs it, but
that's a trigger concern — out of scope here.)* Medical portal's only "e2e" is stock Angular
boilerplate — zero real coverage.

### 1.3 `bluechew-patient-portal` — most mature suite (42 specs)
Two projects (`portal` + `visitor`), POM + fixtures + Percy. **Runs on every PR** against a
local `ng serve` with **mocked backends + a Stripe shim**.

| Area | Files | Nature |
|---|---|---|
| `medical-profile/**` | 20 | **Deep functional** — per-step; asserts draft-clear, exact PUT/raw-POST bodies, nav/back-forward/restore-draft/invalid-step guard |
| `payment-errors` | 1 | **Deep functional** — mocks `/subscription`→400 for all 7 PaymentError codes; asserts friendly banner, no raw-JSON leak |
| `common/**` (sign-in, contact, account-profile) | 3 | Mostly **visual** (Percy snapshot) |
| `account-membership-orders` | 1 | Visual + light nav |
| `percy-only/**` (manage-plan, medical-tab, profile, switch-paused) | 13 | **Pure visual** state snapshots |
| `visitor/**` (landing, product, product-plan, root-baseline) | 4 | **Pure visual** (marketing) |

**Key nuance:** functional tests are localhost + mocked + Stripe-shimmed. They never complete a
**real** purchase, hit a **real** backend, create a real order, or leave the patient portal.

---

## 2. Ownership split (who owns which E2E)

1. **`bluechew-patient-portal`** — patient **component/flow contracts + visual regression**, mocked & fast. Don't re-implement medical-profile or payment-error-banner checks in our suite.
2. **`meds-com/bluechew`** — admin-portal-local parity/contract checks (currently shallow).
3. **`blueChew-automation` (ours)** — the **only** suite on the *real, integrated, deployed* stack: true purchase → payment → **cross-portal** approval → order. **Our contributions should bias to real-backend, real-payment, cross-portal cases and drop anything the patient portal already mocks.**

---

## 3. What we can contribute (new E2E — reconciled)

New `AQ-NN` cases, de-duplicated against §1. Reconciliation rules applied:
- **Registration validation** — not tested anywhere (patient-portal only uses register as a *setup*). Ours = real-deployment check.
- **Card validation / declines** — patient-portal covers **error-banner messaging** (7 codes, mocked). Ours = a **real declined card on the deployed stack**, not banner text.
- **Plans / subscription actions** — states are visually covered; the **functional mutations** (pause/resume/cancel/switch, verified patient+admin) are not.
- **Medical-profile happy path** — fully covered mocked; ours only traverses it inside AQ-01, not standalone.

| ID | Domain | Portal | Title | Prio | Tags |
|---|---|---|---|---|---|
| AQ-03 | Auth | PAT | Login — wrong password shows error, no session | P0 | `@smoke @login @negative` |
| AQ-04 | Auth | PAT | Login — unregistered email rejected | P1 | `@regression @login @negative` |
| AQ-05 | Auth | PAT | Forgot password → reset → login (needs inbox) | P2 | `@regression @auth` |
| AQ-06 | Auth | PAT | Logout clears session; protected route → login | P1 | `@smoke @auth` |
| AQ-07 | Reg | PAT | Register — duplicate email blocked | P0 | `@smoke @registration @negative` |
| AQ-08 | Reg | PAT | Register — invalid email / weak password validation | P1 | `@regression @registration @negative` |
| AQ-09 | Reg | PAT | Register — terms unchecked keeps CONTINUE disabled | P1 | `@regression @registration @negative` |
| AQ-10 | Reg | PAT | Register — restricted/unsupported state handled | P2 | `@regression @registration` |
| AQ-12 | Quiz | PAT | Quiz — alternate path yields non-Gold recommendation | P2 | `@regression @quiz` |
| AQ-13 | Plans | PAT | Select Silver plan → correct price at checkout | P1 | `@regression @checkout` |
| AQ-14 | Plans | PAT | Promo code apply → discount; invalid code → error | P2 | `@regression @checkout` |
| AQ-15 | Pay | PAT | Checkout via **Adyen** (5555 card) → order placed | P0 | `@regression @e2e @payments` |
| AQ-16 | Pay | PAT | **Real** declined card → error → retry succeeds | P0 | `@regression @payments @negative` |
| AQ-18 | Pay | PAT | 3DS/SCA challenge — complete and cancel | P1 | `@regression @payments` |
| AQ-19 | Addr | PAT | Address non-match modal — **Edit** path corrects address | P1 | `@regression @checkout` |
| AQ-21 | ID | PAT | ID upload — invalid file rejected; re-upload succeeds | P1 | `@regression @confirmation @negative` |
| AQ-22 | Acct | PAT | Subscription — Put On Hold → Resume (patient + admin) | P0 | `@regression @account @subscription` |
| AQ-23 | Acct | PAT | Subscription — Cancel → reactivate | P1 | `@regression @account @subscription` |
| AQ-24 | Acct | PAT | Change plan (upgrade/downgrade) reflects on next order | P1 | `@regression @account` |
| AQ-26 | Admin | ADM | Provider review — **Deny** path sets denied status | P0 | `@regression @admin` |
| AQ-29 | Admin | ADM | Order — cancel / refund reflects patient-side | P1 | `@regression @admin @orders` |
| AQ-30 | Care | CARE | ID **rejection** path; request-more-info | P1 | `@regression @care` |
| AQ-31 | SVC | SVC | Televisit socket lifecycle + provider-assignment notification | P2 | `@regression @socket` |
| AQ-32 | X | X | Cross-browser smoke (Firefox + WebKit) of funnel | P1 | `@smoke @cross-browser` |
| AQ-33 | X | X | Mobile-viewport funnel smoke | P1 | `@smoke @mobile` |
| AQ-34 | X | X | Accessibility (axe) smoke on funnel pages | P2 | `@regression @a11y` |

**Priority order to build:** P0 first — AQ-07, AQ-03, AQ-15, AQ-16, AQ-22, AQ-26 → then P1 →
then P2.

### P0 detail

**AQ-03 — Login wrong password** — valid email + wrong password → inline error, still on `/log-in`, no session. Reuse AQ-02 email.

**AQ-07 — Register duplicate email** — run register wizard to the email step with an already-registered address → blocked ("email in use"), no account created.

**AQ-15 — Checkout via Adyen** — force Adyen (omit `+stripe`) → `5555…` → BUY NOW → `/checkout/confirmation`. Closes AQ-01's single-provider blind spot.

**AQ-16 — Real declined card → retry** — card the active provider declines → error surfaced + BUY NOW re-enabled → replace with good card → order completes. (Distinct from patient-portal's mocked banner-copy checks.)

**AQ-22 — Subscription hold/resume** — after an approved order (reuse AQ-01 account): patient Put On Hold → assert held; admin shows held; Resume → assert active both sides.

**AQ-26 — Provider Deny** — in care portal choose **Deny** → assert denied status in admin and on the patient view. Mirrors the existing approve path.
