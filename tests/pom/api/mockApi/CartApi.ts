import { Page } from '@playwright/test';
import { cartWithOneItem, emtyCart } from '../../mockData/cart';

export class CartApi {
  constructor(private page: Page) {
    this.page = page;
  }
  async setCartWithOneItem() {
    await this.page.route('*/**/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(cartWithOneItem),
      });
    });
  }
  async setEmtyCart() {
    await this.page.route('*/**/api/cart', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(emtyCart),
      });
    });
  }
}
