# Applitools Integration Guide

Quick reference for Applitools Eyes implementation in the BlueChew Automation Framework.

---

## Architecture & Responsibilities

| Directory / File | Role |
| :--- | :--- |
| `src/interfaces/applitools.interface.ts` | Defines `ApplitoolsVisualConfig` contract. |
| `@data/login/login.data.ts` | Defines and exports login baseline configs (`LOGIN_DESKTOP_FIGMA_CONFIG`, `LOGIN_MOBILE_FIGMA_CONFIG`). |
| `@data/product/product-checkout.data.ts` | Unified test data source & Applitools configs (`Sildenafil`, `Tadalafil`, `Max`). |
| `src/utilities/applitools.utils.ts` | Pure execution engine for Eyes lifecycle, viewport handling, and snapshot uploading. |
| Page Objects (`login.page.ts`, `product.page.ts`) | Encapsulate DOM readiness (`waitForLoadState('load')`) and invoke visual checkpoints. |
| Specs (`login.spec.ts`, `product-checkout.spec.ts`) | Declarative data-driven test specs passing scenario configs to page objects. |

---

## Configuration Schema (`ApplitoolsVisualConfig`)

```typescript
export interface ApplitoolsVisualConfig {
  appName: string;             // Figma App Name
  testName: string;            // Figma Frame Name
  viewport: { width: number; height: number };
  baselineEnvName?: string;    // Baseline Environment Tag
  ignoreDisplacement?: boolean;
  ignoreDisplacements?: boolean;
}
```

---

## Usage Example

### 1. Unified Data File (`src/data/product/product-checkout.data.ts`)
```typescript
export const PRODUCT_TADALAFIL_FIGMA_CONFIG: ApplitoolsVisualConfig = {
  appName: 'Tadalafil Default',
  testName: 'Tadalafil - Desktop',
  viewport: { width: 1440, height: 915 },
  baselineEnvName: 'Tadalafil_1440',
  ignoreDisplacements: true,
};
```

### 2. Unified Spec File (`src/specs/product/product-checkout.spec.ts`)
```typescript
const scenarios = getAllProductCheckoutScenarios();

for (const scenario of scenarios) {
  test(`Product Checkout Flow - ${scenario.productName}`, async ({ productPage }) => {
    await productPage.navigateToProductPage(scenario.url, scenario.productName);
    await productPage.captureProductSnapshot(scenario.visualConfig, `${scenario.productName} page loaded`);
    await productPage.selectPlanAndProceed();
  });
}
```

---

## Commands

```bash
# Run all Applitools visual tests
npm run visual:applitools

# Run product checkout spec
npm run test:product
```
