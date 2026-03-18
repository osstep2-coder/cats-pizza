import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

import { createApp, createJsonDataStore } from './app.mjs';

const createTestServer = async (dataDir) => {
  const imagesDir = path.join(dataDir, 'pizza-images');
  await mkdir(imagesDir, { recursive: true });

  const store = createJsonDataStore({ dataDir, imagesDir });
  await store.init();

  const app = createApp({ store, now: () => '2026-03-18T12:00:00.000Z' });
  const server = createServer(app);

  await new Promise((resolve) => {
    server.listen(0, resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to resolve test server address');
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      });
    },
  };
};

const getCookieHeader = (response) => {
  const setCookie = response.headers.get('set-cookie');
  return setCookie ? setCookie.split(';', 1)[0] : '';
};

test('guest carts are isolated by guest session cookie', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'web-pizza-guest-'));
  const server = await createTestServer(tempDir);

  try {
    const guestAInit = await fetch(`${server.baseUrl}/api/cart`);
    const guestACookie = getCookieHeader(guestAInit);
    assert.ok(guestACookie.startsWith('guestSessionId='));

    const guestBInit = await fetch(`${server.baseUrl}/api/cart`);
    const guestBCookie = getCookieHeader(guestBInit);
    assert.ok(guestBCookie.startsWith('guestSessionId='));
    assert.notEqual(guestACookie, guestBCookie);

    const addResponse = await fetch(`${server.baseUrl}/api/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: guestACookie,
      },
      body: JSON.stringify({
        id: 'cat-1',
        name: 'Маргарита',
        basePrice: 3500,
        price: 3500,
        quantity: 1,
      }),
    });

    assert.equal(addResponse.status, 201);

    const guestAState = await fetch(`${server.baseUrl}/api/cart`, {
      headers: { Cookie: guestACookie },
    }).then((response) => response.json());
    const guestBState = await fetch(`${server.baseUrl}/api/cart`, {
      headers: { Cookie: guestBCookie },
    }).then((response) => response.json());

    assert.equal(guestAState.items.length, 1);
    assert.equal(guestBState.items.length, 0);
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('auth sessions and carts survive server restart with the same data dir', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'web-pizza-session-'));
  const email = 'restart@example.com';
  const password = 'qwerty123';
  let token = '';

  let server = await createTestServer(tempDir);

  try {
    const registerResponse = await fetch(`${server.baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Restart User',
        email,
        password,
      }),
    });
    assert.equal(registerResponse.status, 201);

    const loginResponse = await fetch(`${server.baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(loginResponse.status, 200);

    const loginData = await loginResponse.json();
    token = loginData.token;
    assert.ok(token.startsWith('token-'));

    const addResponse = await fetch(`${server.baseUrl}/api/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: 'cat-2',
        name: 'Пепперони',
        basePrice: 4200,
        price: 4200,
        quantity: 2,
      }),
    });
    assert.equal(addResponse.status, 201);
  } finally {
    await server.close();
  }

  server = await createTestServer(tempDir);

  try {
    const cartState = await fetch(`${server.baseUrl}/api/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => response.json());

    assert.equal(cartState.items.length, 1);
    assert.equal(cartState.items[0].id, 'cat-2');
    assert.equal(cartState.items[0].quantity, 2);
  } finally {
    await server.close();
    await rm(tempDir, { recursive: true, force: true });
  }
});
