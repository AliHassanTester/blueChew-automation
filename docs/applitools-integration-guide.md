# Applitools Integration Guide

Quick reference for Applitools Eyes implementation in the BlueChew Automation Framework.

---

## Architecture & Responsibilities

| Directory / File | Role |
| :--- | :--- |
| `src/interfaces/applitools.interface.ts` | Defines `ApplitoolsVisualConfig` contract. |
| `@data/login/login.data.ts` | Defines and exports test baseline configs (`LOGIN_DESKTOP_FIGMA_CONFIG`, `LOGIN_MOBILE_FIGMA_CONFIG`). |
| `@data/product/product-max.data.ts` | Defines and exports product baseline configs (`PRODUCT_MAX_FIGMA_CONFIG`). |
| `src/utilities/applitools.utils.ts` | Pure execution engine for Eyes lifecycle, viewport handling, and snapshot uploading. |
| Page Objects (`login.page.ts`, `product.page.ts`) | Encapsulate DOM readiness (`waitForLoadState('load')`) and invoke visual checkpoints. |
| Specs (`login.spec.ts`, `product-max.spec.ts`) | Declarative test steps passing scenario configs to page objects. |

---

## Configuration Schema (`ApplitoolsVisualConfig`)

```typescript
export interface ApplitoolsVisualConfig {
  appName: string;             // Figma App Name
  testName: string;            // Figma Frame Name
  viewport: { width: number; height: number };
  baselineEnvName?: string;    // Baseline Environment Tag
  ignoreDisplacements?: boolean;
}
```

---

## Usage Example

### 1. Data File (`src/data/product/product-max.data.ts`)
```typescript
export const PRODUCT_MAX_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Login Default',
  testName: 'Desktop - 9',
  viewport: { width: 1440, height: 915 },
  baselineEnvName: 'Desktop - 9_1440',
  ignoreDisplacements: true,
};
```

### 2. Spec File (`src/specs/product/product-max.spec.ts`)
```typescript
const scenario = getProductMaxData('PRODUCT-MAX');

await test.step('Open Product Max and capture a visual baseline', async () => {
  await productPage.navigateToProductMax(scenario.url);
  await productPage.captureProductMaxSnapshot(scenario.visualConfig);
});
```

---

## Commands

```bash
# Run all Applitools visual tests
npm run visual:applitools
```
