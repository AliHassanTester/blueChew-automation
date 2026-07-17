# Automated Testing in CI/CD — Overview

> A short, plain-language summary of how we run the BlueChew end-to-end test suite
> automatically inside the delivery pipeline, and why.

## What we're doing

Every time new code is deployed to the **test environment**, our automated tests run themselves and
report whether the core customer journey still works — **sign up → quiz → checkout → payment →
provider approval → first order** — across the whole BlueChew platform.

No one has to remember to test manually. The pipeline does it, every time, the same way.

## How it works (in one picture)

```
Developer merges code
        ▼
Pipeline deploys it to the TEST environment
        ▼
Automated tests launch automatically  ──▶  a real browser walks the full customer journey
        ▼
Pass ✓ / Fail ✗ + a shareable report
```

- **Fast check on every deploy** — a quick "smoke" run confirms the essentials still work within minutes.
- **Deeper check every night** — the full journey (and broader regression set) runs on a schedule.
- **On-demand** — anyone can launch a run with one click when needed.

## Why this approach

- **Catches problems early** — issues surface right after a change, in a safe test environment, before customers ever see them.
- **Tests the real thing** — a real browser exercises the live, deployed app end to end, not isolated pieces.
- **Consistent and repeatable** — the same journey is verified identically every time; no manual variation.
- **Fast where it matters** — quick checks keep releases moving; heavier checks run overnight so they never slow the team down.
- **Transparent** — every run produces a report (screenshots/video on failure) that's easy to share and review.
- **Low overhead** — it plugs into the delivery pipeline the team already uses (GitHub Actions); no separate system to maintain.

## Why GitHub Actions

It's the automation already built into the code platform — so the tests run **in the same place the code is
built and deployed**, with no extra tooling, servers, or licensing. Runs are triggered automatically by
deployments, on a nightly schedule, or manually — and results live right alongside the code.

## What you get

- Confidence that each release keeps the full purchase-to-approval flow working.
- Early warning when something breaks, with evidence attached.
- A repeatable safety net that scales as the product grows — at effectively no added operational cost.
