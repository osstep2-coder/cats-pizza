import { guestTest as test } from '../../../fixtures/app.fixture';

test('Sign in modal has correct view', async ({ homePage, authPage }) => {
  await homePage.open();
  await authPage.open();
  await authPage.assertSignInModalHasCorrectView();
});
test('Sign up modal has correct view', async ({ homePage, authPage }) => {
  await homePage.open();
  await authPage.open();
  await authPage.openRegisterButton();
  await authPage.assertSignUpModalHasCorrectView();
});
