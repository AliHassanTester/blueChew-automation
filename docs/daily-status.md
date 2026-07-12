# Daily Status — 2026-06-03

- Renamed AQ-01 test → **Sign-up to Approved Order (E2E)** (ID, describe, Allure, spec file, npm `test:e2e`, docs).
- Extended admin flow: search → open user → **Review** (care portal: Set ID Verified → Approve) → verify **Approved, Provider Review**.
- Added **Add Order** (shipping + note) + **subscription started** validation (Gold plan active + "Put On Hold").
- Strengthened **order-added** assertion → checks the actual Pending Orders row with today's queue date.
- Swapped in the **real Wisconsin sample ID** (`sampleID.jpg`); upload flow unchanged ("Submit Anyway").
- Added **televisit** validation — refresh patient page after approval → "MY PLAN" view; asserts "Your order is being processed", active GOLD plan, assigned provider (Ali Hasan, MD).
- Full E2E green end-to-end with all new steps (`1 passed, 3.6m`).

## Next
- Wire the E2E suite into the monorepo pipeline (see [`docs/e2e-ci-implementation.md`](e2e-ci-implementation.md)).
