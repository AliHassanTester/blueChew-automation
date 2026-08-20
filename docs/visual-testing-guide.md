# Complete Visual Testing Guide: Applitools & Percy Integration

A comprehensive, non-technical step-by-step guide and technical reference for running visual regression and baseline testing in the BlueChew automation framework.

---

## 📖 Executive Summary & Quick Start (Non-Technical Guide)

This framework includes automated **Visual Regression Testing**. Visual testing automatically captures screenshots of your web pages during test execution and compares them against known baseline designs (such as Figma mockups or approved web pages).

Any team member (QA engineers, product managers, or non-technical stakeholders) can execute these tests locally by following the simple commands below.

### Quick Start Commands

To run visual tests, open your terminal in the repository root directory (`blueChew-automation`) and run:

| Goal | Terminal Command | What It Does |
| :--- | :--- | :--- |
| **Run BOTH Applitools & Percy (Default)** | `npm run test:visual` | Runs all visual tests against both Applitools Visual AI and Percy. |
| **Run ONLY Applitools** | `npm run test:visual:applitools` | Runs visual tests strictly using Applitools Eyes. |
| **Run ONLY Percy** | `npm run test:visual:percy` | Runs visual tests strictly using Percy. |
| **Run Product Page (Both)** | `npm run test:product:visual` | Runs product checkout visual tests against both tools. |
| **Run Single Product Test (e.g. Tadalafil)** | `npm run test:product:tadalafil:visual` | Runs visual baseline check for Tadalafil product flow. |
| **Run Single Product Test (e.g. Max)** | `npm run test:product:max:visual` | Runs visual baseline check for Max product flow. |

---

## 🛠 Framework Architecture & Technical Implementation

Visual testing in this repository uses a **unified multi-provider architecture**. Test specs and Page Objects do not contain hardcoded vendor logic; instead, they call a central `VisualHelper` abstraction that dispatches snapshots to active providers (`Applitools`, `Percy`, or both).

```
                      ┌──────────────────────────────┐
                      │    Playwright Test Specs     │
                      │ (product-checkout.spec.ts)   │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │         Page Objects         │
                      │ (ProductPage / CheckoutPage) │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │        VisualHelper          │
                      │ (src/utilities/visual.helper)│
                      └──────┬────────────────┬──────┘
                             │                │
             ┌───────────────┴──┐          ┌──┴───────────────┐
             │                  │          │                  │
             ▼                  ▼          ▼                  ▼
     ┌───────────────┐  ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
     │ Applitools    │  │  Applitools   │ │    Percy     │ │    Percy     │
     │  Utils        │  │  Visual AI    │ │    Utils     │ │    Builds    │
     │ (applitools)  │  │  Dashboard    │ │ (percy.utils)│ │ (Percy.io)   │
     └───────────────┘  └───────────────┘ └──────────────┘ └──────────────┘
```

### Component Breakdown & Responsibilities

| File / Component | Path | Role & Responsibility |
| :--- | :--- | :--- |
| **Visual Helper Class** | [`visual.helper.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/utilities/visual.helper.ts) | Central router for visual checkpoints. Evaluates `process.env.VISUAL_PROVIDERS` and invokes enabled providers. |
| **Applitools Utility** | [`applitools.utils.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/utilities/applitools.utils.ts) | Initializes Applitools Eyes, configures batch names, viewports, baseline environments, and posts checkpoints via `@applitools/eyes-playwright`. |
| **Percy Utility** | [`percy.utils.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/utilities/percy.utils.ts) | Performs lightweight health checks on port `5338`, scopes snapshot titles per browser project (`[chromium-desktop]`), and invokes `@percy/playwright`. |
| **Figma Visual Baselines** | [`figma.visual.data.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/data/visual/figma.visual.data.ts) | Centralized baseline configurations containing exact viewport dimensions, app names, frame titles, and displacement settings. |
| **Visual Fixtures** | [`page.fixtures.ts`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/fixtures/page.fixtures.ts) | Instantiates `VisualHelper` for each test context and injects it into Page Objects (`LoginPage`, `ProductPage`, `CheckoutPage`). |
| **Visual CLI Runner** | [`test-visual.js`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/scripts/test-visual.js) | Orchestrates CLI execution. Parses `--providers=`, loads environment secrets from `.env.dev`, and wraps command in `npx percy exec --` when Percy is active. |

