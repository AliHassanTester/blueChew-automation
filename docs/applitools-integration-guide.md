# Applitools Integration & Implementation Guide

This document outlines the technical implementation, configuration schema, component responsibilities, and effective usage patterns for Applitools Eyes within the BlueChew Automation Framework.

---

## 1. Architecture & Component Breakdown

The Applitools integration follows a centralized architecture designed to keep spec files declarative and decouple test logic from SDK boilerplate.

```
src/
├── utilities/
│   ├── applitools.utils.ts        <-- Core Applitools Engine & Baseline Configurations
│   └── visual.helper.ts           <-- Lightweight Page Object Visual Helper Wrapper
├── page/
│   └── product/
│       └── product.page.ts        <-- Page Object encapsulation of visual snapshots
└── specs/
    ├── login/
    │   └── login.spec.ts          <-- Dual-viewport (Desktop & Mobile) visual spec
    └── product/
        └── product-max.spec.ts    <-- Single-page baseline spec
```

### Component Responsibilities

| File / Component | Role & Functionality |
| :--- | :--- |
| `src/utilities/applitools.utils.ts` | **Central Engine**: Manages `ClassicRunner`, `Eyes`, `Configuration`, viewport resizing, API key validation, and Eyes session lifecycle (`eyes.open`, `eyes.check`, `eyes.close`, `abortIfNotClosed`). Stores all Figma baseline configuration presets. |
| `src/utilities/visual.helper.ts` | **Helper Gateway**: Provides a simplified `VisualHelper` interface injected into Page Objects via Playwright fixtures. Auto-routes snapshot requests to `applitools.utils.ts`. |
| Page Objects (`product.page.ts`, etc.) | **Domain Wrapper**: Exposes clean methods (e.g. `captureProductMaxSnapshot()`) that handle page load state (`load`) before calling visual capture utilities. |
| Spec Files (`login.spec.ts`, `product-max.spec.ts`) | **Test Declarations**: Triggers visual assertions seamlessly in test steps without instantiating Eyes SDK objects directly. |

---

## 2. Environment & Credential Configuration

Applitools requires a valid API key configured in the environment file for the target environment (e.g., `.env.dev`, `.env.prod`).

### Required Environment Variables

```ini
# .env.dev or process.env
APPLITOOLS_API_KEY=your_applitools_api_key_here
# Optional fallback alias checked by utility:
APPLI_API_KEY=your_applitools_api_key_here
```

> **Safety Behavior**: If `APPLITOOLS_API_KEY` is not present in the environment, `captureApplitoolsVisualCheckpoint()` logs a warning (`[Applitools] APPLITOOLS_API_KEY is not configured...`) and skips snapshot uploading gracefully without failing functional test execution.

---

## 3. Figma Baseline Presets & Configuration Schema

All baseline configurations match BlueChew's Figma design specs. They are defined and exported as immutable constants from `src/utilities/applitools.utils.ts`.

### Configuration Interface (`ApplitoolsVisualConfig`)

```typescript
export interface ApplitoolsVisualConfig {
  appName: string;                  // Applitools App Name (Matches Figma File)
  testName: string;                 // Test / Frame Name (Matches Figma Frame)
  viewport: {
    width: number;
    height: number;
  };
  baselineEnvName?: string;         // Baseline Environment Tag (e.g. Desktop - 9_1440)
  ignoreDisplacement?: boolean;     // Ignore minor positional displacements
  ignoreDisplacements?: boolean;    // Alias for compatibility
}
```

### Active Presets

#### 1. Login Desktop Config (`LOGIN_DESKTOP_FIGMA_CONFIG`)
```typescript
export const LOGIN_DESKTOP_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Log in/Default',
  viewport: { width: 1440, height: 915 },
  baselineEnvName: 'Log in/Default_1440',
  ignoreDisplacement: true,
};
```

#### 2. Login Mobile Config (`LOGIN_MOBILE_FIGMA_CONFIG`)
```typescript
export const LOGIN_MOBILE_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Log in/Default',
  viewport: { width: 390, height: 844 },
  baselineEnvName: 'Log in/Default_390',
  ignoreDisplacement: true,
};
```

#### 3. Product Max Config (`PRODUCT_MAX_FIGMA_CONFIG`)
```typescript
export const PRODUCT_MAX_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 9',
  viewport: { width: 1440, height: 915 },
  baselineEnvName: 'Desktop - 9_1440',
  ignoreDisplacement: true,
};
```

---

## 4. Usage Patterns & Code Examples

### Pattern 1: Capture via Page Object (Recommended)

Encapsulate DOM stability waits using standard `load` state inside the relevant Page Object method:

```typescript
// Inside src/page/product/product.page.ts
async captureProductMaxSnapshot(): Promise<void> {
  await test.step('Capture the fully loaded product max page state', async () => {
    await this.page.waitForLoadState('load').catch(() => undefined);
    await this.verify.expectElementExist(this.locators.pageContainer);
    await captureApplitoolsVisualCheckpoint(this.page, PRODUCT_MAX_FIGMA_CONFIG, 'Product Max page loaded');
  });
}

// Inside src/specs/product/product-max.spec.ts
await test.step('Open Product Max and capture a visual baseline', async () => {
  await productPage.navigateToProductMax(scenario.url);
  await productPage.captureProductMaxSnapshot();
});
```

### Pattern 2: Direct Spec Invocation (Single or Multi-Viewport)

Invoke `captureApplitoolsVisualCheckpoint()` directly in spec test steps when testing multiple viewports in a single pass:

```typescript
// Inside src/specs/login/login.spec.ts
import {
  captureApplitoolsVisualCheckpoint,
  LOGIN_DESKTOP_FIGMA_CONFIG,
  LOGIN_MOBILE_FIGMA_CONFIG,
} from '@utilities/applitools.utils';

await test.step('Navigate to BlueChew login page and capture desktop + mobile baselines', async () => {
  await loginPage.navigateToPage(scenario.loginPageDetails);
  
  // Runs Desktop (1440x915) and Mobile (390x844) sequentially & restores original viewport
  await captureApplitoolsVisualCheckpoint(page, [LOGIN_DESKTOP_FIGMA_CONFIG, LOGIN_MOBILE_FIGMA_CONFIG]);
});
```

---

## 5. Execution Commands & CLI Workflow

You can execute Applitools visual tests using npm scripts defined in `package.json`:

```bash
# Run all visual tests with Applitools provider enabled
npm run visual:applitools

# Run specifically the Applitools runner script
npm run test:applitools

# Run login spec specifically with Applitools
npx playwright test src/specs/login/login.spec.ts
```

### How the Runner Wrapper Works (`scripts/run-applitools.js`)
When executing `npm run visual:applitools`, the script:
1. Sets `process.env.VISUAL_PROVIDERS = 'applitools'`.
2. Sets `process.env.ENV_TYPE = 'dev'` (if not specified).
3. Spawns Playwright CLI with `--project=chromium-desktop`.

---

## 6. Framework Best Practices

1. **Standard Page Load State**:
   Framework guidelines strictly enforce using standard `load` state instead of `networkidle` or arbitrary hardcoded timeout values:
   ```typescript
   await page.waitForLoadState('load');
   ```

2. **Define Presets in `applitools.utils.ts`**:
   Never hardcode `width`, `height`, `appName`, or `testName` inside spec files. Always export a named config object from `applitools.utils.ts`.

3. **Viewport State Safety**:
   `captureApplitoolsVisualCheckpoint()` automatically saves `initialViewport = page.viewportSize()` before changing resolutions and restores it post-check so subsequent functional assertions are unaffected.
