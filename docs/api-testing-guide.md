# BlueChew Enterprise Automation: Complete 3-Tier Testing & API Architecture Guide

---

## 1. Executive Summary & Plain-English Introduction

Welcome to the **BlueChew Automation Framework**. This guide explains the entire testing architecture, how our automated tests work, and how anyone—including non-technical team members, product managers, and manual QA testers—can run, understand, and customize them with ease.

### What is API Testing & Why Do We Need It?
When you use a website like BlueChew, what you see on the screen (buttons, forms, pictures) is the **Frontend User Interface (UI)**. Behind the scenes, the browser sends invisible data messages back and forth to server programs called **APIs (Application Programming Interfaces)**.

* **UI Testing (Tier 1)** opens a real browser, types on keys, and clicks buttons just like a human. This is thorough, but it is relatively slow (taking 30–60 seconds per test).
* **Visual Testing (Tier 2)** takes pixel-perfect pictures of the screen to make sure colors, layouts, and fonts look beautiful across phones and laptops.
* **API Testing (Tier 3)** communicates directly with the backend servers via HTTP messages. It tests business logic, security, and databases in **less than 1 second per test**, with zero browser overhead and zero UI flakiness.

---

## 2. The 3-Tier Testing Pyramid

Our framework organizes all automated tests into three distinct, complementary layers:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 TIER 1: UI Functional                  │
                  │   Browser User Journeys & End-to-End Workflow Tests    │
                  │  (Registration, Quiz, Medical Intake, Order Checkout)  │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                  ┌───────────────────────────┴────────────────────────────┐
                  │               TIER 2: Visual Regression                │
                  │    Pixel-by-Pixel Screen & Layout Verification         │
                  │  (Playwright Native Snapshots + Applitools Eyes AI)    │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                  ┌───────────────────────────┴────────────────────────────┐
                  │                 TIER 3: API Automation                 │
                  │      Direct Backend Service & Contract Validation      │
                  │  (Login, Session State, Schema Rules, Latency SLAs)    │
                  └────────────────────────────────────────────────────────┘
