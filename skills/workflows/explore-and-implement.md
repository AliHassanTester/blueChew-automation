# Workflow: Explore the Application and Implement a Test

Use this workflow when the UI elements for a new test are unknown and the live application must be inspected before writing framework code.

This workflow bridges two distinct systems:
- **`playwright-cli` skill** — provides browser exploration, snapshots, and locator discovery.
- **Framework skill** — provides the five-layer architecture all code must follow.

The output of exploration feeds the framework implementation. The playwright-cli generated code is never pasted directly into framework files.

---

## When to use this workflow

- You are implementing a new test case and cannot determine selectors from the test description alone.
- The test description says "explore the application for TC-XXX."
- A feature area has no existing Page Object to reference.

If a Page Object already covers the area and selectors are known, go directly to `workflows/generate-new-test.md` or `workflows/add-test-case.md`.

---

## Step 1 — Load framework context

Before opening the browser, read:

- `references/core-framework.md` — to know the target folder structure and priority tier.
- `references/locator-rules.md` — to know how discovered elements must be typed.
- `references/templates.md` — to have the code templates ready.

Identify:
- Feature name and test case ID.
- Priority tier (`critical`, `standard`, `low`) and module folder.
- Whether the test requires authentication (affects which fixture to use).

---

## Step 2 — Explore the application with playwright-cli

Load the `playwright-cli` skill (SKILL.md under `.claude/skills/playwright-cli/`).

### 2.1 Check prerequisites

```bash
test -f playwright.config.ts
npx --no-install playwright --version
```

### 2.2 Launch via the existing test seed

The framework's global setup handles authentication. Use the existing spec infrastructure to enter the application in the correct state rather than opening a bare URL.

```bash
# Run any existing spec in debug mode to reach an authenticated page state
PLAYWRIGHT_HTML_OPEN=never npx playwright test src/specs/standard/auth/login.spec.ts --debug=cli
# Wait for the "tw-XXXX" session name in output
playwright-cli attach tw-XXXX
playwright-cli resume
```

Alternatively, open the application URL directly when no authenticated state is needed:

```bash
playwright-cli open https://<app-url>
```

### 2.3 Explore and map the feature

```bash
playwright-cli snapshot               # inventory of page elements
playwright-cli find "Button Label"    # search for specific text
playwright-cli click eN               # navigate the flow
playwright-cli snapshot               # inspect state after interaction
playwright-cli eval "el => el.getAttribute('data-testid')" eN   # check stable attributes
playwright-cli generate-locator eN --raw   # get Playwright locator expression
```

Map out for each interactive element:
- The element type (button, input, heading, link).
- Stable text content or ARIA label.
- Any `data-testid` or `aria-label` attributes.
- The flow order (what happens after each interaction).

### 2.4 Stop the exploration session

```bash
playwright-cli close
# If running a background test:
# Stop the background process
```

---

## Step 3 — Translate discoveries into framework-compliant locators

**Never paste playwright-cli generated code into framework files.**

For each discovered element, convert to a `LocatorInfo` XPath locator:

| playwright-cli generates | Framework requires |
|---|---|
| `page.getByRole('button', { name: 'Continue' }).click()` | `this.page.locator("//button[normalize-space()='Continue']")` |
| `page.getByLabel('Email').fill(...)` | `this.page.locator("//input[@name='email']")` or `//label[text()='Email']/..//input` |
| `page.getByTestId('submit-btn').click()` | `this.page.locator('[data-testid="submit-btn"]')` |
| `page.getByRole('heading', { name: 'Welcome' })` | `this.page.locator("//h1[normalize-space()='Welcome']")` |

Rules:
- Prefer XPath with semantic text matching.
- Use `normalize-space()` when button or label text may have surrounding whitespace.
- Use CSS `[data-testid]` or `[aria-label]` when those are the most stable attribute.
- Avoid auto-generated IDs, hashed class names, or deep positional CSS chains.

---

## Step 4 — Implement the five framework layers

Follow `workflows/generate-new-test.md` for full generation steps. Summary:

1. **Interface** — define the shape of page-specific data (`src/interfaces/<feature>.interface.ts`).
2. **Data** — create test data keyed by test case ID (`src/data/<priority>/<module>/<feature>.data.ts`).
3. **Page Object** — create a class extending `BasePage` with the translated `LocatorInfo` locators and public action/verification methods (`src/page/<priority>/<module>/<feature>.page.ts`).
4. **Fixture** — register the new Page Object in `src/fixtures/page.fixtures.ts`.
5. **Spec** — create a thin spec that delegates all interaction to the Page Object (`src/specs/<priority>/<module>/<feature>.spec.ts`).

---

## Step 5 — Execute and validate

Run the new spec:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test src/specs/<priority>/<module>/<feature>.spec.ts
```

If the test fails, move to the Heal workflow:

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test src/specs/<priority>/<module>/<feature>.spec.ts --debug=cli
# Wait for tw-XXXX session
playwright-cli attach tw-XXXX
# Inspect the actual failure point
playwright-cli snapshot
playwright-cli console
```

Fix the Page Object locator or method. Re-run to confirm green.

---

## Step 6 — Final validation

Validate against `references/validation-checklist.md` before returning code.

---

## Responsibility summary

| Concern | Owned by |
|---|---|
| What elements exist on the page | `playwright-cli` exploration |
| How elements are located in code | Framework `LocatorInfo` + XPath rules |
| Browser interaction and state | `playwright-cli` actions |
| Code structure and architecture | Framework five-layer pattern |
| Debugging live failures | `playwright-cli` `--debug=cli` attach |
| Fix isolation to correct layer | Framework update-existing-test workflow |

---

## Cross-references

- Browser commands: `playwright-cli` SKILL.md
- Exploration/heal detail: `playwright-cli/references/test-generation.md`
- Debug attach mechanics: `playwright-cli/references/playwright-tests.md`
- Framework generation: `workflows/generate-new-test.md`
- Framework update: `workflows/update-existing-test.md`
- Locator rules: `references/locator-rules.md`
- Code templates: `references/templates.md`
- Final check: `references/validation-checklist.md`
