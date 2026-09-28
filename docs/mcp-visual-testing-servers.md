# Visual Testing MCP Server: Applitools Eyes

Reference doc for the Applitools MCP server wired into this project so that an AI assistant (Claude Code, Cursor, Copilot, etc.) can drive Applitools Eyes visual testing directly from chat, instead of the human bouncing between the terminal, the Eyes dashboard, and test files.

---

## 1. Applitools MCP (`@applitools/mcp`)

**Package:** [`@applitools/mcp`](https://www.npmjs.com/package/@applitools/mcp) v0.5.16 (installed globally)
**Scope:** Playwright JS/TS projects using the [Eyes Playwright Fixtures SDK](https://applitools.com/docs/eyes/playwright) — which is what [`src/utilities/applitools.utils.ts`](../src/utilities/applitools.utils.ts) uses in this repo.
**Auth:** `APPLITOOLS_API_KEY` (configured in `.env.dev`).

### Tools it exposes

| Tool | What it does |
| :--- | :--- |
| `eyes_verify_api_key` | Checks that a valid Applitools API key is discoverable and that the Eyes server is reachable. |
| `eyes_setup_project` | Bootstraps Eyes in a Playwright project: adds the Eyes reporter, wires config/imports, applies recommended defaults. |
| `eyes_add_checkpoints_to_test` | Inserts `eyes.check(...)` visual checkpoints into an existing Playwright test following Applitools best practices. |
| `eyes_setup_ufg` | Configures the Ultrafast Grid — renders the same DOM snapshot across many browsers/viewports/devices in parallel in the cloud. |
| `eyes_fetch_visual_results` | Pulls back structured results for a batch: test names, statuses (passed/failed/new/unresolved). |
| `eyes_get_batch_url` | Parses console/test-runner output for Eyes session URLs and converts them into one shareable batch dashboard URL. |

---

## 2. Playwright Native Visual Testing

For fast, cost-free local and CI visual regression testing, the framework uses **Playwright Native Screenshot Testing** (`expect(page).toHaveScreenshot()` / `expect(locator).toHaveScreenshot()`).

* Uses Playwright's built-in pixelmatch algorithm.
* Generates interactive visual diff reports (Expected, Actual, Diff, and Slider) directly in the Playwright HTML report (`npm run test:report`).
