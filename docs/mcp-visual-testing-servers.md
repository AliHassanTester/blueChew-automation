# Visual Testing MCP Servers: Applitools & Percy

Reference doc for the two MCP servers wired into this project so that an AI assistant (Claude Code, Cursor, Copilot, etc.) can drive Applitools Eyes and Percy visual testing directly from chat, instead of the human bouncing between the terminal, the Eyes/Percy dashboards, and the test files.

Both are now registered as MCP servers for this project. See [Setup status](#setup-status-in-this-project) for what's live and what still needs a credential.

---

## 1. Applitools MCP (`@applitools/mcp`)

**Package:** [`@applitools/mcp`](https://www.npmjs.com/package/@applitools/mcp) v0.5.16 (installed globally)
**Scope:** Playwright JS/TS projects using the [Eyes Playwright Fixtures SDK](https://applitools.com/docs/eyes/playwright) — which is exactly what [`src/utilities/applitools.utils.ts`](../src/utilities/applitools.utils.ts) already uses in this repo.
**Auth:** `APPLITOOLS_API_KEY` (already present in `.env.dev`, wired into the MCP config).

### Tools it exposes

| Tool | What it does |
| :--- | :--- |
| `eyes_verify_api_key` | Checks that a valid Applitools API key is discoverable (env var, `.env`, `applitools.config.*`, or `playwright.config.*`) and that the Eyes server is reachable. |
| `eyes_setup_project` | Bootstraps Eyes in a Playwright project: adds the Eyes reporter (so pass/fail/new results show up inline in the Playwright HTML report), wires config/imports, applies recommended defaults. |
| `eyes_add_checkpoints_to_test` | Inserts `eyes.check(...)` visual checkpoints into an existing Playwright test, following Applitools best practice (naming, region targeting, etc.) instead of a human hand-writing them. |
| `eyes_setup_ufg` | Configures the Ultrafast Grid — renders the same DOM snapshot across many browsers/viewports/devices in parallel in the cloud, without needing real browser grids locally. |
| `eyes_fetch_visual_results` | Pulls back structured results for a batch: test names, statuses (passed/failed/new/unresolved), grouped by batch. |
| `eyes_get_batch_url` | Parses raw console/test-runner output for Eyes session URLs and converts them into one shareable batch dashboard URL. |

### How the AI uses it here

- **Adding a new visual test**: instead of manually copying the checkpoint pattern from an existing spec, ask "add Eyes checkpoints to `src/specs/product/product-checkout.spec.ts` for the strength-selector step" — the assistant calls `eyes_add_checkpoints_to_test`, matching the conventions the SDK expects (this replaces what we currently do by hand by reading `applitools.utils.ts` and copy-pasting).
- **After a CI run**: "summarize the last Eyes batch" → `eyes_fetch_visual_results` + `eyes_get_batch_url`, so a failed run's dashboard link and pass/fail breakdown shows up in chat without opening the Eyes app.
- **Onboarding a new spec file to visual testing**: `eyes_setup_project` / `eyes_setup_ufg` guide the assistant through the same setup steps documented in [`docs/visual-testing-guide.md`](visual-testing-guide.md), so it can apply them consistently to a new test file rather than reinventing config.
- **Sanity-checking the environment**: `eyes_verify_api_key` lets the assistant confirm `APPLITOOLS_API_KEY` is valid *before* burning a CI run on a config problem.

### Value this adds

The Eyes SDK integration already exists in this repo — the MCP server doesn't replace it, it removes the manual, error-prone steps around it: writing checkpoint boilerplate by hand, hunting for the right dashboard URL in console spew, and re-deriving "was this a real regression or a new baseline" from raw JSON. It turns "go check the Eyes dashboard" into something answerable inline in the same chat the test was written in.

---

## 2. Percy MCP (via `@browserstack/mcp-server`)

**Package:** [`@browserstack/mcp-server`](https://www.npmjs.com/package/@browserstack/mcp-server) (installed globally)
**Important:** Percy doesn't ship its own standalone MCP package. Percy support lives *inside* BrowserStack's general-purpose MCP server (44 tools total — Test Management, Automate/App Automate, Observability, Accessibility, App Live, AI agents, and Percy). Registering this server gives the assistant all of those, not just Percy; this doc only covers the Percy-relevant slice.
**Auth:** requires a full BrowserStack account (`BROWSERSTACK_USERNAME` + `BROWSERSTACK_ACCESS_KEY`), **not** the `PERCY_TOKEN` already in `.env.dev`. See [Setup status](#setup-status-in-this-project) — this is the missing piece.

### Percy tools it exposes

| Tool | What it does |
| :--- | :--- |
| `percyVisualTestIntegrationAgent` | Integrates Percy into a project from scratch and walks through a demo visual-change detection, for projects that don't have Percy yet. |
| `expandPercyVisualTesting` | Extends Percy coverage in a project that already has it (Percy Web Standalone or Percy Automate) — e.g. adding snapshots to newly written flows. |
| `addPercySnapshotCommands` | Inserts `percySnapshot(...)` calls into specified test files (local file/process state — not available via Remote MCP). |
| `listTestFiles` | Lists test files under given directories, so the assistant can pick real candidates for the two tools above instead of guessing paths. |
| `runPercyScan` | Kicks off a Percy visual build/scan run (local only). |
| `fetchPercyChanges` | Retrieves and summarizes the visual diffs Percy AI found between the latest build and the previous one — the "what changed" readout. |
| `managePercyBuildApproval` | Approves or rejects a Percy build directly from chat, instead of opening the Percy dashboard. |

### How the AI uses it here

- **Extending coverage**: "add Percy snapshots to the new subscription-management flow" → `listTestFiles` finds the spec, `addPercySnapshotCommands` inserts the calls in the same style [`scripts/test-visual.js`](../scripts/test-visual.js) already uses to drive Percy runs for desktop/mobile viewports.
- **After a PR pushes a build**: "what did Percy flag on the latest build?" → `fetchPercyChanges` returns a plain-language diff summary instead of a human clicking through every snapshot in the dashboard.
- **Unblocking a PR**: "approve the current Percy build, the diffs are just the new banner" → `managePercyBuildApproval`, so review/approval can happen without leaving the chat that's already discussing the change.
- **Bootstrapping a fresh area**: `percyVisualTestIntegrationAgent` / `expandPercyVisualTesting` apply Percy's own recommended setup pattern, which the assistant can then reconcile with our existing dual-provider runner (`VISUAL_PROVIDERS=percy,applitools` in `.env.dev`).

### Value this adds

Today, Percy build review means: open the Percy dashboard, scroll through snapshots, decide pass/fail, click approve/reject — a context switch away from the terminal and the PR. `fetchPercyChanges` + `managePercyBuildApproval` collapse that into a chat exchange, and `addPercySnapshotCommands`/`listTestFiles` remove the copy-paste step of wiring up snapshot calls in new specs by hand.

---

## 3. Combined value: why both, together

This repo intentionally runs **both** providers side by side (see [`docs/applitools-vs-percy.md`](applitools-vs-percy.md) — Applitools for high-fidelity Figma-baseline checks, Percy for cheap/fast PR regression shielding). Wiring up both MCP servers means the assistant can work the same dual-provider workflow a human does, in one place:

1. Write/extend a spec with checkpoints for **both** providers (`eyes_add_checkpoints_to_test` + `addPercySnapshotCommands`) in one pass.
2. Run it (`npm run visual:all` today; `runPercyScan` covers the Percy half from chat).
3. Pull results from **both** dashboards without opening either (`eyes_fetch_visual_results` / `eyes_get_batch_url` + `fetchPercyChanges`).
4. Act on the outcome — approve the Percy build, or flag an Eyes regression for a human to review — from the same conversation.

Net effect: less dashboard-hopping, less hand-written checkpoint boilerplate, and visual-test results become something the assistant can reason about and report on directly, the same way it already reports on Playwright test output.

---

## Setup status in this project

| Server | Registered in `~/.claude.json`? | Credentials | Status |
| :--- | :--- | :--- | :--- |
| `applitools-mcp` | ✅ (`npx --yes @applitools/mcp@latest`) | `APPLITOOLS_API_KEY` pulled from `.env.dev` | **Ready to use** |
| `browserstack-mcp` | ✅ (`browserstack-mcp-server`, global bin) | `BROWSERSTACK_USERNAME` / `BROWSERSTACK_ACCESS_KEY` — **not set** | **Needs credentials** before Percy tools that call the API (`fetchPercyChanges`, `managePercyBuildApproval`, integration agents) will authenticate |

Notes:
- The existing `PERCY_TOKEN` in `.env.dev` is a project **write** token used by `@percy/cli`/`@percy/playwright` to *upload* snapshots during a test run — it is not the same credential the BrowserStack MCP server needs to *read* build results or approve/reject builds. Those require a full BrowserStack account username + access key (Account Settings → API Credentials on browserstack.com).
- Restart the Claude Code session (or reconnect MCP servers) after this config change for both servers to come online — MCP servers are loaded at session start, not hot-reloaded.
- Once BrowserStack credentials are added, fill them into the `browserstack-mcp` entry in `~/.claude.json` (or better, reference env vars there instead of hardcoding the access key).
