# Visual Integration Guide

This framework now supports multiple visual testing providers via a small provider abstraction.

Supported providers (adapters included):
- Percy (via `@percy/playwright`)
- Applitools (lazy adapter — requires `@applitools/eyes-playwright`)
- UIProbe (stub adapter; implement SDK calls when available)

How it works
- `src/utilities/visual.helper.ts` exposes `VisualHelper.captureCheckpoint(name, options)`.
- `VisualHelper` loads providers configured via the `VISUAL_PROVIDERS` environment variable.
- Tests and page objects continue to call `captureCheckpoint(...)` — no test changes required.

Configuration
- `VISUAL_PROVIDERS` — comma-separated list of providers to enable. Default: `percy`.
  - Examples: `VISUAL_PROVIDERS=percy`, `VISUAL_PROVIDERS=percy,applitools`, `VISUAL_PROVIDERS=applitools`
- `PERCY_ENABLED` — preserved for backward compatibility (`true` by default).
- `APPLITOOLS_API_KEY` — required when using Applitools. Configure in your `.env.<env>` or CI secrets.
- `APPLITOOLS_CONCURRENCY` — optional concurrency for Applitools Visual Grid (default: 5).

Adding a new provider
1. Create a new adapter implementing `IVisualProvider` under `src/utilities/visual.providers`.
2. Register the provider in `AVAILABLE_PROVIDERS` inside `visual.helper.ts`.
3. Add any required SDK to `package.json` and CI secrets/config.

Notes
- Provider errors are recorded as test annotations and do not fail the test run by default.
- Percy still relies on the `percy exec` wrapper for CLI orchestration; the `scripts/test-visual.js` runner remains the primary entrypoint for Percy runs.
