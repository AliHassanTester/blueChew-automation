import { Page, test, expect, BrowserContext } from '@playwright/test';

export class AdminPage {
  private _page: Page | null = null;
  private _origin = '';

  constructor(private readonly context: BrowserContext) {}

  // Opens the admin tab on first call; subsequent calls reuse it.
  private async getPage(): Promise<Page> {
    if (!this._page) {
      this._page = await this.context.newPage();
    }
    return this._page;
  }

  // Idempotent — safe to call from the spec after portal work and again at fixture
  // teardown. Nulling _page ensures the second call is a no-op.
  async close(): Promise<void> {
    if (this._page) {
      await this._page.close();
      this._page = null;
    }
  }

  async navigateAndLogin(adminURL: string, email: string, password: string): Promise<void> {
    await test.step('Navigate to admin portal and log in', async () => {
      this._origin = new URL(adminURL).origin;
      const page = await this.getPage();
      await page.goto(adminURL, { waitUntil: 'domcontentloaded' });

      const emailField = page.locator('input[type="email"], input[formcontrolname="email"], input[name="email"]').first();
      const pwField = page.locator('input[type="password"]').first();
      // "Log In" only (not "Log in with Google")
      const loginBtn = page.getByRole('button', { name: /^\s*log\s*in\s*$/i }).first();

      // Wait for the login form to settle (root URL redirects to /auth/log-in) before
      // filling, otherwise the redirect resets the form and drops the password.
      await pwField.waitFor({ state: 'visible' });
      await emailField.fill(email);
      await pwField.fill(password);

      // The button enables only once both fields are valid — confirms the fills stuck
      await expect(loginBtn).toBeEnabled();
      await loginBtn.click();

      // Wait until login completes and we leave the /auth/* pages
      await page.waitForURL((u) => !u.toString().includes('/auth'));
    });
  }

  async navigateToUsers(): Promise<void> {
    await test.step('Navigate to Users section', async () => {
      const page = await this.getPage();
      await page.goto(`${this._origin}/users`, { waitUntil: 'domcontentloaded' });
    });
  }

  async searchUser(email: string): Promise<void> {
    await test.step(`Search for user: ${email}`, async () => {
      const page = await this.getPage();
      // The search box is the formcontrolname="q" input ("Example: john.doe@gmail.com")
      await page.locator('input[formcontrolname="q"]').first().fill(email);
      await page.locator('button:has-text("Search")').first().click();
      // The matching user is rendered as a link to /users/{id} with the email as text
      await page.locator(`a:has-text("${email}")`).first().waitFor({ state: 'visible' });
    });
  }

  /** Clicks the user's email in the search results to open their detail page. */
  async openUserDetail(email: string): Promise<void> {
    await test.step('Open user detail page', async () => {
      const page = await this.getPage();
      await page.locator(`a:has-text("${email}")`).first().click();
      await page.waitForURL(/\/users\/\d+/);
      // Status block confirms the detail page rendered
      await page.locator("xpath=//strong[text()='Status:']").waitFor({ state: 'visible' });
    });
  }

  /**
   * Clicks "Review" (opens the provider/care portal in a new tab), logs in there with
   * the same admin credentials, marks the patient's ID verified, approves them, then
   * closes the tab — returning focus to the admin tab.
   */
  async reviewAndApprove(careEmail: string, carePassword: string): Promise<void> {
    await test.step('Review patient in care portal — Set ID Verified → Approve', async () => {
      const page = await this.getPage();

      // "Review" is a link that opens the providers portal in a new tab
      const [careTab] = await Promise.all([
        this.context.waitForEvent('page'),
        page.locator("xpath=//span[text()=' Review ']").first().click(),
      ]);
      await careTab.waitForLoadState('domcontentloaded');

      // The care portal redirects an unauthenticated open to /auth/log-in — wait for
      // the login form (waitFor actually waits, unlike isVisible which is instant).
      const careEmailInput = careTab.locator('input[formcontrolname="email"]');
      const needsLogin = await careEmailInput
        .waitFor({ state: 'visible' })
        .then(() => true)
        .catch(() => false);
      if (needsLogin) {
        await careEmailInput.fill(careEmail);
        await careTab.locator('input[formcontrolname="pass"]').fill(carePassword);
        await careTab.locator('button:has-text("Log In")').first().click();
      }

      // The patient-review content loads behind a spinner — wait for the button itself
      const setIdVerified = careTab.locator("xpath=//span[text()=' Set ID Verified']/parent::button");
      await setIdVerified.waitFor({ state: 'visible' });
      await setIdVerified.click();

      // "Approve" only appears once the ID is verified
      const approve = careTab.locator("xpath=//button[text()=' Approve ']");
      await approve.waitFor({ state: 'visible' });
      await approve.click();

      // Approval redirects to the review queue — wait for that before closing the tab
      await careTab.waitForURL(/\/patients\/approval\/new/).catch(() => undefined);
      await careTab.close();
    });
  }

