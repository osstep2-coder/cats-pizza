/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '@playwright/test';
import { HomePage } from '../pom/pages/HomePage';
import { AuthModal } from '../pom/pages/AuthModal';
import { CheckoutPage } from '../pom/pages/CheckoutPage';
import { OrdersPage } from '../pom/pages/OrdersPage';
import { CartPage } from '../pom/pages/CartPage';
import path from 'path';

export const authFile = path.join(process.cwd(), 'playwright/.auth/existing-user.json');

// Declare the types of your fixtures.
type MyFixtures = {
  homePage: HomePage;
  authPage: AuthModal;
  checkoutPage: CheckoutPage;
  ordersPage: OrdersPage;
  cartPage: CartPage;
};

type AppOptions = {
  storageState: string | undefined;
};

// Extend base test by providing "todoPage" and "settingsPage".
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
const appTest = base.extend<MyFixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  authPage: async ({ page }, use) => {
    const authPage = new AuthModal(page);
    await use(authPage);
  },
  checkoutPage: async ({ page }, use) => {
    const checkoutPage = new CheckoutPage(page);
    await use(checkoutPage);
  },
  ordersPage: async ({ page }, use) => {
    const ordersPage = new OrdersPage(page);
    await use(ordersPage);
  },
  cartPage: async ({ page }, use) => {
    const cartPage = new CartPage(page);
    await use(cartPage);
  },
});

export const guestTest = appTest;
export const autorizedTest = appTest.extend<AppOptions>({
  storageState: authFile,
});
export { expect } from '@playwright/test';
