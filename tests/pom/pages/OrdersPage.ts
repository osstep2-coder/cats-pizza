import { expect, type Page } from '@playwright/test';
import { OrdersApi } from '../api/mockApi/OrdersApi';
import { AuthApi } from '../api/mockApi/AuthApi';

export class OrdersPage {
  constructor(private page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.getByTestId('openOrdersButton').click();
  }

  async openPage() {
    await this.page.goto('/orders');
  }

  async setupApiWithOneItem() {
    const ordersApi = new OrdersApi(this.page);
    const authApi = new AuthApi(this.page);
    await ordersApi.setOrdersWithOneItem();
    await authApi.setupAuth();
  }
  async setupApiEmptyItems() {
    const ordersApi = new OrdersApi(this.page);
    const authApi = new AuthApi(this.page);
    await ordersApi.setEmtyOrders();
    await authApi.setupAuth();
  }

  async assertHasOrder() {
    await expect(this.page.getByTestId('ordersList').getByRole('listitem').first()).toBeVisible();
  }

  async assertHasCorrectPageViewWithOneOrder() {
    await expect(this.page).toHaveScreenshot('ordersListWithOneItem.png');
  }
  async assertHasCorrectPageViewEmptyOrdersList() {
    await expect(this.page).toHaveScreenshot('ordersEmptyList.png');
  }
}
