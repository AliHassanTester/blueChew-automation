# Code Templates

Use these templates when generating framework files. All paths shown use `standard/checkout/` as an example — replace with the appropriate `<priority>/<module>/` for your feature.

## Interface template

```typescript
// src/interfaces/myFeature.interface.ts
export interface MyFeatureDetails {
  mainURL: string;
}
```

## Data template

```typescript
// src/data/standard/checkout/myFeature.data.ts
import { MyFeatureDetails } from '@interfaces/myFeature.interface';
import { TestCaseData } from '@interfaces/testcase.data.interface';
import { LoginDetails } from '@interfaces/auth.interface';
import { getEnvVariable } from '@utilities/env.utils';

export interface MyFeatureTestCaseData {
  testCaseData: TestCaseData;
  loginDetails: LoginDetails;
  myFeatureDetails: MyFeatureDetails;
}

const myFeatureTestData: { [key: string]: MyFeatureTestCaseData } = {
  'TC-99-My-Feature': {
    myFeatureDetails: { mainURL: getEnvVariable('AUTH_URL') },
    loginDetails: {
      username: getEnvVariable('user_name'),
      password: getEnvVariable('password'),
    },
    testCaseData: {
      tags: '@standard @myModule @regression @smoke',
      testCase: 'TC-99-My-Feature',
      testDescription: 'One-line description of what is being validated.',
      testSummary: 'Short summary of the acceptance criterion.',
    },
  },
};

export function getMyFeatureData(testCase: string): MyFeatureTestCaseData {
  const data = myFeatureTestData[testCase];
  if (!data) {
    throw new Error(`Test case data not found for: ${testCase}`);
  }
  return data;
}
```

Key rules:
- Use `getEnvVariable` (not `process.env`) for required env values in data files.
- Tags format: `@<priority> @<module> @regression @smoke` (priority and module first).
- Data key must exactly match the `testCase` field value.

## Page Object template

```typescript
// src/page/standard/checkout/myFeature.page.ts
import { Page, TestInfo, test } from '@playwright/test';
import { LocatorInfo } from '@interfaces/locator.info.interface';
import { BasePage } from '../../base.page';   // relative path to BasePage is acceptable here

export class MyFeaturePage extends BasePage {
  private readonly locators: { [key: string]: LocatorInfo };

  constructor(page: Page, testInfo: TestInfo) {
    super(page, testInfo);   // BasePage instantiates factories — do not repeat them

    this.locators = {
      someButton: {
        description: 'Some Button',
        locator: this.page.locator("//button[normalize-space()='Some Button']"),
      },
      someHeader: {
        description: 'Some Header',
        locator: this.page.locator("//h1[normalize-space()='Welcome']"),
      },
    };
  }

  public async doSomething(): Promise<void> {
    await test.step('Description of the high-level action', async () => {
      await this.playwrightActionsFactory.click(this.locators.someButton);
      await this.playwrightVerificationsFactory.expectElementExist(this.locators.someHeader);
    });
  }
}
```

Key rules:
- Extend `BasePage`, not a standalone class.
- Call `super(page, testInfo)` — `BasePage` wires up `playwrightActionsFactory`, `playwrightVerificationsFactory`, and any shared helpers.
- Never re-instantiate factories in the subclass constructor.
- Locators are `LocatorInfo` objects with `description` and `locator`.
- Prefer XPath with `normalize-space()` for text matching.
- Never import test data into Page Objects.

## Fixture registration template

Add to `src/fixtures/page.fixtures.ts`:

```typescript
// 1. Add import at the top with other page imports
import { MyFeaturePage } from '@page/standard/checkout/myFeature.page';

// 2. Add property to TestFixtures type
export type TestFixtures = {
  // ...existing fixtures...
  myFeaturePage: MyFeaturePage;
};

// 3. Add factory inside test.extend({...})
myFeaturePage: async ({ page }, use, testInfo) => {
  await use(new MyFeaturePage(page, testInfo));
},
```

Do not create new fixture files. There is one shared fixture file.

## Spec template

```typescript
// src/specs/standard/checkout/myFeature.spec.ts
import { logTestCaseData } from '@utilities/test.helper.utils';
import { getMyFeatureData } from '@data/standard/checkout/myFeature.data';
import { test } from '@fixtures/page.fixtures';

const scenario1 = getMyFeatureData('TC-99-My-Feature');

test.describe('Feature: <Short feature description>', () => {
  test(`
        Test case: '${scenario1.testCaseData.testCase}'
        Description: '${scenario1.testCaseData.testDescription}'
        Tags: '${scenario1.testCaseData.tags}'
      `, async ({ myFeaturePage }) => {
    logTestCaseData(test.info(), scenario1.testCaseData);

    await test.step('Step description here', async () => {
      await myFeaturePage.doSomething();
    });
  });
});
```

Key rules:
- Import `test` from `@fixtures/page.fixtures` — never from `@playwright/test`.
- `logTestCaseData(test.info(), scenario.testCaseData)` must be the first line of every test body.
- No locators, no raw assertions in specs.
- For auth tests that start unauthenticated, use the project's designated guest fixture (check the fixture file for the correct name).
