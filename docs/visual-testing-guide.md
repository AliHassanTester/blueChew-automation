# Unified Visual Testing Guide

A professional reference for running, configuring, and expanding visual regression and design validation tests in the BlueChew Playwright framework.

---

## 🏗 Architecture Overview

Visual testing utilizes a unified, provider-agnostic architecture. Page Objects and specs call the generic `VisualHelper` wrapper, which routes screenshots dynamically to active providers based on configuration.

```
                  ┌──────────────────────────────┐
                  │    Playwright Test Specs     │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │         Page Objects         │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │         VisualHelper         │
                  │ (src/utilities/visual.helper)│
                  └──────┬────────────────┬──────┘
                         │                │
         ┌───────────────┴──┐          ┌──┴───────────────┐
         │                  │          │                  │
         ▼                  ▼          ▼                  ▼
 ┌───────────────┐  ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
 │  Applitools   │  │  Applitools   │ │    Percy     │ │    Percy     │
 │  Visual AI    │  │  SDK Adapter  │ │  CLI Agent   │ │  SDK Adapter │
 └───────────────┘  └───────────────┘ └──────────────┘ └──────────────┘
```

---

## ⚙️ Environment Configuration (`.env.dev`)

Configure your keys and preferences using these environment variables:

| Variable | Default / Example | Purpose |
| :--- | :--- | :--- |
| `VISUAL_PROVIDERS` | `percy,applitools` | Comma-separated active providers (`percy`, `applitools`, or `percy,applitools`). |
| `PERCY_TOKEN` | `web_***` | Authentication token for BrowserStack Percy dashboard. |
| `APPLITOOLS_API_KEY` | `k3S***` | Authentication token for Applitools Eyes dashboard. |
| `VISUAL_SETTLE_DELAY_MS` | `1000` | Delay (ms) before snapshot capture to allow page elements to fully settle. |
| `PERCY_ENABLED` | `true` | Globally enable/disable Percy snapshots (`true` or `false`). |

---

## 💻 Commands Reference

Run visual tests locally using the dedicated CLI script (`scripts/test-visual.js`):

| Goal | Terminal Command | Active Providers |
| :--- | :--- | :--- |
| **Run All Visual Tests** | `npm run test:visual` | Both Applitools & Percy |
| **Run Applitools Only** | `npm run test:visual:applitools` | Applitools Only |
| **Run Percy Only** | `npm run test:visual:percy` | Percy Only |
| **Run Login Visual Tests** | `npm run test:login:visual` | Both Applitools & Percy |
| **Run Login on Desktop Only** | `npm run test:login:visual:desktop` | Both Applitools & Percy |
| **Run Login on Percy Only**| `npm run test:login:visual:percy` | Percy Only |
| **Run Product Page (Both)** | `npm run test:product:visual` | Both Applitools & Percy |

---

## 🎨 Writing Code: Adding Visual Checkpoints

### 1. In Page Object (`src/page/login/login.page.ts`):
Expose checkpoint capture wrapped in loading state assertions:
```typescript
async captureVisualCheckpoint(tag: string, config?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
  await this.page.waitForLoadState('load').catch(() => undefined);
  await this.playwrightVerificationsFactory.waitForLoaderToDisappear().catch(() => undefined);
  if (this.visual) {
    await this.visual.captureCheckpoint(tag, config);
  }
}
```

### 2. In Test Spec (`src/specs/login/login-visual.spec.ts`):
Pass the figma config mapping defined in `figma.visual.data.ts`:
```typescript
import { LOGIN_INITIAL_FIGMA_CONFIGS } from '@data/visual/figma.visual.data';

test('Verify Login Page State', async ({ loginPage }) => {
  await loginPage.captureVisualCheckpoint('01 - Login Page Initial State', LOGIN_INITIAL_FIGMA_CONFIGS);
});
```

---

## 🤖 Applitools Eyes MCP Server (`applitools-mcp`)

Connect your AI assistants to Applitools Eyes using the Model Context Protocol (MCP) defined in `.agents/mcp_config.json`:

```json
{
  "mcpServers": {
    "applitools-mcp": {
      "command": "applitools-mcp"
    }
  }
}
```

### Key MCP Tools Reference
* **`eyes_verify_api_key`**: Validates credentials & cloud connectivity.
* **`eyes_setup_project`**: Configures local Playwright HTML test report integration.
* **`eyes_setup_ufg`**: Sets up multi-browser responsive viewport grids.
* **`eyes_get_batch_url`**: Returns direct dashboard link to triage visual differences.
