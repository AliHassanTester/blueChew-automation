# Automation Test Case Tracker (Live Document)

> **Last Updated:** September 2026 | **Framework:** Playwright + TypeScript  
> **Purpose:** Live status matrix of automated test cases, tiers, and plain-language business flows.

---

## 📊 Summary Metrics

| Metric | Count | Breakdown |
|:---|:---:|:---|
| **Total Automated Scenarios** | **20** | 7 Functional · 10 Hybrid · 3 Dedicated Visual |
| **Tier 1 (Critical Smoke / P0)** | **2** | `AQ-01` (Sign-up to Approved Order), `AQ-02` (User Login) |
| **Tier 2 (Deep Flows / P1)** | **15** | 8 Product Checkouts, 3 Profile Settings, 1 Duplicate Reg, 2 Med Safety/Negative, 1 Visual Suite |
| **Tier 3 (Landings & Navigation / P2)** | **3** | MAX Landing, Footer Redirects, Applitools Demo |

---

## 🗂️ Live Test Matrix & Plain-Language Flows

### 🛡️ Tier 1: Core Funnels & Critical Smoke (P0)

| ID | Test Case & File | Type | Plain-Language Flow | Status |
|:---|:---|:---:|:---|:---:|
| **AQ-01** | **Sign-up to Approved Order**<br>[`signup-to-approved-order.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/login/signup-to-approved-order.spec.ts) | ⚡ Hybrid | **Full Journey:** Registers a new user, completes medical quiz, pays with card, uploads ID photo, switches to Admin Portal to approve prescription & create first order, then verifies active subscription. | ✅ Automated |
| **AQ-02** | **User Login**<br>[`login.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/login/login.spec.ts) | ⚡ Hybrid | **Authentication:** Logs in with registered credentials, verifies navigation menus, and confirms successful landing on the membership dashboard. | ✅ Automated |

---

### 📦 Tier 2: Product Checkouts, Clinical Safety & Profile (P1)

