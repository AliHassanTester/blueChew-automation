# Applitools Integration & MCP Server Guide

Guide for Applitools Eyes integration, Figma Design-to-Code visual validation, and Model Context Protocol (MCP) server tools in BlueChew Automation.

---

## 🏗 Architecture Overview

| Component / Path | Purpose |
| :--- | :--- |
| **`.agents/mcp_config.json`** | MCP Server setup declaring the `applitools-mcp` stdio service. |
| **`src/interfaces/applitools.interface.ts`** | Defines `ApplitoolsVisualConfig` (Figma baseline metadata contract). |
| **`src/data/visual/figma.visual.data.ts`** | Central source of truth for Figma artboard baselines (`Login`, `Product`, `Profile`, etc.). |
| **`src/utilities/applitools.utils.ts`** | Eyes session lifecycle, viewport matching, and snapshot upload engine. |
| **`src/utilities/visual.helper.ts`** | Framework wrapper routing checkpoints dynamically to active providers (`applitools`, `percy`). |
| **Page Objects & Specs** | Encapsulate DOM load state (`waitForLoadState('load')`) and trigger visual assertions. |

---

## 🤖 Applitools Eyes MCP Server (`applitools-mcp`)

Connects AI assistants directly to Applitools Eyes via the Model Context Protocol (MCP).

### Configuration (`.agents/mcp_config.json`)
```json
{
  "mcpServers": {
    "applitools-mcp": {
      "command": "applitools-mcp"
    }
  }
}
```

### 🤔 Why Use MCP When We Already Have an AI Agent?

An **AI Agent (LLM)** brings code synthesis and architectural reasoning, but cannot query live SaaS API state directly. **MCP** provides real-time sensors and execution capabilities:

- **Live Cloud Connectivity**: Verify `APPLITOOLS_API_KEY` (`eyes_verify_api_key`) and query batch results (`eyes_fetch_visual_results`) deterministically.
- **In-IDE Triage**: Pull direct dashboard URLs (`eyes_get_batch_url`) to review unresolved diffs inside VS Code.
- **Zero-Doc Setup**: Automatically configure HTML reporters (`eyes_setup_project`) and Ultrafast Grid (`eyes_setup_ufg`).
- **Synergy**: The **AI Agent provides intelligence**, while **MCP provides actionable hands and live sensors**.

---

## 🛠 The 6 Applitools MCP Tools

| Tool Name | Core Function | Effective Usage Scenario |
| :--- | :--- | :--- |
| **`eyes_verify_api_key`** | Validates API key & cloud connectivity. | Pre-flight CI checks & environment setup diagnostics. |
| **`eyes_setup_project`** | Configures Eyes & Playwright HTML reporter. | Initial project setup & embedding visual diff links in test reports. |
| **`eyes_add_checkpoints_to_test`** | Inserts visual assertions into specs. | Replacing 15+ brittle locator assertions with Figma snapshots. |
| **`eyes_setup_ufg`** | Configures Ultrafast Grid cross-browser testing. | Setting multi-device viewports (`1440x915` desktop, `390x844` mobile). |
| **`eyes_fetch_visual_results`** | Fetches JSON batch execution summaries. | Post-run verification & automated CI quality gate checks. |
| **`eyes_get_batch_url`** | Returns direct Applitools dashboard URL. | Instantly opening unresolved visual diffs for approval/rejection. |

---

## 🎨 Figma Design-to-Code Workflow

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 1. Verify Connectivity (eyes_verify_api_key)                           │
 │ Validate APPLITOOLS_API_KEY from .env.dev before running test suites.  │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 2. Setup Project & UFG (eyes_setup_project & eyes_setup_ufg)           │
 │ Configure Eyes HTML reporter and set UFG viewports matching Figma      │
 │ artboard dimensions (1440x915 Desktop, 390x844 Mobile).               │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 3. Figma Baseline Checkpoints (eyes_add_checkpoints_to_test)           │
 │ Bind checkpoints in Page Objects to figma.visual.data.ts configs       │
 │ (appName, testName, baselineEnvName, ignoreDisplacement: true).       │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ 4. Review & Triage (eyes_fetch_visual_results & eyes_get_batch_url)    │
 │ Query batch results in IDE and use batch URL to accept/reject Figma    │
 │ diffs in the Applitools Eyes dashboard.                                │
 └───────────────────────────────────┴────────────────────────────────────┘
```

---

## 💻 Code Example: How to Add Checkpoints in Page Objects & Specs

### 1. In Page Object (`src/page/product/product.page.ts`):
```typescript
async captureProductSnapshot(visualConfig?: ApplitoolsVisualConfig, tag: string = 'Product page loaded'): Promise<void> {
  await this.page.waitForLoadState('load').catch(() => undefined);
  await this.visual.captureCheckpoint(tag, visualConfig);
}
```

### 2. In Test Spec (`src/specs/product/product-checkout.spec.ts`):
```typescript
import { PRODUCT_TADALAFIL_FIGMA_CONFIG } from '@data/visual/figma.visual.data';

test('Verify Product Page Layout', async ({ productPage }) => {
  await productPage.navigateToProduct('tadalafil');
  await productPage.captureProductSnapshot(PRODUCT_TADALAFIL_FIGMA_CONFIG, 'Tadalafil Product Page');
});
```

---

## 🔑 Environment Variables Reference

| Variable | Location | Description |
| :--- | :--- | :--- |
| `APPLITOOLS_API_KEY` | `.env.dev` | Your Applitools Eyes API key. |
| `VISUAL_PROVIDERS` | `.env.dev` | Comma-separated list of active visual runners (`applitools`, `percy`, or `percy,applitools`). |

---

## 💻 Commands Reference

```bash
# Run ALL visual tests (Applitools)
npm run test:visual:applitools

# Run Product Checkout visual tests
npm run test:product:visual:applitools

# Run Profile / Registration / E2E visual tests
npm run test:profile:visual
npm run test:registration:visual
npm run test:e2e:visual
```
