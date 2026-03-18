import { guestTest as test } from '../../fixtures/app.fixture';
import { CleanupApi } from '../api/CleanupApi';
import { testUsers, testAdress } from '../data/testData';

test.describe('Orders', () => {
  test.describe.configure({ mode: 'serial' });
  test.afterEach(async ({ request }) => {
    const cleanupApi = new CleanupApi(request);
    await cleanupApi.deleteOrdersByEmail(testUsers.existing.email);
  });

  test('Make order with login in checkout', async ({ homePage, checkoutPage, ordersPage }) => {
    await homePage.open();
    await homePage.addFirstCatToCart();
    await homePage.goToCheckoutFromCart();
    await checkoutPage.signInInCheckout(testUsers.existing.email, testUsers.existing.password);
    await checkoutPage.fillAddress(testAdress);
    await checkoutPage.submit();
    await ordersPage.open();
    await ordersPage.assertHasOrder();
  });
});
