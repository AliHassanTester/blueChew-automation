# Applitools MCP — Verification & Usage Guide

Applitools MCP lets an AI assistant (Claude Code, Cursor, Copilot, etc.) work with our Applitools Eyes visual testing directly in chat — setting up checks, running them, and reading back results — instead of a person switching between the terminal, the code, and the Applitools dashboard.

This doc confirms it's working and explains, in plain terms, what it can do and how to use it well.

---

## What we verified

On 2026-08-25 we tested every capability the Applitools MCP provides, end to end, using a small standalone sample test (based on Applitools' own official example) so nothing in our real test suite was touched.

**Result: everything works.** The test ran a real visual check against a sample website, across three browser/device combinations (Chrome, Firefox, and a simulated Pixel 5 phone), and all three passed cleanly.

| Check | Result |
| :--- | :--- |
| Browser/device coverage | Chrome, Firefox, Pixel 5 (simulated) |
| Visual checks run | 2 per browser (full page + a specific component) |
| Outcome | ✅ 3 / 3 passed |
| [View the results on the Applitools dashboard](https://eyes.applitools.com/app/test-results/00000251614597452516?accountId=c5sHSB8ZwEq0FzziU2UCHg__) | |

Along the way we hit one small configuration issue (a report file wasn't pointed at the right location) and fixed it — worth knowing about if this is set up again elsewhere, but not something that affects day-to-day use.

---

## What each capability does

| Capability | What it's for | When the AI should use it |
| :--- | :--- | :--- |
| **Check API key** | Confirms our Applitools account credentials are valid before doing anything else. | Once, at the start of a task — not before every step. |
| **Set up a project** | Walks through adding visual testing to a project for the first time. | Once, when onboarding a new project — not repeated. |
| **Add visual checks to a test** | Inserts the right visual-check code into an existing test, following Applitools' best practices. | Once per test file being updated. |
| **Set up cross-browser testing** | Configures testing across many browsers and devices at once, in the cloud, without installing them locally. | Once per project setup. |
| **Get results link from a test run** | Pulls the results link straight out of the test's console output. | Right after a test finishes running — fastest way to get a link. |
| **Fetch detailed results (from report)** | Reads a locally generated test report for pass/fail details. | Only when a proper local report already exists and is up to date. |
| **Fetch detailed results (from a link)** | Same detailed pass/fail breakdown, but works from a results link alone — no local report needed. | The preferred way to check results — simpler and more reliable than reading a local report. |

---

## Recommended way of working (fast and efficient)

1. **Confirm the account is connected** — once per session.
2. **Set up the project/browser coverage** — once, when first configuring.
3. **Add visual checks to test files** — once per file.
4. **Run the tests.**
5. **Get the results link**, then **fetch the detailed results from that link.**

Following this order avoids repeating expensive steps unnecessarily and gets a clear pass/fail answer in the fewest steps — the setup steps are "do once and reuse," and checking results is a quick two-step lookup rather than digging through report files.

---

## Good to know

Our current test suite doesn't yet use the newer pattern this results-lookup feature needs, so pulling detailed results back into chat isn't available for our real tests today — visual checks still run and capture correctly, and results are always visible directly on the Applitools dashboard. This was proven working end-to-end using a standalone sample test, and can be extended to our real suite later if useful. See [`mcp-visual-testing-servers.md`](mcp-visual-testing-servers.md) for the fuller technical breakdown and trade-offs.
