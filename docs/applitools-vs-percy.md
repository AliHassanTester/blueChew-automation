# Applitools Eyes vs. Percy by BrowserStack

A professional evaluation comparing the capabilities, diff engines, and framework integrations of Applitools and Percy in the BlueChew automation framework.

---

## 📊 Quick Comparison Matrix

| Capability / Feature | Applitools Eyes | Percy (BrowserStack) |
| :--- | :--- | :--- |
| **Visual Diff Engine** | **Visual AI** (Simulates human eye; ignores anti-aliasing noise, dynamic displacements). | **DOM Snapshot + Pixel Diff** (Traditional pixel-by-pixel overlays with review assist). |
| **Figma Integration** | **Native Baseline Matching** (Matches custom viewport, app, and test names directly). | **DOM Web Comparison** (Matches snapshots to previous web builds or imported designs). |
| **Execution Model** | SDK API calls inside test processes (Zero CLI wrappers required). | CLI wrapper proxy (`npx percy exec`) running on port `5338`. |
| **Cross-Browser Scaling** | Ultrafast Grid renders DOM in cloud browsers in parallel. | Percy cloud rendering renders DOM in multiple viewports/browsers. |
| **Target Audience** | Enterprise teams requiring high visual fidelity and zero false-positives. | Agile teams seeking affordable regression checks integrated into CI/CD. |

---

## 🧠 Diff Algorithms: Visual AI vs. Pixel Differences

### Applitools (Visual AI)
* **How it works**: Uses artificial intelligence to read the page layout like a human. It recognizes logical sections, paragraphs, and buttons.
* **Benefit**: Highly stable. It ignores anti-aliasing errors, minor font rendering noise, and structural displacements (e.g., if a page content shifts down by 2px because of an alert, it recognizes it as a displacement rather than a giant red error).
* **Usage**: Ideal for validating designs against Figma mockups.

### Percy (DOM Snapshot + Pixel Diff)
* **How it works**: Captures the DOM state (HTML, CSS, assets) at test runtime, uploads it, and performs a pixel-by-pixel rendering comparison in the cloud.
* **Benefit**: Fast layout regression verification. If a single pixel changes color, it highlights it.
* **Usage**: Great as a regression shield in pull requests (PRs) to ensure nothing shifted unexpectedly.

---

## ⚙️ Resolutions & Viewports Handling in BlueChew

In our framework, the Figma mockups are configured at:
* **Desktop**: `1440` width
* **Mobile**: `390` width

### How Both Tools Match Viewports:
* **Applitools**: Resolves the exact config viewport width dynamically via [`resolveVisualConfigForPage`](file:///C:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/src/utilities/applitools.utils.ts) and binds it directly to the Figma baseline in Applitools.
* **Percy**: The runner ([`scripts/test-visual.js`](file:///C:/Users/BrainNotFound/Documents/GitHub/blueChew-automation/scripts/test-visual.js)) runs desktop and mobile projects sequentially. It dynamically resolves the viewport width (either `1440` or `390`) and overrides Percy's defaults so that they render in matching separate builds on the Percy dashboard.

---

## 💡 Summary Recommendations

1. **Applitools Eyes (Primary Design Checker)**: Use for precise design system validation, verifying Figma mocks, and zero-false-positive checks on content layout.
2. **Percy (PR Regression Shield)**: Use as a fast, cost-effective CI/CD pipeline blocker to prevent layout shifting on Pull Requests before code merges.