```

| Testing Tier | What It Tests | Typical Speed | Primary Benefit |
| :--- | :--- | :--- | :--- |
| **Tier 1: UI Functional** | Complete user journeys (Sign up → Medical Questionnaire → Checkout → Order Approval). | 30–90 seconds per test | Ensures the entire web application functions correctly for real end users. |
| **Tier 2: Visual Regression** | Visual appearance, layout consistency, mobile responsiveness, and Figma design alignment. | 15–40 seconds per test | Catches accidental visual glitches, broken CSS styling, and displaced buttons. |
| **Tier 3: API Services** | Backend business logic, authentication tokens, response formats, and server speed. | **0.5–2 seconds per test** | Lightning-fast feedback, 100% reliable, pinpoints backend bugs instantly. |

---

## 3. Directory Dissection: Every Component Explained

The codebase is organized cleanly to follow the **DRY (Don't Repeat Yourself)** principle, ensuring high readability and easy maintenance.

```
blueChew-automation/
├── docs/
│   └── api-testing-guide.md            # This comprehensive architecture guide
├── src/
│   ├── api/                            # Tier 3: API Automation Engine & Controllers
│   │   ├── base/
│   │   │   └── base.api.client.ts      # Core HTTP engine (latency timing, logs, Allure attachments, AJV)
│   │   ├── controllers/                # Service Object Model (SOM) domain controllers
│   │   │   ├── auth.api.ts             # Login, forgot password, session, logout actions
│   │   │   ├── product.api.ts          # Treatments, plans, pricing, promo codes
│   │   │   ├── registration.api.ts     # Email check, state eligibility, onboarding
│   │   │   ├── profile.api.ts          # Profile details, addresses, notifications
│   │   │   ├── checkout.api.ts         # Shipping calculation, tax, order placement
│   │   │   └── admin.api.ts            # User search, patient intake approval, state reset
│   │   └── index.ts                    # Single-point export barrel (@api)
│   ├── data/                           # Explicit 3-Tier Test Data Layer
│   │   ├── tier1-functional/           # Tier 1 UI Functional Test Data
│   │   │   ├── login/                  # Login, Profile, and E2E Journey test data
│   │   │   ├── registration/           # Registration validation test data
│   │   │   └── product/                # Product checkout & Landing Max test data
│   │   ├── tier2-visual/               # Tier 2 Visual Regression Configs & Snapshots
│   │   │   ├── figma.visual.data.ts    # Figma design coordinates & Applitools configs
│   │   │   └── footer-redirects.data.ts# Footer redirect links & visual baselines
│   │   ├── tier3-api/                  # Tier 3 API Test Data
│   │   │   └── api.data.ts             # Centralized API credentials, SLAs, and JSON schemas
│   │   └── assets/                     # Shared test assets (sampleID.jpg)
│   ├── fixtures/
│   │   ├── api.fixtures.ts             # Dedicated API fixtures (authApi, productApi, etc.)
│   │   └── page.fixtures.ts            # Hybrid fixture providing both UI Page Objects & API Controllers
│   ├── interfaces/
│   │   └── api/                        # TypeScript type definitions for requests and responses
│   ├── page/                           # Tier 1: Page Object Model classes (UI screens)
│   ├── specs/                          # Explicit 3-Tier Test Specs Layer
│   │   ├── tier1-functional/           # Tier 1 UI Functional & E2E Specs
│   │   │   ├── login/                  # login.spec.ts, profile.spec.ts, signup-to-approved-order.spec.ts
│   │   │   ├── registration/           # registration-validation.spec.ts
│   │   │   └── product/                # product-checkout.spec.ts, landing-max.spec.ts
│   │   ├── tier2-visual/               # Tier 2 Visual Regression Specs
│   │   │   ├── login-visual.spec.ts    # Playwright native snapshot comparisons
│   │   │   ├── footer-redirects.spec.ts# Footer visual & redirect validation
│   │   │   └── applitools-mcp-demo.spec.ts # Applitools Eyes integration
│   │   └── tier3-api/                  # Tier 3 API Specs
│   │       └── auth.api.spec.ts        # Flagship Tier 3 API test suite
│   └── utilities/
│       ├── test.helper.utils.ts        # Reporting & test metadata helpers (surfaces Tier in reports)
│       ├── testData.generate.utils.ts  # Dynamic test account & email generator
│       └── visual.helper.ts            # Dual-engine visual regression helper
└── package.json                        # Project configuration and tier runner scripts
```

### Component Breakdown:

1. **`src/api/base/base.api.client.ts` (The Core Engine)**:
   This is the backbone of Tier 3. It handles all network communication using Playwright's built-in `APIRequestContext`. It automatically:
   - Records the exact duration of every network call in milliseconds.
   - Attaches the complete request (URL, headers, body) and response (status, payload, latency) directly into the **Allure Report**.
   - Validates response bodies against strict JSON Schemas using **AJV**.

2. **`src/api/controllers/` (The Service Representatives)**:
   Instead of writing raw URLs in test files, each feature area has a clean "Controller" class (e.g. `AuthApiClient`, `ProductApiClient`). Test cases simply call human-readable methods like `authApi.login(credentials)` or `authApi.getSession()`.

3. **`src/data/tier3-api/api.data.ts` (The Tier 3 Data & Rules Desk)**:
   Contains all test credentials, expected latency thresholds (SLAs), and JSON Schemas in one centralized location. Each data object explicitly specifies its `tier: 'Tier 3 - API Automation'` classification.

4. **`src/fixtures/api.fixtures.ts` & `src/fixtures/page.fixtures.ts` (The Bridge)**:
   Injects the API controllers into test files automatically, so tests are clean and do not require manual initialization.

5. **`src/specs/tier3-api/auth.api.spec.ts` (The Flagship Test Scenario)**:
   Contains the step-by-step test logic, assertions, and verifications showcasing every API capability.

---

## 4. Deep-Dive: The Flagship API Showcase Test Case

Our flagship API test case (`src/specs/tier3-api/auth.api.spec.ts`) demonstrates **every capability** of the Tier 3 automation engine in a single, comprehensive lifecycle test:

```typescript
// Test Case: API-01-User-Authentication-Showcase
```

### The 6 Sequential Validation Steps:

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │ 1. Positive Login & SLA Timing Check (POST /api/auth/login)             │
 │    - Verifies HTTP 200 Status                                           │
 │    - Benchmarks Latency (< 5000ms SLA threshold)                        │
 │    - Validates Contract Structure with AJV JSON Schema                  │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │ (Extract Bearer Token)
 ┌────────────────────────────────────┴────────────────────────────────────┐
 │ 2. Stateful Session Query with Token (GET /api/auth/session)            │
 │    - Injects extracted Bearer token into Authorization header           │
 │    - Verifies active session data and response latency (< 3000ms SLA)   │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
 ┌────────────────────────────────────┴────────────────────────────────────┐
 │ 3. Negative Scenario: Invalid Password Handling                         │
 │    - Sends incorrect password, verifies server gracefully rejects       │
 │    - Asserts error schema integrity                                     │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
 ┌────────────────────────────────────┴────────────────────────────────────┐
 │ 4. Negative Scenario: Malformed / Empty Email Handling                  │
 │    - Sends missing email payload, verifies client/server validation     │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
 ┌────────────────────────────────────┴────────────────────────────────────┐
 │ 5. Password Reset Contract (POST /api/auth/forgot-password)             │
 │    - Validates password recovery endpoint and response timing           │
 └────────────────────────────────────┬────────────────────────────────────┘
                                      │
 ┌────────────────────────────────────┴────────────────────────────────────┐
 │ 6. Session Invalidation & Logout (POST /api/auth/logout)                │
 │    - Cleanly closes the active session                                  │
 └─────────────────────────────────────────────────────────────────────────┘
```