  /** Refreshes the admin user page and asserts the approved status is shown. */
  async verifyApprovedStatus(): Promise<void> {
    await test.step('Verify status is "Approved, Provider Review"', async () => {
      const page = await this.getPage();
      await page.reload({ waitUntil: 'domcontentloaded' });
      const status = page.locator(
        "xpath=//strong[text()='Status:']/../..//span[text()=' Approved, Provider Review ']",
      );
      await expect(status).toBeVisible();
    });
  }

  /**
   * Clicks "Add Order" (enabled once approved), selects a shipping option, enters a
   * note and submits. Submitting redirects to the order-history tab.
   */
  async addOrder(shippingOption: string, note: string): Promise<void> {
    await test.step(`Add order — shipping "${shippingOption}"`, async () => {
      const page = await this.getPage();

      await page.locator("xpath=//span[text()=' Add Order ']").first().click();
      await page.waitForURL(/\/add-order/);

      const shipping = page.locator('select[formcontrolname="ship_opt_id"]');
      await shipping.waitFor({ state: 'visible' });
      await shipping.selectOption({ label: shippingOption });
      await expect(shipping).toHaveValue(/.+/); // a real option (not the placeholder) is selected

      await page.locator('textarea[formcontrolname="note"]').fill(note);
      await page.locator('button:has-text("Submit")').first().click();
    });
  }

  /** Asserts the order we just added appears as a row under "Pending Orders". */
  async verifyOrderAdded(): Promise<void> {
    await test.step('Verify the added order appears under Pending Orders', async () => {
      const page = await this.getPage();
      // Submit redirects to the order-history tab which lists the new pending order
      await page.waitForURL(/\/order-history/);

      const pendingCard = page.locator('mat-card', {
        has: page.locator('h5:has-text("Pending Orders")'),
      });
      await expect(pendingCard).toBeVisible();

      // The order we just queued is a data row; its Queue Date is today (a fresh user
      // has no prior orders, so this row is the one we added).
      const queueDate = pendingCard.locator('mat-row mat-cell.mat-column-queue_date').first();
      await expect(queueDate).toBeVisible();
      const today = new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
      await expect(queueDate).toContainText(today);
    });
  }

  /**
   * Opens the Subscription tab, refreshes, and verifies the new customer's product
   * subscription is active: the purchased Gold plan is listed and the subscription
   * exposes the "Put On Hold" control (only present for an active/running subscription).
   */
  async verifySubscriptionStarted(): Promise<void> {
    await test.step('Verify the product subscription has started', async () => {
      const page = await this.getPage();
      await page.locator('a:has-text("Subscription")').first().click();
      await page.reload({ waitUntil: 'domcontentloaded' });

      // The purchased Gold plan is listed against the subscription
      const plan = page.locator("xpath=//strong[normalize-space()='Plan:']/following::*[1]");
      await expect(plan).toContainText(/GOLD HIGH/i, { timeout: 30_000 });

      // Only an active (started) subscription can be put on hold
      await expect(page.locator('button:has-text("Put On Hold")')).toBeVisible();
    });
  }
}
