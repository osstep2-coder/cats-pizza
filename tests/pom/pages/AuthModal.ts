import { expect, type Page } from '@playwright/test';

export class AuthModal {
  constructor(private page: Page) {
    this.page = page;
  }

  async open() {
    await this.page.getByTestId('signInButton').click();
  }

  async openRegisterButton() {
    await this.page.getByTestId('registerButton').click();
  }
  async signIn(email: string, password: string) {
    await this.open();
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Пароль').fill(password);
    await this.page.getByTestId('signInOrSignUpButton').click();
  }

  async signUp(name: string, email: string, password: string) {
    await this.open();
    await this.openRegisterButton();
    await this.page.getByLabel('Имя').fill(name);
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Пароль:', { exact: true }).fill(password);
    await this.page.getByLabel('Повторите пароль:', { exact: true }).fill(password);
    await this.page.getByTestId('signInOrSignUpButton').click();
  }

  async assertSignedIn() {
    await expect(this.page.getByTestId('signOutButton')).toBeVisible();
  }
}
