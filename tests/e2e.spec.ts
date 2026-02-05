import { test, expect } from '@playwright/test';

test('Sign in', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByTestId('signInButton').click();
  await page.getByLabel('Email').fill('test@test.ru');
  await page.getByLabel('Пароль').fill('Qwerty');
  await page.getByTestId('signInOrSignUpButton').click();
  expect(page.getByTestId('signOutButton')).toBeVisible();
});

test('Sign up', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByTestId('signInButton').click();
  await page.getByTestId('registerButton').click();
  await page.getByLabel('Имя').fill('Тест');
  await page.getByLabel('Email').fill(`${Date.now()}@test.ru`);
  await page.getByLabel('Пароль:', { exact: true }).fill('Qwerty');
  await page.getByLabel('Повторите пароль:', { exact: true }).fill('Qwerty');
  await page.getByTestId('signInOrSignUpButton').click();
  expect(page.getByTestId('signOutButton')).toBeVisible();
});

test('Make order with login', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByTestId('catCard_0').getByTestId('addToCartButton').click();
  await page.getByTestId('catModalAddToCartButton').click();
  await page.getByTestId('openCartButton').click();
  await page.getByTestId('goToCartPageButton').click();
  await page.getByTestId('makeOrderButton').click();
  await page.getByLabel('Email').fill('test@test.ru');
  await page.getByLabel('Пароль').fill('Qwerty');
  await page.getByTestId('signInOrSignUpButton').click();
  await page.getByLabel('Город').fill('Москва');
  await page.getByLabel('Улица').fill('Центральная');
  await page.getByLabel('Дом').fill('1');
  await page.getByLabel('Квартира').fill('1');
  await page.getByLabel('Комментарий курьеру').fill('Комментарий');
  await page.getByTestId('approveOrder').click();
  await expect(page.getByTestId('modalTitle')).toHaveText('Заказ оформлен');
  await page.getByTestId('closeSubmittedModalButton').click();
  await page.getByTestId('openOrdersButton').click();
  await expect(page.getByTestId('ordersList').getByRole('listitem').first()).toBeVisible();
});

test('Make order', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByTestId('signInButton').click();
  await page.getByLabel('Email').fill('test@test.ru');
  await page.getByLabel('Пароль').fill('Qwerty');
  await page.getByTestId('signInOrSignUpButton').click();
  await page.getByTestId('catCard_0').getByTestId('addToCartButton').click();
  await page.getByTestId('catModalAddToCartButton').click();
  await page.getByTestId('openCartButton').click();
  await page.getByTestId('goToCartPageButton').click();
  await page.getByTestId('makeOrderButton').click();
  await page.getByLabel('Город').fill('Москва');
  await page.getByLabel('Улица').fill('Центральная');
  await page.getByLabel('Дом').fill('1');
  await page.getByLabel('Квартира').fill('1');
  await page.getByLabel('Комментарий курьеру').fill('Комментарий');
  await page.getByTestId('approveOrder').click();
  await expect(page.getByTestId('modalTitle')).toHaveText('Заказ оформлен');
  await page.getByTestId('closeSubmittedModalButton').click();
  await page.getByTestId('openOrdersButton').click();
  await expect(page.getByTestId('ordersList').getByRole('listitem').first()).toBeVisible();
});