---

## ⚙️ Environment & Configuration

Environment configurations are managed inside [`.env.dev`](file:///c:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/.env.dev).

### Environment Variables Key Reference

- `VISUAL_PROVIDERS`: Comma-separated list of active providers (`percy`, `applitools`, or `percy,applitools`). Default: `percy,applitools`.
- `APPLITOOLS_API_KEY`: API Key for authenticating with Applitools Eyes cloud dashboard.
- `PERCY_TOKEN`: API Token for authenticating with Percy (BrowserStack) dashboard.
- `PERCY_ENABLED`: Set to `true` or `false` to toggle Percy execution globally.
- `VISUAL_SETTLE_DELAY_MS`: Wait duration before capturing a DOM snapshot to ensure dynamic elements have settled.

---

## 📊 Detailed Comparison: Applitools vs. Percy

Below is a detailed analysis comparing **Applitools Eyes** and **Percy by BrowserStack** as implemented in this Playwright automation framework.

| Parameter / Feature | Applitools Eyes | Percy (BrowserStack) | Winner / Recommendation |
| :--- | :--- | :--- | :--- |
| **Visual Diff Algorithm** | **Visual AI** (simulates human vision; ignores anti-aliasing & minor rendering noise). | **DOM Snapshot + Pixel Diff** (with AI review agent assistance). | 🏆 **Applitools** (Far lower false-positive rate). |
| **Figma Baseline Integration** | **Native Baseline Matching** (Matches custom viewport, displacement, app & test names). | **DOM Comparison** (Matches previous web build snapshots). | 🏆 **Applitools** (Direct alignment with Figma design system). |
| **Execution Speed (Playwright)** | **Faster** per check when using cloud Ultrafast Grid; synchronous API open/check/close per test. | **Slower** in multi-project parallel runs due to serial asset uploading & CLI wrapper overhead. | 🏆 **Applitools** |
| **CLI / Wrapper Complexity** | No CLI wrapper required; connects via standard Node.js SDK API calls. | Requires `npx percy exec --` process wrapper to run local proxy server on port 5338. | 🏆 **Applitools** (Simpler setup). |
| **Developer Experience & UI** | Enterprise dashboard with branch comparison, region masking, and displacement rules. | Clean, modern dashboard with GitHub PR comments and BrowserStack integration. | 🤝 **Tie** (Both offer excellent dashboards). |
| **Cost & Licensing** | Enterprise pricing (higher cost per visual check). | Generous tiering and affordable pricing (ideal for startups/mid-market). | 🏆 **Percy** (More cost-effective). |

### Conclusion & Framework Recommendation

For **BlueChew's E-Commerce & Intake Automation Framework**:
1. **Applitools** is the **Primary Recommended Tool** for design baseline validation because of its Visual AI accuracy, explicit Figma frame matching, and zero-false-positive rendering.
2. **Percy** is an excellent **Secondary Regression Shield**, ideal for quick DOM layout sanity checks in CI/CD pipelines.

---

## 🚀 How Non-Technical Team Members Can Execute Visual Tests

Follow these step-by-step instructions:

1. **Open Terminal or Command Prompt**:
   Navigate to your project root folder:
   ```bash
   cd c:\Users\BrainNotFound\Documents\GitHub\blueChew-automation
   ```

2. **Verify Credentials**:
   Ensure `.env.dev` has `APPLITOOLS_API_KEY` and `PERCY_TOKEN` populated.

3. **Run Desired Command**:
   - To test **Applitools Only**: `npm run test:visual:applitools`
   - To test **Percy Only**: `npm run test:visual:percy`
   - To test **Both Tools**: `npm run test:visual`

4. **Review Results**:
   - **Applitools Results**: Check console output for Eyes session links or log into [Applitools Eyes Dashboard](https://eyes.applitools.com).
   - **Percy Results**: Click the Percy build URL printed at the end of the run (e.g., `https://percy.io/.../builds/...`).
