import { expect, Page } from '@playwright/test';

export class CartPage {
  constructor(private page: Page) {
    this.page = page;
  }
  async open() {
    await this.page.goto('/cart');
  }
  async assertEmpty() {
    await expect(
      this.page.getByText('Корзина пуста. Добавьте котика с главной страницы.'),
    ).toBeVisible();
  }
  async assertCatCounter(value: string) {
    await expect(this.page.getByTestId('itemCounter')).toHaveValue(value);
  }
  async removeFirstItem() {
    await this.page.getByRole('button', { name: 'удалить' }).first().click();
  }
  async clear() {
    await this.page.getByRole('button', { name: 'Очистить корзину' }).click();
  }
  async addOneMoreSameCat() {
    await this.page.getByRole('button', { name: '+' }).click();
  }
}
