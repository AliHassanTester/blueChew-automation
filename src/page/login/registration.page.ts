import { Page, TestInfo, test } from '@playwright/test';
import { PlaywrightActionFactory } from '@utilities/playwright.actions.utils';
import { PlaywrightVerificationFactory } from '@utilities/playwright.verifications.utils';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { RegistrationDetails } from '@interfaces/registration.interface';

export class RegistrationPage {
  public readonly page: Page;
  private readonly playwrightActionsFactory: PlaywrightActionFactory;
  private readonly playwrightVerificationsFactory: PlaywrightVerificationFactory;
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.playwrightActionsFactory = new PlaywrightActionFactory(page, testInfo);
    this.playwrightVerificationsFactory = new PlaywrightVerificationFactory(page, testInfo);

    this.locators = {
      registrationHeading: {
        description: 'Registration Page Heading',
        locator: this.page
          .locator(
            "//h1[contains(normalize-space(),'Create')] | //h1[contains(normalize-space(),'Sign Up')] | //h1[contains(normalize-space(),'Register')] | //h1[contains(normalize-space(),'Get Started')]",
          )
          .first(),
      },
      emailInput: {
        description: 'Email Input',
        locator: this.page.locator("//input[@type='email']").first(),
      },
      passwordInput: {
        description: 'Password Input',
        locator: this.page
          .locator("//input[@type='password' and (@name='password' or @id='password' or @placeholder='Password')]")
          .first(),
      },
      confirmPasswordInput: {
        description: 'Confirm Password Input',
        locator: this.page
          .locator(
            "//input[@type='password' and (@name='confirmPassword' or @name='password_confirmation' or @placeholder='Confirm Password')]",
          )
          .first(),
      },
      firstNameInput: {
        description: 'First Name Input',
        locator: this.page
          .locator("//input[@name='firstName' or @name='first_name' or @placeholder='First Name']")
          .first(),
      },
      lastNameInput: {
        description: 'Last Name Input',
        locator: this.page
          .locator("//input[@name='lastName' or @name='last_name' or @placeholder='Last Name']")
          .first(),
      },
      dateOfBirthInput: {
        description: 'Date of Birth Input',
        locator: this.page
          .locator(
            "//input[@name='dateOfBirth' or @name='dob' or @name='date_of_birth' or @placeholder='MM/DD/YYYY']",
          )
          .first(),
      },
      submitButton: {
        description: 'Submit / Create Account Button',
        locator: this.page.locator("//button[@type='submit']").first(),
      },
      successIndicator: {
        description: 'Post-registration Success Indicator',
        locator: this.page
          .locator(
            "//h1[contains(normalize-space(),'Welcome')] | //h2[contains(normalize-space(),'Welcome')] | //div[contains(@class,'success')] | //p[contains(normalize-space(),'check your email')]",
          )
          .first(),
      },
      termsCheckbox: {
        description: 'Terms and Conditions Checkbox',
        locator: this.page
          .locator("//input[@type='checkbox' and (@name='terms' or @id='terms' or @aria-label='Terms')]")
          .first(),
      },
    };
  }

  async navigateToRegistrationPage(url: string): Promise<void> {
    await test.step('Navigate to registration page', async () => {
      await this.playwrightActionsFactory.navigateToURL(url);
      await this.playwrightActionsFactory.waitForDomLoad();
      await this.playwrightVerificationsFactory.waitForLoaderToDisappear();
    });
  }

  async verifyRegistrationPageLoaded(): Promise<void> {
    await test.step('Verify registration page is loaded', async () => {
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.registrationHeading);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.emailInput);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.submitButton);
    });
  }

  async fillEmailAndPassword(details: RegistrationDetails): Promise<void> {
    await test.step('Fill email and password', async () => {
      await this.playwrightActionsFactory.sendKeys(this.locators.emailInput, details.email);
      await this.playwrightActionsFactory.sendKeys(this.locators.passwordInput, details.password);

      try {
        await this.locators.confirmPasswordInput.locator.waitFor({ state: 'visible', timeout: 3_000 });
        await this.playwrightActionsFactory.sendKeys(this.locators.confirmPasswordInput, details.password);
      } catch {
        // Confirm password field not present in this registration step
      }
    });
  }

  async fillPersonalDetails(details: RegistrationDetails): Promise<void> {
    await test.step('Fill personal details', async () => {
      try {
        await this.locators.firstNameInput.locator.waitFor({ state: 'visible', timeout: 3_000 });
        await this.playwrightActionsFactory.sendKeys(this.locators.firstNameInput, details.firstName);
        await this.playwrightActionsFactory.sendKeys(this.locators.lastNameInput, details.lastName);
      } catch {
        // Name fields not present in this registration step
      }

      try {
        await this.locators.dateOfBirthInput.locator.waitFor({ state: 'visible', timeout: 3_000 });
        await this.playwrightActionsFactory.sendKeys(this.locators.dateOfBirthInput, details.dateOfBirth);
      } catch {
        // DOB field not present in this registration step
      }
    });
  }

  async acceptTermsIfPresent(): Promise<void> {
    await test.step('Accept terms and conditions if prompted', async () => {
      try {
        await this.locators.termsCheckbox.locator.waitFor({ state: 'visible', timeout: 3_000 });
        await this.playwrightActionsFactory.selectRadioButtonOrCheckBox(this.locators.termsCheckbox);
      } catch {
        // Terms checkbox not present
      }
    });
  }

  async submitRegistration(): Promise<void> {
    await test.step('Submit registration form', async () => {
      await this.playwrightActionsFactory.click(this.locators.submitButton);
    });
  }

  async verifyRegistrationSuccess(): Promise<void> {
    await test.step('Verify registration completed successfully', async () => {
      await this.playwrightVerificationsFactory.waitForLoaderToDisappear();
      await this.playwrightVerificationsFactory.waitForProcessingLoaderToDisappear();
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.successIndicator);
    });
  }
}