| ID | Test Case & File | Type | Plain-Language Flow | Status |
|:---|:---|:---:|:---|:---:|
| **AQ-07** | **Duplicate Email Block**<br>[`registration-validation.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/registration/registration-validation.spec.ts) | 🟢 Functional | **Validation:** Attempts registration with an existing email; confirms the system blocks progress with an error alert. | ✅ Automated |
| **AQ-08** | **Medical Safety & Edge Cases**<br>[`medical-edge-cases.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/medical/medical-edge-cases.spec.ts) | 🟢 Functional | **Clinical Safety:** Verifies non-patient warnings, conditional blood pressure questions, dangerous drug alerts (poppers/nitrates), and rejection of >5MB files. | ✅ Automated |
| **AQ-09** | **Medical Negative Flow**<br>[`medical-negative.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/medical/medical-negative.spec.ts) | 🟢 Functional | **Clinical Safety:** Exercises disqualification alert on behalf-of registration, conditional chest pain explanations, and mandatory blood pressure disclosures. | ✅ Automated |
| **PRODUCT-SILDENAFIL** | **Sildenafil Checkout**<br>[`product-checkout.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/product-checkout.spec.ts) | ⚡ Hybrid | **E2E Order:** Selects Sildenafil plan, completes registration wizard, medical profile, card checkout, and order approval. | ✅ Automated |
| **PRODUCT-TADALAFIL** | **Tadalafil Checkout**<br>[`product-checkout.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/product-checkout.spec.ts) | ⚡ Hybrid | **E2E Order:** Selects Tadalafil plan, completes registration, medical questionnaire, payment, and approval. | ✅ Automated |
| **PRODUCT-VARDENAFIL** | **Vardenafil Checkout**<br>[`product-checkout.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/product-checkout.spec.ts) | ⚡ Hybrid | **E2E Order:** Selects Vardenafil plan and navigates complete checkout and order verification flow. | ✅ Automated |
| **PRODUCT-DAILYTAD** | **Daily Tadalafil Checkout**<br>[`product-checkout.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/product-checkout.spec.ts) | ⚡ Hybrid | **E2E Order:** Verifies order journey for Daily low-dose Tadalafil subscription offering. | ✅ Automated |
| **PRODUCT-MAX** | **BlueChew Max Checkout**<br>[`product-checkout.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/product-checkout.spec.ts) | ⚡ Hybrid | **E2E Order:** Selects high-dosage Max plan and completes entire purchase and approval funnel. | ✅ Automated |
| **PRODUCT-VMAX** | **BlueChew VMax Checkout**<br>[`product-checkout.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/product-checkout.spec.ts) | ⚡ Hybrid | **E2E Order:** Selects VMax plan, fills health forms, completes checkout, and verifies active order. | ✅ Automated |
| **PRODUCT-HOME** | **Homepage Funnel Checkout**<br>[`product-checkout.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/product-checkout.spec.ts) | ⚡ Hybrid | **Funnel Flow:** Starts from homepage hero, takes recommendation quiz, and purchases suggested treatment. | ✅ Automated |
| **PRODUCT-GOLD** | **Gold Plan Checkout**<br>[`product-checkout.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/product-checkout.spec.ts) | ⚡ Hybrid | **Premium Funnel:** Purchases Gold plan with Gold transition screen, comprehensive medical form, and checkout. | ✅ Automated |
| **PRODUCT-GOLD-MED** | **17-Step Medical UI Review**<br>[`product-checkout.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/product-checkout.spec.ts) | 🎨 Visual | **Design QA:** Step-by-step visual snapshot checkpoints across all 17 clinical questionnaire screens. | ✅ Automated |
| **PROF-010** | **Change Password**<br>[`profile.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/login/profile.spec.ts) | 🟢 Functional | **Account:** Updates account password to a temporary password, verifies success, and restores original password. | ✅ Automated |
| **PROF-011** | **Update Shipping Address**<br>[`profile.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/login/profile.spec.ts) | 🟢 Functional | **Account:** Saves a new shipping address, confirms USPS address suggestion modal, and checks profile update. | ✅ Automated |
| **PROF-012** | **Toggle Notifications**<br>[`profile.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/login/profile.spec.ts) | 🟢 Functional | **Account:** Toggles SMS and marketing email preference switches and verifies saved settings confirmation. | ✅ Automated |
| **LOG-VISUAL-DEMO** | **Login UI Regression**<br>[`login-visual.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/login/login-visual.spec.ts) | 🎨 Visual | **Design QA:** Compares full-page & card snapshots, error states, masked dashboard data, and simulates UI defect diffs. | ✅ Automated |

---

### 🌐 Tier 3: Marketing Landings, Navigation & Demos (P2)

| ID | Test Case & File | Type | Plain-Language Flow | Status |
|:---|:---|:---:|:---|:---:|
| **Product-007** | **MAX Landing Page**<br>[`landing-max.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/landing-max.spec.ts) | 🟢 Functional | **Marketing:** Validates MAX promo page layout, pricing comparison cards, and CTA button redirects. | ✅ Automated |
| **FOOTER-001** | **Footer Policy Redirects**<br>[`footer-redirects.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/product/footer-redirects.spec.ts) | 🟢 Functional | **Navigation:** Tests all 12+ footer links (Heroes Program, Refunds, Reviews, FAQs, Telehealth Consent, Privacy Policy). | ✅ Automated |
| **LOG-MCP-DEMO** | **Applitools Eyes Demo**<br>[`applitools-mcp-demo.spec.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/specs/examples/applitools-mcp-demo.spec.ts) | 🎨 Visual | **Demo:** Demonstrates Applitools MCP cloud AI visual test checkpoints during login. | ⏸️ Demo / Standby |

---

## ⚡ Quick Run Commands

```bash
npm run test:smoke              # Tier 1 Critical Smoke (AQ-01, AQ-02)
npm run test:regression         # Tier 1 & Tier 2 Regression suite
npm run test:product            # All Product checkout flows
npm run test:profile            # Password, Shipping Address & Notification preferences
npm run test:visual             # All Visual Regression tests (Applitools / Percy)
npm run test:login:visual:playwright # Native Playwright snapshot regression
```
