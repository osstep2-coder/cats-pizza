import { test, expect } from '@playwright/test';

test('Check header', async ({ page }) => {
  await page.goto('');
  const header = page.getByTestId('homePageHeader');
  await expect(header).toBeVisible();
});

test('Check card list items', async ({ page }) => {
  await page.goto('');
  const firtCard = page.getByTestId('catCard_0');
  const cardListItems = page.getByTestId(/catCard/);

  await expect(firtCard).toBeVisible();
  expect(await cardListItems.count()).toBeGreaterThan(0);
});
