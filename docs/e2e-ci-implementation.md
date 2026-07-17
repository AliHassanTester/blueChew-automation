# E2E in the Monorepo — Implementation Guide (Engineer / QA)

> How to run this Playwright suite from `meds-com/bluechew`'s GitHub Actions. The framework
> stays in **this** repo, unchanged; the monorepo only adds a workflow that calls it.

## Prerequisites

- Suite runs against **deployed** environments (no local `ng serve`), selected by `ENV_TYPE` / `PLAYWRIGHT_BASE_URL`.
- Specs are tagged in their titles: `@smoke`, `@regression`, `@e2e` → selected at runtime with `--grep`.
- Secrets available as **org/repo GitHub secrets**: `E2E_REPO_TOKEN`, `DEV_GATE_PASSWORD`, `PATIENT_PASSWORD`, `ADMIN_PASSWORD`, card test values.

## Step by step

1. **Create `.github/workflows/e2e.yml` in the monorepo** (not in this repo).
2. **Triggers:** `workflow_run` after the `*-deploy-test` workflows complete + `schedule` (nightly) + `workflow_dispatch` (manual, with a `grep` input).
3. **Check out this repo** at run time (`actions/checkout` with `repository:` + `E2E_REPO_TOKEN`) — keeps the framework decoupled from the monorepo.
4. **Match their CI conventions:** Node `22.22.0`, `npm ci`, `npx playwright install --with-deps chromium`.
5. **Run by tag:** `npx playwright test src/specs --grep "<tag>"`; inject secrets as `env:`.
6. **Publish results:** `actions/upload-artifact` for the Playwright HTML report (and Allure if kept).

## The workflow (drop into the monorepo)

```yaml
name: BlueChew E2E
on:
  workflow_run:
    workflows: ["Medical Portal Deploy Test", "Admin Portal Deploy Test"]
    types: [completed]
  schedule: [{ cron: '0 6 * * 1-5' }]            # nightly regression
  workflow_dispatch:
    inputs: { grep: { description: 'tag to run', default: '@smoke' } }

jobs:
  e2e:
    if: ${{ github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
        with: { repository: <org>/blueChew-automation, token: ${{ secrets.E2E_REPO_TOKEN }} }
      - uses: actions/setup-node@v6
        with: { node-version: '22.22.0', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - env:
          ENV_TYPE: dev
          DEV_GATE_PASSWORD: ${{ secrets.DEV_GATE_PASSWORD }}
          password:          ${{ secrets.PATIENT_PASSWORD }}
          ADMIN_PASSWORD:    ${{ secrets.ADMIN_PASSWORD }}
        run: npx playwright test src/specs --grep "${{ github.event.inputs.grep || '@smoke' }}"
      - uses: actions/upload-artifact@v7
        if: always()
        with: { name: playwright-report, path: playwright-report, retention-days: 7 }
```

## What runs when

| Tag | Trigger | Blocking | Purpose |
|---|---|---|---|
| `@smoke` | after deploy to **test** + manual | Yes | fast "deploy didn't break the funnel" gate (~minutes) |
| `@regression` | nightly + manual | No | broader coverage without slowing deploys |
| `@e2e` (full signup→approved-order) | nightly + manual only | No | creates real accounts/approvals — never on PRs |

## Notes for maintainers

- **Adding tests:** just tag the spec (`@smoke`/`@regression`/`@e2e`) — no workflow change needed.
- **Why a separate, non-`paths:`-filtered workflow:** the journey spans patient + admin + doctor + socket, so it can't belong to one unit's path filter; it runs when the **environment** is ready.
- **Keep account-creating flows off PRs.** Parameterize non-deterministic assertions (e.g. reviewing-provider name) before enabling full `@e2e` in CI.
- **Config:** ensure `playwright.config.ts` reads `PLAYWRIGHT_BASE_URL` (fallback to `baseURLs[ENV_TYPE]`) and does not start a local web server in CI.
