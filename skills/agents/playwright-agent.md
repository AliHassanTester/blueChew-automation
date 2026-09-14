# Playwright Agent Instructions

Use these instructions when acting as the automation framework agent.

## Operating style

- Be precise and conservative.
- Prefer small, framework-compliant changes over large rewrites.
- Load only the needed workflow and reference files.
- Do not re-read every file unless the task requires a full audit.
- When generating code, follow the templates exactly unless the existing repo has a newer pattern.
- When existing code conflicts with references, mention the conflict and prefer the current repo pattern if it is clearly intentional.

## Reference loading — load only what the task needs

Do not load all six reference files for every task. Load by what the task actually requires:

| Always load | `references/core-framework.md` + `references/templates.md` |
|---|---|
| Complex or dynamic selectors | + `references/locator-rules.md` |
| Non-trivial actions or verifications | + `references/utility-factories.md` |
| Env variables, dynamic data, or prod guards | + `references/environment-and-data.md` |
| Before returning any generated code | + `references/validation-checklist.md` |

A typical new test needs: `core-framework.md` + `templates.md` + `validation-checklist.md`.  
A fix/update often needs only: `templates.md` + `validation-checklist.md`.  
An audit is the only task that reads all six.

## Before generating code

Identify:

- Feature name.
- Test case ID.
- Priority tier (`critical`, `standard`, `low`).
- Module / folder name.
- Target environment.
- Whether login is required (and which fixture type: guest, default session, or a specific session page — check the fixture file).
- Required page interactions.
- Required assertions or validations.
- Required dynamic data.
- Whether production skipping is needed.

Do not ask unnecessary questions if the available context is enough. Make a reasonable assumption and state it.

## Choosing between exploration and direct generation

**Use `playwright-cli` (the Playwright Skill) before writing code when:**

- The UI elements for this feature are unknown — selectors cannot be guessed from the test description alone.
- The exact flow or UI structure needs to be verified against the live application.
- A test is failing and the selector or page state needs to be inspected.
- The test case description is vague about UI interactions.

**Proceed directly to code generation without exploration when:**

- The feature already has a Page Object — just extend it.
- The UI elements are clearly described or visible in existing code.
- It is a data-only change or a spec restructure.

See `workflows/explore-and-implement.md` for the full exploration → implementation flow.

## How to use playwright-cli for exploration

The `playwright-cli` skill provides browser interaction commands. When exploration is needed:

1. Load `workflows/explore-and-implement.md` for the integrated workflow.
2. Use `playwright-cli open` / `playwright-cli snapshot` to inspect live page elements.
3. Use `playwright-cli eval "el => el.getAttribute('data-testid')" eN` to discover stable attributes.
4. Use `playwright-cli generate-locator eN --raw` to get a Playwright locator expression.
5. **Translate** the discovered element into a framework-compliant XPath `LocatorInfo` — do not copy raw generated code into specs or Page Objects.

### Translation rule

`playwright-cli` generates role-based Playwright code like:

```typescript
await page.getByRole('button', { name: 'Continue' }).click();
```

Translate this into the framework's `LocatorInfo` XPath pattern:

```typescript
continueButton: {
  description: 'Continue Button',
  locator: this.page.locator("//button[normalize-space()='Continue']"),
},
```

Then use the factory method:

```typescript
await this.playwrightActionsFactory.click(this.locators.continueButton);
```

Never paste playwright-cli generated code directly into framework files.

## How to use playwright-cli for test debugging / healing

When a test is failing:

1. Load `workflows/update-existing-test.md` for the update workflow.
2. Run the failing test with `--debug=cli` in the background (see playwright-cli SKILL.md reference `playwright-tests.md`).
3. Attach with `playwright-cli attach tw-XXXX`.
4. Inspect the actual page state at the point of failure.
5. Update the Page Object locator or method — not the spec.
6. Re-run to confirm the fix.
7. Validate against `references/validation-checklist.md`.

## During code generation

- Create interface first.
- Create data second.
- Create Page Object third (extending `BasePage`).
- Update shared fixture (`page.fixtures.ts`) fourth.
- Create or update spec last.
- Validate before final response.

## Final response style

When returning generated code or changes, summarize:

- Files created or updated.
- Main framework rules followed.
- Any assumptions made.
- Any playwright-cli exploration performed and what was discovered.
- Any manual repo-specific checks still needed.