### What Makes This Test Framework "Gold-Standard"?
* :zap: **Performance SLA Benchmarks**: Every single API request is checked against a maximum allowable latency (`assertResponseTime`), catching server slowdowns before they reach production.
* :shield: **AJV Schema Contract Testing**: Ensures the backend does not accidentally remove, rename, or change data types (e.g. changing an ID from a string to a number).
* :link: **Stateful Token Propagation**: Shows how data returned from one request (a login token) is automatically extracted and used in subsequent requests.
* :mag: **Full Audit Logging & Allure Attachments**: Every request URL, payload, header, duration, and response body is automatically captured into the Allure test report without writing any extra logging code.

---

## 5. How to Run the Tests (Step-by-Step for Anyone)

You don't need programming knowledge to run these tests. Just open your terminal in the project directory:

### 1. Run Entire Tiers (Fast & Automated)
```bash
# Run All Tier 1 UI Functional Tests
npm run test:tier1

# Run All Tier 2 Visual Regression Tests
npm run test:tier2

# Run All Tier 3 API Tests (Fastest — takes ~20 seconds)
npm run test:tier3
```

---

### 2. Run Specific Domain Tests
```bash
# Run Login UI test
npm run test:login

# Run Registration validation UI test
npm run test:registration

# Run Product checkout UI test
npm run test:product

# Run API Authentication Showcase
npm run test:api:auth
```

---

### 3. Run Tier 2 Visual Regression Tests
```bash
# Run Playwright visual snapshot comparison
npm run test:login:visual:playwright

# Run Applitools Eyes visual test
npm run visual:applitools
```

---

### 4. View the Interactive Allure Test Report
After running any test, generate and view the rich visual dashboard with full charts, step timings, and attached API payloads:
```bash
npm run allure:serve
```
*This command generates the report and opens it in your default web browser automatically.*

---

## 6. How to Edit & Customize Tests (For Non-Technical Users)

