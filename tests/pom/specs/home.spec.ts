import { test } from '../../fixtures/app.fixture';

test('Catalog opens and shows cards', async ({ homePage }) => {
  await homePage.open();
  await homePage.assertLoaded();
  await homePage.assertCardsVisible();
});

test('Guest adds first cat to cart and sees badge count', async ({ homePage }) => {
  await homePage.open();
  await homePage.addFirstCatToCart();
  await homePage.assertCartBadgeCount(1);
});

test('Guest opens cart and navigates to cart page', async ({ homePage }) => {
  await homePage.open();
  await homePage.addFirstCatToCart();
  await homePage.openCart();
  await homePage.goToCartPage();
  await homePage.assertCartPageOpened();
});
