import { guestTest as test } from '../../fixtures/app.fixture';
import { CleanupApi } from '../api/CleanupApi';
import { testUsers } from '../data/testData';

test.describe('Auth', () => {
  let createdUserEmail: string | null = null;

  test.afterAll(async ({ request }) => {
    if (!createdUserEmail) return;

    const cleanupApi = new CleanupApi(request);
    await cleanupApi.deleteUserByEmail(createdUserEmail);

    createdUserEmail = null;
  });

  test('Sign in', async ({ homePage, authPage }) => {
    await homePage.open();
    await authPage.signIn(testUsers.existing.email, testUsers.existing.password);
    await authPage.assertSignedIn();
  });

  test('Sign up', async ({ homePage, authPage }) => {
    createdUserEmail = `${Date.now()}@test.ru`;
    await homePage.open();
    await authPage.signUp('Тест', createdUserEmail, testUsers.existing.password);
    await authPage.assertSignedIn();
  });
});
