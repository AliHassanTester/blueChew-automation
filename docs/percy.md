# Percy Visual Testing

This project integrates Percy for visual testing through `@percy/playwright` and a small `VisualHelper` wrapper, so the existing Playwright Page Object architecture can record snapshots without large refactors.

## Current flow

1. `scripts/test-visual.js` loads the chosen `.env.<ENV_TYPE>` file.
2. It validates `PERCY_TOKEN` is present.
3. It runs `npx percy exec -- npx playwright test --grep @percy`.
4. Page objects take snapshots via `VisualHelper.captureCheckpoint(...)`.

## Key files

- `scripts/test-visual.js` — entrypoint for visual test runs. Loads env variables and starts Percy.
- `src/utilities/visual.helper.ts` — encapsulates Percy `percySnapshot` usage.
- `src/fixtures/page.fixtures.ts` — provides the shared `visual` fixture and passes it into page objects.
- `src/page/login/login.page.ts` and `src/page/account/profile.page.ts` — example page objects that call `captureCheckpoint(...)`.
- `playwright.config.ts` — loads `.env.*` based on `ENV_TYPE` for consistency across environments.

## Environment variables

- `PERCY_TOKEN` — required Percy API token.
- `PERCY_ENABLED` — set to `false` or `0` to skip snapshot calls at runtime.
- `ENV_TYPE` — selects `.env.<ENV_TYPE>` (default: `dev`).

> Do not commit Percy tokens to source control. Store secrets in CI securely.

## Run visual tests

Use one of the dedicated Percy commands. Do not use `npm run test visual` — that runs the normal `test` script with an argument.

```bash
npm run test:visual
# or
npm run visual
```

Both commands run the project-specific runner:

```bash
node ./scripts/test-visual.js
```

If you need a different environment:

```bash
ENV_TYPE=prod npm run test:visual
```

To run the login page Percy coverage only:

```bash
npm run test:visual:login
```

## How snapshots are taken

Visual snapshots are created inside the page object flow, not as separate test-only commands. Example checkpoints include:

- `Login page loaded`
- `Login success — account page rendered`
- `Profile - password change success`
- `Profile - shipping address updated`
- `Profile - preferences overview`

These map into Percy snapshots via `VisualHelper.captureCheckpoint(...)`.

## CI example (GitHub Actions)

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
      - name: Install dependencies
        run: |
          npm ci
          npx playwright install chromium
      - name: Run visual tests
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
          ENV_TYPE: dev
        run: |
          npm run test:visual
```

## Debugging no snapshots

If Percy runs but you see no snapshots in the dashboard:

- Confirm `PERCY_TOKEN` is available to the process.
- Confirm `ENV_TYPE` is set correctly so the right `.env.<ENV_TYPE>` file is loaded.
- Confirm the failing spec includes `@visual` in its tag string.
- Confirm the page object actually calls `VisualHelper.captureCheckpoint(...)` in the execution path.
- Check the Percy CLI output for `percySnapshot` calls or any errors.

## Notes

- `PERCY_ENABLED=false` disables visual snapshots while keeping the functional flow intact.
- The implementation no longer uses global setup/teardown for Percy; it relies on `percy exec` instead.

If you want, I can also add a short “Percy smoke test” example that hits a single baseline snapshot first. 