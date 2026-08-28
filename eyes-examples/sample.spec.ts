import { test } from '@applitools/eyes-playwright/fixture';

test('Playwright website visual checkpoints', async ({ page, eyes }) => {
  await page.goto('https://playwright.dev/');
  await eyes.check('Home page', { fully: true, matchLevel: 'Dynamic' });

  const searchBox = page.getByLabel('Search');
  await eyes.check('Search box', { region: searchBox, matchLevel: 'Dynamic' });
});
