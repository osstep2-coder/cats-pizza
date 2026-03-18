import { expect, type Page } from '@playwright/test';

export class CheckoutPage {
  constructor(private page: Page) {
    this.page = page;
  }

  async signInInCheckout(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Пароль').fill(password);
    await this.page.getByTestId('signInOrSignUpButton').click();
  }

  async fillAddress(address: {
    city: string;
    street: string;
    house: string;
    apartment: string;
    comment: string;
  }) {
    await this.page.getByLabel('Город').fill(address.city);
    await this.page.getByLabel('Улица').fill(address.street);
    await this.page.getByLabel('Дом').fill(address.house);
    await this.page.getByLabel('Квартира').fill(address.apartment);
    await this.page.getByLabel('Комментарий курьеру').fill(address.comment);
  }

  async submit() {
    await this.page.getByTestId('approveOrder').click();
    await expect(this.page.getByTestId('modalTitle')).toHaveText('Заказ оформлен');
    await this.page.getByTestId('closeSubmittedModalButton').click();
  }
  async submitWithoutAdress() {
    await this.page.getByTestId('approveOrder').click();
  }
  async assertCheckoutOpened() {
    await expect(this.page.getByTestId('modalTitle')).toHaveText('Оформление доставки');
  }
  async assertValidationError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
