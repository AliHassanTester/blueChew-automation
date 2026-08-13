# Applitools Integration Guide

Quick reference for Applitools Eyes implementation in the BlueChew Automation Framework.

---

## Architecture & Responsibilities

| Directory / File | Role |
| :--- | :--- |
| `src/interfaces/applitools.interface.ts` | Defines `ApplitoolsVisualConfig` contract. |
| `src/data/visual/figma.visual.data.ts` | **Centralized source of truth** for all Figma baseline visual configurations (`Login Desktop/Mobile`, `Sildenafil`, `Tadalafil`, `Max`). |
| `@data/login/login.data.ts` | Login test data provider (re-exports Figma configs from `figma.visual.data`). |
| `@data/product/product-checkout.data.ts` | Unified product checkout test data provider (re-exports Figma configs from `figma.visual.data`). |
| `src/utilities/applitools.utils.ts` | Pure execution engine for Eyes lifecycle, viewport handling, and snapshot uploading. |
| Page Objects (`login.page.ts`, `product.page.ts`) | Encapsulate DOM readiness (`waitForLoadState('load')`) and invoke visual checkpoints. |
| Specs (`login.spec.ts`, `product-checkout.spec.ts`) | Declarative test specs passing scenario configs to page objects. |

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

## Centralized Configurations (`src/data/visual/figma.visual.data.ts`)

```typescript
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

export const LOGIN_DESKTOP_FIGMA_CONFIG: ApplitoolsVisualConfig = { ... };
export const LOGIN_MOBILE_FIGMA_CONFIG: ApplitoolsVisualConfig = { ... };

export const PRODUCT_SILDENAFIL_FIGMA_CONFIG: ApplitoolsVisualConfig = { ... };
export const PRODUCT_TADALAFIL_FIGMA_CONFIG: ApplitoolsVisualConfig = { ... };
export const PRODUCT_MAX_FIGMA_CONFIG: ApplitoolsVisualConfig = { ... };
```

---

## Commands

```bash
# Run all Applitools visual tests
npm run visual:applitools

# Run product checkout visual tests
npm run test:product
```
