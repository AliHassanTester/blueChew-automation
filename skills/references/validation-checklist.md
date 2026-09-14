# Validation Checklist

Use this checklist before returning generated or edited automation code.

## Folder placement

- New Page Object file lives in `src/page/<priority>/<module>/` — not in a flat `page/` or a `login/` folder.
- New spec file lives in `src/specs/<priority>/<module>/`.
- New data file lives in `src/data/<priority>/<module>/`.
- New interface file lives in `src/interfaces/` (flat — no sub-folders).
- Priority tier matches the test's criticality (`critical` / `standard` / `low`).

## Page Object

- Page Object class extends `BasePage` (not a standalone class).
- `super(page, testInfo)` is called in the constructor.
- Factories are NOT re-instantiated in the subclass constructor (`BasePage` provides them).
- Every locator is typed as `LocatorInfo` with a human-readable `description`.
- XPath selectors are preferred.
- CSS is used only when XPath is genuinely not viable or stable attributes exist.
- No auto-generated IDs, hashed classes, or deep positional CSS chains are used.
- All actions use `this.playwrightActionsFactory` methods.
- All verifications use `this.playwrightVerificationsFactory` methods.
- No raw Playwright API calls appear in Page Objects unless no factory method exists.
- No test data is imported into Page Objects.
- Data flows from spec into Page Object methods via parameters.

## Data

- No hardcoded credentials or URLs are used.
- Environment-specific values come from `getEnvVariable` or `process.env`.
- Tags include priority and module: `@<priority> @<module> @regression @smoke`.
- Data lookup key exactly matches the `testCase` field value.

## Fixture

- Page Object is registered in `src/fixtures/page.fixtures.ts`.
- Import added at the top of the fixture file.
- Property added to `TestFixtures` type.
- Factory added inside `test.extend({...})`.
- No new fixture files were created.

## Spec

- Spec imports `test` from `@fixtures/page.fixtures`, not from `@playwright/test`.
- `logTestCaseData(test.info(), scenario.testCaseData)` is the first line of every test body.
- No locators in the spec.
- No raw assertions in the spec.
- Test title includes test case ID, description, and tags.
- Auth tests that start unauthenticated use the project's designated guest fixture (check the fixture file for the correct name).

## Locators

- `normalize-space()` is used for text matching in XPath when whitespace may vary.
- Dynamic env values in locators use `getEnvVariable` in the constructor.
- Optional elements use try-catch with a short timeout.
- Required elements are not hidden behind try-catch.

## Safety

- Production-restricted tests use `test.skip` or `isDemoEnv()` guard.
- Dynamic test data uses `TestDataUtils` or `random.utils`.
- Imports use path aliases (`@page/*`, `@data/*`, etc.) across layer boundaries.
