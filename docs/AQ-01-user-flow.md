# Automated Test Coverage — User Flows

---

## Functional Tests

### AQ-01 — Sign-up to Approved Order (E2E)
**File:** `src/specs/login/signup-to-approved-order.spec.ts`

Full end-to-end onboarding flow for a brand-new user.

#### Registration
1. Pass app dev gate (`dev.app.bluechew.com/dev-login`)
2. Navigate to login page (`/log-in`)
3. Click **Sign Up** CTA → `/register`
4. **Step 1** — Select state (New York) + accept Terms & Conditions → CONTINUE
5. **Step 2** — Enter email address → CONTINUE
6. **Step 3** — Set password → CONTINUE
7. Verify redirect to quiz page (`dev.bluechew.com/quiz`)

#### Quiz
8. Pass quiz-domain dev gate if present (separate from app gate)
9. Transition splash screen auto-advances to question 1
10. **Q1** — "What kind of performance boost are you looking for?" → All of the above
11. **Q2** — "Are you looking to boost arousal & get harder?" → Yes
12. **Q3** — "Do you want extra-strength options?" → No, just the standard strength
13. Loading screen → verify redirect to `/results`

#### Results
14. Verify results page loaded (`Your Recommendations`)
15. Click **TRY GOLD** CTA → (logged-in user) redirects directly to `/medical`

#### Medical Profile (new DS component flow)
16. **Legal name** — Enter first + last name → CONTINUE
17. **Date of birth** — Enter `01/01/1990` → CONTINUE
18. **Biological sex** — Select **Male** (auto-advances)
19. **Patient confirmation** — Select **Yes** (auto-advances)
20. **Reason for choosing BlueChew** — Select first checkbox option → CONTINUE
21. **Fitness questions** (walk 1 mile, sex without chest pain) — **Yes** for each → CONTINUE
22. **Medical conditions** (heart, nitrates, blood pressure, etc.) — **No** for each → CONTINUE
23. Remaining health questions answered adaptively → verify redirect to `/checkout`

#### Checkout
24. Dismiss product intro slide
25. Select strength
26. Select plan (uses per month)
27. Proceed to payment page

#### Shipping
28. Fill shipping address (123 Main St, New York, NY 10001)
29. Confirm address

#### Order Summary & Payment
30. Verify order total ($229 Gold plan)
31. Click **CONTINUE TO PAYMENT** (if shown)
32. Fill Stripe card details (test card 4242..., expiry, CVC) via iframe frame-scan
33. Click **BUY NOW** → verify redirect to `/checkout/confirmation`

#### Confirmation
34. Upload ID photo via file chooser
35. Verify "Connecting to Provider" state
36. Wait for provider queue

#### Admin Verification
37. Navigate to `dev.admin.bluechew.com`
38. Login with admin credentials
39. Go to Users
40. Search for test email → confirm account was created

---

### AQ-02 — User Login
**File:** `src/specs/login/login.spec.ts`

Login flow for an existing user.

1. Pass app dev gate → navigate to `/log-in`
2. Enter registered email and password
3. Click **Log In**
4. Verify successful login and dashboard access
