# Visual Testing Integration Summary

## Executive Summary

Today, the BlueChew automation framework was extended with a provider-agnostic visual testing integration that supports Percy, Applitools, and UIProbe.

The goal was to preserve the existing Page Object Model architecture while enabling the same visual checkpoint API to execute against one or more configured providers without requiring test-level changes.

## What Was Implemented

### 1. Provider Abstraction
- Added a single interface `IVisualProvider` to define provider behavior.
- Implemented isolated adapters for each provider:
  - `PercyProvider`
  - `ApplitoolsProvider`
  - `UIProbeProvider` (stubbed placeholder pending SDK details)
- Each adapter is responsible only for translating the generic visual checkpoint API into provider-specific SDK calls.

### 2. Provider-Agnostic Visual Helper
- Refactored `src/utilities/visual.helper.ts` to become the framework-level visual testing abstraction.
- The public page/page-object API remained unchanged: `VisualHelper.captureCheckpoint(name, options)`.
- The helper now delegates snapshot calls to one or more configured visual providers.
- Shared concerns such as naming, configuration, lifecycle, logging, and error handling were centralized in the helper.

### 3. Configuration-Driven Provider Selection
- Introduced `VISUAL_PROVIDERS` environment variable to control which provider(s) are active.
- Added CLI support for provider selection via `--providers=percy,applitools` in `scripts/test-visual.js`.
- Added npm scripts for common selections:
  - `npm run test:visual`
  - `npm run test:visual:login`
  - `npm run visual:applitools`
  - `npm run visual:all`
- Default provider remains Percy for backward compatibility.

### 4. Lifecycle and Cleanup Support
- Updated the `visual` fixture in `src/fixtures/page.fixtures.ts` to ensure `VisualHelper.close()` is called after test execution.
- This enables provider-specific cleanup and finalization behavior.

### 5. Applitools Integration
- Added Applitools support via a lazy-loaded adapter in `src/utilities/visual.providers/applitools.provider.ts`.
- Implemented VisualGrid runner, Eyes session opening, and snapshot logic.
- Added Applitools package dependency in `package.json`.
- Documented required environment variables and configuration.

### 6. Percy Integration
- Preserved existing Percy behavior and encapsulated it in a provider adapter.
- The Percy adapter continues to use `@percy/playwright`.
- The runner now only uses `percy exec` when Percy is part of the configured provider set.

### 7. UIProbe Support
- Added a UIProbe provider stub in `src/utilities/visual.providers/uiprobe.provider.ts`.
- The stub is intentionally isolated and ready for a real SDK implementation once the UIProbe integration details are known.

### 8. Documentation
- Added `docs/visual-integration.md` to explain the new multi-provider visual integration.
- Added a summary of the implementation changes and configuration guidance.

## Architecture and Design Benefits

- **Minimal test-level changes:** Existing test cases continue using the same `VisualHelper.captureCheckpoint(...)` API.
- **Provider isolation:** Each provider implementation is isolated in its own module and does not leak SDK-specific details into the test suite.
- **Extensible design:** Adding another provider only requires implementing a new `IVisualProvider` adapter and registering it in `VisualHelper`.
- **Centralized concerns:** Configuration, naming, provider lifecycle, and error handling are handled in one place.
- **Backward compatibility:** The previous Percy flow remains supported, with new provider selection layered on top.

## Notes and Next Steps

- Applitools now works but requires installing `@applitools/eyes-playwright` and configuring API credentials.
- UIProbe integration remains a placeholder until the SDK or API contract is available.
- The framework is ready to run against one provider or multiple providers in the same execution.
- If desired, the runner can be further tuned to support additional provider-specific CLI or environment options.

## Implementation Locations

- `src/utilities/visual.helper.ts`
- `src/utilities/visual.providers/visual.provider.interface.ts`
- `src/utilities/visual.providers/percy.provider.ts`
- `src/utilities/visual.providers/applitools.provider.ts`
- `src/utilities/visual.providers/uiprobe.provider.ts`
- `src/fixtures/page.fixtures.ts`
- `scripts/test-visual.js`
- `package.json`
- `docs/visual-integration.md`

## Conclusion

The visual testing integration was implemented in a way that preserves the existing architecture, keeps provider logic isolated, and enables flexible configuration-driven execution across Percy, Applitools, and UIProbe.

The solution is intentionally extensible and designed for minimal future disruption as additional providers are added.
