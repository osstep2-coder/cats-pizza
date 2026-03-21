import { guestTest as test } from '../../../fixtures/app.fixture';

test('Orders page empty state', async ({ ordersPage }) => {
  await ordersPage.setupApiEmptyItems();
  await ordersPage.openPage();
  await ordersPage.assertHasCorrectPageViewEmptyOrdersList();
});

test('Orders page with items', async ({ ordersPage }) => {
  await ordersPage.setupApiWithOneItem();
  await ordersPage.openPage();
  await ordersPage.assertHasCorrectPageViewWithOneOrder();
});
