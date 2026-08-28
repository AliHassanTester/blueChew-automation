# Percy Visual Testing Restoration Guide

This document provides instructions on how to restore BrowserStack Percy integration into the test suite if it is needed in the future.

---

## 1. Environment Variables & Credentials
Add the following keys to your local `.env` and `.env.dev` files:
```bash
# Comma-separated list of active visual testing runners
VISUAL_PROVIDERS=percy,applitools

# Percy authorization token from the BrowserStack/Percy dashboard
PERCY_TOKEN=web_your_auth_token_here

# Percy asset discovery optimization variables
PERCY_DO_NOT_CAPTURE_RESPONSE_ASSETS=true
```

---

## 2. Re-create the Percy Utility Wrapper
Create a file at `src/utilities/percy.utils.ts` with the following content:
```typescript
import { Page, TestInfo } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import { resolveVisualConfigForPage } from './applitools.utils';
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

/**
 * Checks if the local Percy CLI agent is running.
 */
async function isPercyAgentRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:5338/percy/health');
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Captures a visual snapshot using BrowserStack Percy CLI.
 */
export async function capturePercyVisualCheckpoint(
  page: Page,
  name: string,
  testInfo: TestInfo,
  visualConfigs?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[],
): Promise<void> {
  const isRunning = await isPercyAgentRunning();
  if (!isRunning) {
    console.log(`[Percy] Percy CLI agent not active on port 5338. Skipping: "${name}"`);
    return;
  }

  const project = testInfo.project.name || 'chromium-desktop';
  const prefix = `[${project}]`;
  const fullName = `${prefix} ${name}`;

  const mainConfig = resolveVisualConfigForPage(page, visualConfigs);
  const width = mainConfig?.viewport.width || (project.includes('mobile') ? 390 : 1440);

  try {
    console.log(`[Percy] Capturing snapshot "${fullName}" with width ${width}...`);
    await percySnapshot(page, fullName, { widths: [width] });
    console.log(`[Percy] Snapshot captured successfully for "${fullName}".`);
  } catch (error) {
    console.error(`[Percy] Error capturing snapshot "${fullName}":`, error);
  }
}
```

---

## 3. Update VisualHelper Abstraction
In `src/utilities/visual.helper.ts`, restore the import and route checkpoints to Percy:
```typescript
import { Page, TestInfo } from '@playwright/test';
import { captureApplitoolsVisualCheckpoint, closeActiveEyes } from './applitools.utils';
import { capturePercyVisualCheckpoint } from './percy.utils'; // <-- Restore
import { ApplitoolsVisualConfig } from '@interfaces/applitools.interface';

export class VisualHelper {
  constructor(private readonly page: Page, private readonly testInfo: TestInfo) {} // <-- Restore testInfo

  async captureCheckpoint(name: string, config?: ApplitoolsVisualConfig | ApplitoolsVisualConfig[]): Promise<void> {
    const providers = (process.env.VISUAL_PROVIDERS || 'percy,applitools').toLowerCase().split(',').map((s) => s.trim());
    if (providers.includes('applitools')) await captureApplitoolsVisualCheckpoint(this.page, config, name);
    if (providers.includes('percy')) await capturePercyVisualCheckpoint(this.page, name, this.testInfo, config); // <-- Restore
  }
  
  // ... rest of file
}
```
*Note: Make sure to restore `base.info()` as the second parameter when instantiating `VisualHelper` in `src/fixtures/page.fixtures.ts`.*

---

## 4. Re-configure the Test Runner script
In `scripts/test-visual.js`, update the execution block to split desktop and mobile test projects into sequential `npx percy exec` commands if Percy is active:
```javascript
const wantsPercy = providers.includes('percy');
if (wantsPercy) {
  if (!argsToPass.includes('--project')) {
    const runProject = (project) => {
      return new Promise((resolve) => {
        const splitCmd = `npx percy exec -- npx playwright test --project=${project} ${argsToPass}`.trim();
        console.log(`[visual-runner] Executing Percy build for project ${project}:`, splitCmd);
        const child = spawn(splitCmd, { shell: true, stdio: 'inherit', env: process.env });
        child.on('exit', (code) => resolve(code || 0));
      });
    };

    (async () => {
      console.log('[visual-runner] Splitting execution into separate Percy builds.');
      const codeDesktop = await runProject('chromium-desktop');
      const codeMobile = await runProject('chromium-mobile');
      process.exit(codeDesktop || codeMobile);
    })();
    return;
  }
}
```

---

## 5. Add CLI Commands to package.json
Re-add the following shortcut commands under the `scripts` object in `package.json`:
```json
"test:visual:percy": "node ./scripts/test-visual.js --providers=percy",
"test:product:visual:percy": "node ./scripts/test-visual.js --providers=percy src/specs/product/product-checkout.spec.ts",
"test:login:visual:percy": "node ./scripts/test-visual.js src/specs/login/login-visual.spec.ts --providers=percy"
```
