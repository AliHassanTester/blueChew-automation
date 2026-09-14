# Workflow: Record a User Flow with Jam CLI and Generate Automation

**Input:** Jam URL from the engineer.  
**Output:** Framework-compliant test — created or updated, run, and validated.  
The engineer runs no CLI commands. The agent handles everything.

---

## Step 1 — Read the recording

Extract the UUID from the Jam URL (`https://jam.dev/c/<id>`) and call:

```bash
jam get intents <id>
```

Returns structured JSON: user goals, key actions with CSS selectors, success/failure per phase.  
Measured: 7,293 bytes ≈ 1,823 tokens for a 34-second, 4-phase flow.

If `status !== "ready"`, fall back:

```bash
jam get events <id> --limit 50
# filter items where type === 5 (user-action events only)
```

Then condense with the cheapest capable model using this internal prompt:

```
Extract a structured test case. Output ONLY:
Feature / Priority / Module / Auth required / Test ID / Steps / Assertions / Notes.
Max 300 tokens. No explanation.
[filtered events here]
```

---

## Step 2 — Check if test already exists

Before generating anything, search the codebase:

```bash
# Search by feature name derived from recording title / userGoal
grep -r "<featureName>" src/specs/ src/page/ --include="*.ts" -l

# Search by page URL from recording
grep -r "<pageUrl>" src/specs/ src/page/ --include="*.ts" -l
```

**If a match is found → update path:**
- Read the existing Page Object, spec, and data files
- Diff the existing test steps against the Jam intents
- Add missing steps / scenarios, update stale selectors, preserve passing tests
- Load `workflows/update-existing-test.md` for update rules

**If no match → create path:**
- Proceed to Step 3 (full five-layer generation)

---

## Step 3 — Translate selectors

`jam get intents` gives CSS selectors. Convert to XPath LocatorInfo before writing any file:

| CSS from Jam | XPath LocatorInfo |
|---|---|
| `button#id_login_button_click` | `//button[@id='id_login_button_click']` |
| `a.lgn_auth__login` (text: LOGIN) | `//a[normalize-space()='LOGIN']` |
| `input[type=email].lgn_auth__input` | `//input[@type='email']` |
| `button.lgn_auth__password_toggle` | `//button[contains(@class,'lgn_auth__password_toggle')]` |

Priority: `id` > `normalize-space()` text > stable class. Never use positional XPath.

If a selector cannot be reliably determined, emit `SELECTOR_NEEDED: <element description>` and resolve with `playwright-cli eval` after generation.

---

## Step 4 — Generate (create path only)

Load only what this test needs:

| Always | `core-framework.md` + `templates.md` + `validation-checklist.md` |
|---|---|
| Complex selectors | + `locator-rules.md` |
| Non-trivial factory usage | + `utility-factories.md` |
| Env vars / prod guards | + `environment-and-data.md` |

Generate in order: Interface → Data → Page Object → Fixture → Spec.  
All Page Objects extend BasePage. No raw Playwright calls.

For any `SELECTOR_NEEDED` marker: run `playwright-cli snapshot` + `eval`, fill the locator, then continue.

---

## Step 5 — Run and validate

```bash
npx playwright test src/specs/<priority>/<module>/<feature>.spec.ts
```

If it fails: load `workflows/explore-and-implement.md` (heal section). Attach via `--debug=cli`, inspect DOM at failure, fix Page Object locator only.

Run the validation checklist (`references/validation-checklist.md`) before marking done.

---

## Full pipeline (one view)

```
Jam URL
  → jam get intents <id>          (~1,823 tok measured)
  → intents ready? NO → events fallback → condense
  → grep for existing test
      → FOUND  → diff → update existing files
      → MISSING → translate selectors → generate five layers
  → resolve SELECTOR_NEEDED via playwright-cli eval
  → run spec → pass? done | fail → heal → re-run
```

---

## Token cost (measured)

| Component | Tokens | Note |
|---|---|---|
| `jam get intents` | ~1,823 | Measured: 7,293 bytes |
| SKILL.md + agent rules + this workflow | ~3,470 | Measured: 13,881 bytes |
| 3 core refs | ~3,668 | Measured: 14,674 bytes |
| **Total — medium flow** | **~8,961** | New test, create path |
| Update path (existing test) | **~6,000–7,500** | Fewer refs, no full generation |

Formula: `total ≈ 7,138 (fixed) + ~456 × phase_count`

---

## Cross-references

- Update rules: `workflows/update-existing-test.md`
- Selector lookup: `workflows/explore-and-implement.md §3`
- Five-layer detail: `workflows/generate-new-test.md`
- Locator rules: `references/locator-rules.md`
- Templates: `references/templates.md`
- Checklist: `references/validation-checklist.md`
