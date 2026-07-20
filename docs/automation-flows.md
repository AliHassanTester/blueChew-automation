# Automation Flows — Reconciled Catalogue

> Reconciles the **initial account-area automation plan** (Auth, MY PLAN, Orders, Profile,
> Plans, Nav) against the verified coverage of all three repos (`blueChew-automation`;
> `meds-com/bluechew` @ `bf1b989`; `bluechew-patient-portal` @ `da4f726`). Goal: **keep what's
> planned, add only the genuine gaps, drop anything already automated, and honor the stated
> exclusions.** Detailed repo inventory: [`coverage-gaps-and-roadmap.md`](coverage-gaps-and-roadmap.md).

Scope of the initial plan = **patient-portal account area** for an existing (paused) user.
Stack: Playwright · TypeScript · POM · Allure. Selector priority: `data-test-id` → ARIA →
accessible label → stable XPath.

---

## 1. Already automated — KEEP as-is (do not re-add)

| Module | Cases | Notes |
|---|---|---|
| **Authentication** | AUTH-001 login, AUTH-002 forgot-email, AUTH-003 sign-up tab, AUTH-004 logout | ⚠️ **Dedup:** AUTH-001 overlaps existing **AQ-02 (User Login)** — consolidate to one owner |
| **MY PLAN (Membership)** | PLAN-001…007 | ⚠️ **Dedup:** membership view + hold banner overlaps the tail of **AQ-01** (MY PLAN / "Ali Hassan" / hold) — reuse, don't duplicate |
| **Orders** | ORD-001…007 | — |
| **Profile** | PROF-001…009 | Visibility + nav only (functional submits are gaps — see §3) |
| **Plans** | PLANS-001…008 | Selection + content + nav (the actual switch mutation is excluded — see §4) |
| **Navigation (Hamburger)** | NAV-001…009 | — |

## 2. Already planned (deferred regression) — do not re-add

Login negatives are on your roadmap already: **AUTH-REG-001** wrong creds · **AUTH-REG-002**
empty email · **AUTH-REG-003** empty password · **AUTH-REG-004** malformed email.

---

## 3. TO ADD — genuine gaps, in-scope (no OTP / payment / inbox needed)

These aren't in the initial plan, aren't already automated, and don't touch any excluded
dependency. Written in your ID/Case/Expected style so they drop straight in.

### New module — Registration / Sign-up (`REG`)
The plan navigates *to* `/register` (AUTH-003) but never exercises it. Register = state+terms →
email → password (DOB/age lives in the medical profile, which `patient-portal` already covers).

| ID | Test Case | Expected Result |
|---|---|---|
| REG-001 | Sign up with valid new details | Proceeds past register (to quiz/next step) |
| REG-002 | Duplicate/existing email | Blocked with "email in use"; no account created |
| REG-003 | Invalid email format | Inline validation; CONTINUE stays disabled |
| REG-004 | Weak / too-short password | Password validation error; cannot proceed |
| REG-005 | Terms & Conditions unchecked | CONTINUE disabled until accepted |
| REG-006 | Unsupported / restricted state | State blocked or messaged appropriately |

> Duplicate-email and email-verification *link* checks that need an inbox are **out** (matches
> the Mailosaur/Mailinator exclusion) — REG-002 asserts the in-app block only.

### Profile — functional actions (extend `PROF`)
Plan covers link **visibility + nav**; the actual submits are non-OTP, non-billing → in scope.

| ID | Test Case | Expected Result |
|---|---|---|
| PROF-010 | Change Password — submit valid old→new | Success confirmation; can re-login with new password |
| PROF-011 | Update Shipping Address — submit change | Address saved and reflected on profile |
| PROF-012 | Toggle SMS / Email notification preference | Toggle state persists after reload |

> Change **Email** / Change **Phone** stay excluded (OTP).

### Contact (`CONTACT`)
Plan only navigates to `/contact` (ORD-005, NAV-007) — the form itself is untested.

| ID | Test Case | Expected Result |
|---|---|---|
| CONTACT-001 | Submit contact form with valid input | In-app success confirmation shown |

> Only assert the on-screen confirmation — inbox verification is excluded.

### Cross-cutting hardening (`XC`) — optional, high ROI
| ID | Test Case | Expected Result |
|---|---|---|
| XC-001 | Account-area smoke on Firefox + WebKit | Core pages render + nav works cross-browser |
| XC-002 | Account-area on mobile viewport | Membership/Orders/Profile/Nav usable on mobile |
| XC-003 | Accessibility (axe) smoke on account pages | No critical a11y violations |

---

## 4. Excluded / parked — acknowledged, NOT proposed now

Kept here so nothing is lost when the supporting infra lands. Maps your exclusions +
the cross-portal/payment flows from the catalogue.

| Area | Why parked |
|---|---|
| Change Email / Phone **OTP**, **MFA** | OTP/2FA infra dependency (your exclusion) |
| **Resume Plan** click→resumed, **Switch Plan** confirm, Update **payment method** | Billing/subscription **mutation** (your exclusion) — plan currently checks only the button/route |
| Real purchase (Stripe **and** Adyen), declined-card, 3DS/SCA | Real payment processing (your exclusion). *Note:* full purchase→approval already exists as **AQ-01**; payment-error **messaging** already covered (mocked) in `patient-portal` |
| Forgot-password **reset** completion | Needs email-inbox validation (your exclusion) |
| Admin / Care-portal flows (provider **deny**, order cancel/refund, subscription admin, RBAC) | **Different portal** — belongs to the cross-portal EXT suite, not this account-area plan (partly in AQ-01) |

---

## 5. Net change summary

- **Remove / consolidate (already automated):** AUTH-001 ↔ AQ-02; MY PLAN view ↔ AQ-01 tail.
- **Add now (in-scope gaps):** `REG-001…006`, `PROF-010…012`, `CONTACT-001`, optional `XC-001…003`.
- **Leave deferred (already planned):** AUTH-REG-001…004.
- **Keep parked (exclusions):** OTP/MFA, billing mutations (resume/switch/payment method), real payment, forgot-password reset, admin/care flows.
