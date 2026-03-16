/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '@playwright/test';
import { HomePage } from '../pom/pages/HomePage';
import { AuthModal } from '../pom/pages/AuthModal';
import { CheckoutPage } from '../pom/pages/CheckoutPage';
import { OrdersPage } from '../pom/pages/OrdersPage';

// Declare the types of your fixtures.
type MyFixtures = {
  homePage: HomePage;
  authPage: AuthModal;
  checkoutPage: CheckoutPage;
  ordersPage: OrdersPage;
};

// Extend base test by providing "todoPage" and "settingsPage".
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
export const test = base.extend<MyFixtures>({
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
});
export { expect } from '@playwright/test';
