# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\login.spec.ts >> Login — Regression >> wrong credentials shows error and stays on /log-in
- Location: automation\tests\e2e\login.spec.ts:55:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/log-in
Call log:
  - navigating to "http://localhost:3000/log-in", waiting until "domcontentloaded"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: localhost
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1   | import type { Page, Locator } from '@playwright/test';
  2   | import { expect } from '@playwright/test';
  3   | import { appConfig } from '../config/environment.config';
  4   | import { TIMEOUTS } from '../constants/timeouts.constants';
  5   | import { Logger } from '../utils/logger.utils';
  6   | import { retryAction } from '../utils/retry.utils';
  7   | import { captureFullPage } from '../utils/screenshot.utils';
  8   | 
  9   | /**
  10  |  * Abstract base class for all page objects.
  11  |  *
  12  |  * Provides:
  13  |  *  • Typed constructor that binds the Playwright Page
  14  |  *  • Common navigation and interaction helpers
  15  |  *  • Built-in retry for flaky click/fill operations
  16  |  *  • Consistent screenshot naming
  17  |  *
  18  |  * Every page object must declare its relative `pageUrl` and can optionally
  19  |  * override `waitForPageLoad` for pages that need non-standard load signals.
  20  |  */
  21  | export abstract class BasePage {
  22  |   protected readonly logger: Logger;
  23  | 
  24  |   constructor(readonly page: Page) {
  25  |     this.logger = new Logger(this.constructor.name);
  26  |   }
  27  | 
  28  |   /** Route path relative to BASE_URL (e.g. '/login') */
  29  |   abstract readonly pageUrl: string;
  30  | 
  31  |   // ── Navigation ────────────────────────────────────────────────────────────
  32  | 
  33  |   async navigate(): Promise<void> {
  34  |     const url = `${appConfig.baseUrl}${this.pageUrl}`;
  35  |     this.logger.step(`Navigating to ${url}`);
> 36  |     await this.page.goto(url, { waitUntil: 'domcontentloaded' });
      |                     ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/log-in
  37  |     await this.waitForPageLoad();
  38  |   }
  39  | 
  40  |   // Base implementation is a no-op — goto already waits for domcontentloaded.
  41  |   // Override in page objects that need a specific ready signal (e.g. wait for a key element).
  42  |   async waitForPageLoad(): Promise<void> {}
  43  | 
  44  |   async reload(): Promise<void> {
  45  |     await this.page.reload({ waitUntil: 'load' });
  46  |   }
  47  | 
  48  |   async getTitle(): Promise<string> {
  49  |     return this.page.title();
  50  |   }
  51  | 
  52  |   async getCurrentUrl(): Promise<string> {
  53  |     return this.page.url();
  54  |   }
  55  | 
  56  |   // ── Element interactions ───────────────────────────────────────────────────
  57  | 
  58  |   /**
  59  |    * Clicks a locator with automatic retry on transient failures
  60  |    * (element detachment, interception by overlays).
  61  |    */
  62  |   async click(locator: Locator): Promise<void> {
  63  |     this.logger.debug(`Clicking ${await this.describeLocator(locator)}`);
  64  |     await retryAction(async () => {
  65  |       await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT });
  66  |       await locator.click();
  67  |     });
  68  |   }
  69  | 
  70  |   /** Clears a field and fills it with the given value. */
  71  |   async fill(locator: Locator, value: string): Promise<void> {
  72  |     await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.ELEMENT });
  73  |     await locator.clear();
  74  |     await locator.fill(value);
  75  |   }
  76  | 
  77  |   /** Selects an option in a <select> element by its visible label. */
  78  |   async selectOption(locator: Locator, label: string): Promise<void> {
  79  |     await locator.selectOption({ label });
  80  |   }
  81  | 
  82  |   // ── Visibility helpers ─────────────────────────────────────────────────────
  83  | 
  84  |   async isVisible(locator: Locator): Promise<boolean> {
  85  |     try {
  86  |       await locator.waitFor({ state: 'visible', timeout: TIMEOUTS.SHORT });
  87  |       return true;
  88  |     } catch {
  89  |       return false;
  90  |     }
  91  |   }
  92  | 
  93  |   async waitForVisible(locator: Locator, timeout = TIMEOUTS.ELEMENT): Promise<void> {
  94  |     await locator.waitFor({ state: 'visible', timeout });
  95  |   }
  96  | 
  97  |   async waitForHidden(locator: Locator, timeout = TIMEOUTS.ELEMENT): Promise<void> {
  98  |     await locator.waitFor({ state: 'hidden', timeout });
  99  |   }
  100 | 
  101 |   // ── Assertions ─────────────────────────────────────────────────────────────
  102 | 
  103 |   async assertVisible(locator: Locator): Promise<void> {
  104 |     await expect(locator).toBeVisible();
  105 |   }
  106 | 
  107 |   async assertUrl(expected: string | RegExp): Promise<void> {
  108 |     await expect(this.page).toHaveURL(expected);
  109 |   }
  110 | 
  111 |   async assertTitle(expected: string | RegExp): Promise<void> {
  112 |     await expect(this.page).toHaveTitle(expected);
  113 |   }
  114 | 
  115 |   // ── Utilities ──────────────────────────────────────────────────────────────
  116 | 
  117 |   async scrollTo(locator: Locator): Promise<void> {
  118 |     await locator.scrollIntoViewIfNeeded();
  119 |   }
  120 | 
  121 |   async screenshot(name: string): Promise<string> {
  122 |     return captureFullPage(this.page, name);
  123 |   }
  124 | 
  125 |   async hover(locator: Locator): Promise<void> {
  126 |     await locator.hover();
  127 |   }
  128 | 
  129 |   // Returns a human-readable locator description for log messages
  130 |   private async describeLocator(locator: Locator): Promise<string> {
  131 |     try {
  132 |       return String(locator);
  133 |     } catch {
  134 |       return 'unknown locator';
  135 |     }
  136 |   }
```