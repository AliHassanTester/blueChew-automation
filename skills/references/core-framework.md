# Core Framework Reference

## Framework overview

| Concern | Technology |
|---|---|
| Test runner | Playwright Test (`@playwright/test`) |
| Language | TypeScript strict mode, CommonJS output |
| Architecture | Page Object Model with `BasePage` abstract class |
| Reporting | Allure, Playwright HTML, JUnit XML |
| Environments | `dev`, `prod`, `ci`, `demo`, selected via `ENV_TYPE` |
| Browser | Chromium only, 1920x1080, headed locally, headless on CI |

## Path aliases

Always use these aliases in imports. Never use relative `../../` paths across layer boundaries.

| Alias | Resolves to |
|---|---|
| `@page/*` | `src/page/*` |
| `@fixtures/page.fixtures` | `src/fixtures/page.fixtures.ts` |
| `@fixtures/*` | `src/fixtures/*` |
| `@utilities/*` | `src/utilities/*` |
| `@data/*` | `src/data/*` |
| `@interfaces/*` | `src/interfaces/*` |
| `@config/*` | `src/config/*` |
| `@enums/*` | `src/enums/*` |

## Priority-based folder structure

The framework organises all files by **priority tier** then **module**. Every layer (data, page, specs) mirrors the same folder hierarchy.

```text
src/
├── interfaces/
│   └── <featureName>.interface.ts          # no sub-folders
├── data/
│   ├── critical/<module>/<featureName>.data.ts
│   ├── standard/<module>/<featureName>.data.ts
│   └── low/<module>/<featureName>.data.ts
├── page/
│   ├── critical/<module>/<featureName>.page.ts
│   ├── standard/<module>/<featureName>.page.ts
│   └── low/<module>/<featureName>.page.ts
├── fixtures/
│   ├── page.fixtures.ts                    # shared — register all Page Objects here
│   └── session.fixtures.ts                 # session / auth helpers — do not modify unless needed
└── specs/
    ├── critical/<module>/<featureName>.spec.ts
    ├── standard/<module>/<featureName>.spec.ts
    └── low/<module>/<featureName>.spec.ts
```

### Priority tiers

| Tier | Folder | When to use |
|---|---|---|
| `critical` | `critical/` | Payment flows, checkout processing, data-destructive actions |
| `standard` | `standard/` | Core user journeys: auth, navigation, checkout flows |
| `low` | `low/` | Content, marketing, informational pages |

### Current modules (examples)

| Module | Path segment | Typical contents |
|---|---|---|
| Auth | `auth/` | Login, registration, session management |
| Core Flows | `coreFlows/` | Primary user journeys |
| Checkout | `checkout/` | Purchase flows, cart, payment |
| Navigation | `navigation/` | Redirects, menus, routing |
| Content | `content/` | Informational and marketing pages |

New modules follow the same pattern. Choose the tier that matches test criticality.

## Layer responsibilities

### Interface layer

Location: `src/interfaces/<featureName>.interface.ts` (flat — no sub-folders).

Purpose:
- Define the shape of page-specific data passed into the Page Object.
- Keep the interface minimal.
- Include only fields the page actually consumes.

### Data layer

Location: `src/data/<priority>/<module>/<featureName>.data.ts`

Purpose:
- Store test datasets keyed by Jira-style or descriptive test case ID.
- Include `testCaseData`.
- Include `loginDetails` when login is required.
- Include the page-specific interface block.

Rules:
- Always read credentials from `process.env` or `getEnvVariable`.
- Never hardcode credentials.
- The lookup key must match the `testCase` field.
- Tags follow the format `@<priority> @<module> @regression @smoke`.

### Page Object layer

Location: `src/page/<priority>/<module>/<featureName>.page.ts`

Purpose:
- Extend `BasePage` (never instantiate factories directly — `BasePage` provides them).
- Own all `LocatorInfo` typed locators.
- Own all interaction methods for a single feature area.
- Never import test data.
- Accept data through public method parameters.

```typescript
import { BasePage } from '@page/base.page';  // or relative ../../base.page
export class MyFeaturePage extends BasePage { ... }
```

`BasePage` provides:
- `this.page` — Playwright `Page`
- `this.testInfo` — `TestInfo`
- `this.playwrightActionsFactory` — `PlaywrightActionFactory`
- `this.playwrightVerificationsFactory` — `PlaywrightVerificationFactory`
- Any shared helpers defined in `BasePage` for this project

Do not re-instantiate these in subclass constructors.

### Fixture layer

Location: `src/fixtures/page.fixtures.ts` (shared — one file for all Page Objects).

Purpose:
- Register every new Page Object class.
- Add import.
- Add property to `TestFixtures` type.
- Add fixture factory in `test.extend`.

The fixture file also provides session-aware page variants appropriate to this project's auth model (e.g. guest, default session, payment session). Use the fixture that matches the required auth state for each test. For tests that start unauthenticated, use the designated guest fixture rather than a session-authenticated one.

### Spec layer

Location: `src/specs/<priority>/<module>/<featureName>.spec.ts`

Purpose:
- Thin orchestration only.
- Retrieve data.
- Log metadata.
- Delegate actions to Page Objects.
- No locators.
- No raw assertions.

Rules:
- Import `test` from `@fixtures/page.fixtures`, not from `@playwright/test`.
- Call `logTestCaseData(test.info(), scenario.testCaseData)` as the first line of every test body.
- Wrap each logical group of actions in a named `test.step`.
- Test title must include `testCase`, `testDescription`, and `tags`.

## Naming conventions

| Type | Convention | Example |
|---|---|---|
| Page file | `featureName.page.ts` | `upgradePlan&IMEIFlow.page.ts` |
| Spec file | `featureName.spec.ts` | `upgradePlan&IMEIFlow.spec.ts` |
| Data file | `featureName.data.ts` | `upgradePlan&IMEIFlow.data.ts` |
| Interface file | `featureName.interface.ts` | `upgradePlan&IMEIFlow.interface.ts` |
| Page class | PascalCase + Page | `UpgradePlanIMEIFlowPage` |
| Locator key | camelCase | `upgradePlanButton` |
| Page method | verbNoun | `planUpgradeEssentialsToPlus()` |
| Test tag | `@camelCase` | `@standard @myModule @regression @smoke` |
| Test case key | `{PREFIX}-{number}-Kebab-Description` | `TC-91-Upgrade-Plan-IMEI-Flow` |

## Running tests

```bash
npm run test:demo
npm run test:prod
npm run test:critical
npm run test:standard
npm run test:low
npx playwright test src/specs/standard/checkout/myFeature.spec.ts
npx playwright test --grep="TC-91"
npx playwright test --grep="@smoke"
npm run allure:generate
npm run allure:open
```
