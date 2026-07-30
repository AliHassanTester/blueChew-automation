# Percy Visual Testing

This project integrates Percy for visual testing with minimal changes to the existing Playwright + Page Object architecture.

## Key files

- `src/utilities/visual.helper.ts` — wrapper used by page objects to call Percy snapshots.
- `src/fixtures/percy.global.setup.ts` — Playwright global setup that starts the Percy CLI agent when `PERCY_TOKEN` is present.
- `src/fixtures/percy.global.teardown.ts` — Playwright global teardown that stops the Percy agent started during setup.
- `playwright.config.ts` — wired to the global setup/teardown; dotenv is used to load `.env.*`.

## Environment

- `PERCY_TOKEN` — required API token for Percy. Store in CI secrets and/or local `.env.dev` for development.
- `PERCY_ENABLED` — optional switch; set to `false` or `0` to disable visual snapshots at runtime.

Do NOT commit production tokens to the repository. Keep secrets in your CI provider's secure storage.

## NPM script

- `npm run test:visual` — runs Percy-wrapped Playwright tests for specs tagged `@visual`.

```bash
npm run test:visual
```

This expands to:

```bash
cross-env ENV_TYPE=dev npx percy exec -- npx playwright test --grep @visual
```

## GitHub Actions example

Create a workflow that sets `PERCY_TOKEN` as a secret (Settings → Secrets) and uses it during the job.

```yaml
name: Visual tests

on:
  workflow_dispatch:
  push:
    branches: [ main ]

jobs:
  visual:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install deps
        run: |
          npm ci
          npx playwright install chromium
      - name: Run visual tests (Percy)
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
          ENV_TYPE: dev
        run: |
          npm run test:visual
```

## Troubleshooting

- If snapshots are not uploaded, confirm the job has `PERCY_TOKEN` available and check Percy CLI output in the runner logs.
- Use `npx percy --version` to verify the CLI is installed.

If you want additional CI snippets (GitLab, Azure Pipelines) or an npm script that starts Percy via the global setup instead of `percy exec`, tell me which CI runner you use and I will add it.