All test parameters are kept in human-readable configuration files with clear tier metadata.

### Scenario A: Changing Test Credentials or Server Timeout Thresholds
Open `src/data/tier3-api/api.data.ts`:
```typescript
export const authApiScenarios = {
  validUser: {
    email: 'your-custom-user@bluechew.com',  // <-- Edit email here
    password: 'YourPassword123!',           // <-- Edit password here
  },

  performanceSla: {
    maxLoginDurationMs: 3000,               // <-- Change max allowed latency (in ms)
    maxSessionDurationMs: 2000,
  },
};
```

---

### Scenario B: Adding a New Test Scenario in `auth.api.spec.ts`
To test a new scenario (for example, testing an invalid email format), simply copy and paste this block into `src/specs/tier3-api/auth.api.spec.ts`:

```typescript
await test.step('7. Reject authentication with special character email', async () => {
  const response = await authApi.login({
    email: '###invalid$$$@test.com',
    password: 'SomePassword123!',
  });

  // Verify server rejects with 400 or 422
  expect([400, 422]).toContain(response.status);
});
```

---

## 7. Hybrid Testing: Accelerating UI Tests with APIs

One of the biggest advantages of our framework is **Hybrid Testing**: using Tier 3 APIs inside Tier 1 UI tests to eliminate slow, repetitive UI setup steps.

### Real-World Example: Fast Patient Approval in E2E Tests
In a traditional UI test, approving a new patient requires:
1. Logging into the admin portal in a browser (~15s)
2. Searching for the patient name (~5s)
3. Opening the medical intake review page (~10s)
4. Clicking "Approve Prescription" and confirming (~10s)
*Total time: ~40 seconds.*

With our hybrid framework, the test can approve the patient **in 0.8 seconds via API** and reload the page:
```typescript
import { test, expect } from '@fixtures/page.fixtures';

test('E2E with Instant API Approval', async ({ page, registrationPage, adminApi }) => {
  // Step 1: User signs up on UI
  await registrationPage.navigateToPage(regData);
  await registrationPage.fillEmailAndPassword(regData);

  // Step 2: Instant Patient Approval via Admin API (0.8s!)
  await adminApi.approvePatient({
    patientId: '12345',
    status: 'Approved',
  });

  // Step 3: User continues directly to checkout on UI
  await page.reload();
});
```

---

## 8. Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: What does it mean if an API test fails with a "Latency SLA" error?
**Answer**: The backend server took longer to respond than the allowed threshold (e.g. took 5.2 seconds when the SLA limit is 5.0 seconds). This indicates a server performance bottleneck or network lag.

### Q2: What does it mean if an API test fails with an "AJV Schema Error"?
**Answer**: The backend server changed its JSON response format (e.g. a field named `userId` was renamed to `user_id` or removed). The test caught a breaking contract change before it broke the frontend website.

### Q3: Where are the logs and test artifacts saved?
- Playwright HTML Report: `playwright-report/index.html`
- Allure Test Report: `allure-report/index.html`
- Visual Screenshots & Snapshots: `__snapshots__/` & `src/data/tier2-visual/`

---

## 9. Summary Command Reference

| Action | Command |
| :--- | :--- |
| **Run All Tier 1 UI Functional Tests** | `npm run test:tier1` |
| **Run All Tier 2 Visual Regression Tests** | `npm run test:tier2` |
| **Run All Tier 3 API Automation Tests** | `npm run test:tier3` |
| **Run API Showcase Tests** | `npm run test:api` (or `npm run test:api:auth`) |
| **Run UI Login Test** | `npm run test:login` |
| **Run UI Registration Test** | `npm run test:registration` |
| **Run UI Product Checkout Test** | `npm run test:product` |
| **Run Visual Snapshot Tests** | `npm run test:login:visual:playwright` |
| **Run Applitools Eyes Visual Tests** | `npm run visual:applitools` |
| **View Allure Dashboard** | `npm run allure:serve` |
