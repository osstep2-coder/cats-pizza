import express from 'express';
import { readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const initialCats = [
  {
    id: 'cat-1',
    name: 'Маргарита',
    price: 3500,
    description: 'Классический ласковый котик для уютных вечеров.',
    imageUrl: '/static/1.jpg',
  },
  {
    id: 'cat-2',
    name: 'Пепперони',
    price: 4200,
    description: 'Очень активный котик, всегда в движении.',
    imageUrl: '/static/2.jpg',
  },
  {
    id: 'cat-3',
    name: 'Четыре сыра',
    price: 5100,
    description: 'Мягкий, пушистый и обнимабельный.',
    imageUrl: '/static/3.jpg',
  },
  {
    id: 'cat-4',
    name: 'Ветчина и грибы',
    price: 3900,
    description: 'Игривый котик, любит активные игры и компанию.',
    imageUrl: '/static/4.jpg',
  },
  {
    id: 'cat-5',
    name: 'Барбекю',
    price: 4400,
    description: 'Котик с ярким характером, но очень преданный.',
    imageUrl: '/static/5.jpg',
  },
  {
    id: 'cat-6',
    name: 'Гавайская',
    price: 3800,
    description: 'Солнечный и дружелюбный котик, любит внимание.',
    imageUrl: '/static/6.jpg',
  },
  {
    id: 'cat-7',
    name: 'Мясная',
    price: 4600,
    description: 'Крупный котик, любит поесть и долго спать.',
    imageUrl: '/static/7.jpg',
  },
  {
    id: 'cat-8',
    name: 'Диабло',
    price: 4700,
    description: 'Очень энергичный котик, идеален для активных хозяев.',
    imageUrl: '/static/8.jpg',
  },
  {
    id: 'cat-9',
    name: 'Четыре сезона',
    price: 4300,
    description: 'Универсальный котик, подойдёт под любое настроение.',
    imageUrl: '/static/9.jpg',
  },
];

const defaultDbData = () => ({
  cats: [],
  users: [],
  orders: [],
  sessions: [],
  carts: [],
});

const GUEST_SESSION_COOKIE = 'guestSessionId';
const GUEST_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const parseNumericSuffix = (value, prefix) => {
  if (typeof value !== 'string' || !value.startsWith(prefix)) return null;
  const raw = value.slice(prefix.length);
  const num = Number.parseInt(raw, 10);
  return Number.isFinite(num) ? num : null;
};

const nextId = (prefix, items) => {
  const max = (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const n = parseNumericSuffix(item?.id, prefix);
    return n !== null && n > acc ? n : acc;
  }, 0);
  return `${prefix}${max + 1}`;
};

const normalizeOptions = (options) => (options ? JSON.stringify(options) : '');

const mergeCartItems = (existingItems, incomingItems) => {
  const merged = (existingItems ?? []).map((item) => ({ ...item }));

  for (const item of incomingItems ?? []) {
    const itemKey = `${item.id}__${normalizeOptions(item.options)}`;
    const match = merged.find((cartItem) => {
      const key = `${cartItem.id}__${normalizeOptions(cartItem.options)}`;
      return key === itemKey;
    });

    if (match) {
      match.quantity += item.quantity ?? 1;
    } else {
      merged.push({ ...item });
    }
  }

  return merged;
};

const parseCookies = (header = '') =>
  header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex < 0) {
        return acc;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      if (!key) {
        return acc;
      }

      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});

const serializeCookie = (name, value, options = {}) => {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  parts.push(`Path=${options.path ?? '/'}`);
  parts.push(`SameSite=${options.sameSite ?? 'Lax'}`);

  if (options.httpOnly !== false) {
    parts.push('HttpOnly');
  }

  if (options.secure) {
    parts.push('Secure');
  }

  return parts.join('; ');
};

const appendSetCookieHeader = (res, cookie) => {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookie);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie]);
    return;
  }

  res.setHeader('Set-Cookie', [existing, cookie]);
};

export const createJsonDataStore = ({
  dataDir = path.join(process.cwd(), 'server-data'),
  dbFile = path.join(dataDir, 'db.json'),
  usersFile = path.join(dataDir, 'users.json'),
  imagesDir = path.join(process.cwd(), 'pizza-images'),
} = {}) => {
  const adapter = new JSONFile(dbFile);
  const db = new Low(adapter, defaultDbData());
  let queue = Promise.resolve();

  const ensureDbShape = () => {
    if (!db.data) {
      db.data = defaultDbData();
    }

    if (!Array.isArray(db.data.cats)) db.data.cats = [];
    if (!Array.isArray(db.data.users)) db.data.users = [];
    if (!Array.isArray(db.data.orders)) db.data.orders = [];
    if (!Array.isArray(db.data.sessions)) db.data.sessions = [];
    if (!Array.isArray(db.data.carts)) db.data.carts = [];

    for (const order of db.data.orders) {
      if (order?.ownerType && order?.ownerId) {
        continue;
      }

      if (order?.userId) {
        order.ownerType = 'user';
        order.ownerId = order.userId;
      } else if (order?.guestSessionId) {
        order.ownerType = 'guest';
        order.ownerId = order.guestSessionId;
      }
    }
  };

  const runSerialized = async (operation) => {
    const result = queue.then(operation, operation);
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };

  const loadDb = async () => {
    await db.read();
    ensureDbShape();
  };

  const writeDb = async () => {
    ensureDbShape();
    await db.write();
  };

  const findCartRecord = (ownerType, ownerId) =>
    db.data.carts.find((cart) => cart.ownerType === ownerType && cart.ownerId === ownerId) ?? null;

  return {
    async init() {
      await runSerialized(async () => {
        if (!existsSync(dataDir)) {
          mkdirSync(dataDir, { recursive: true });
        }

        if (!existsSync(imagesDir)) {
          mkdirSync(imagesDir, { recursive: true });
        }

        await loadDb();

        if (db.data.users.length === 0 && existsSync(usersFile)) {
          try {
            const raw = await readFile(usersFile, 'utf8');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              db.data.users = parsed;
            }
          } catch (err) {
            console.error('Failed to migrate users.json to db.json:', err);
          }
        }

        if (db.data.cats.length === 0) {
          db.data.cats = initialCats;
        }

        await writeDb();
      });
    },

    getImagesDir() {
      return imagesDir;
    },

    async listCats() {
      return runSerialized(async () => {
        await loadDb();
        return db.data.cats.map((cat) => ({ ...cat }));
      });
    },

    async findUserByEmail(email) {
      return runSerialized(async () => {
        await loadDb();
        return db.data.users.find((user) => user.email === email) ?? null;
      });
    },

    async findUserByEmailAndPassword(email, password) {
      return runSerialized(async () => {
        await loadDb();
        return db.data.users.find((user) => user.email === email && user.password === password) ?? null;
      });
    },

    async createUser({ name, email, password }) {
      return runSerialized(async () => {
        await loadDb();

        const user = {
          id: nextId('user-', db.data.users),
          name,
          email,
          password,
        };

        db.data.users.push(user);
        await writeDb();
        return user;
      });
    },

    async createSession(userId) {
      return runSerialized(async () => {
        await loadDb();

        const session = {
          token: `token-${randomUUID()}`,
          userId,
          createdAt: new Date().toISOString(),
        };

        db.data.sessions.push(session);
        await writeDb();
        return session;
      });
    },

    async findSessionByToken(token) {
      return runSerialized(async () => {
        await loadDb();
        return db.data.sessions.find((session) => session.token === token) ?? null;
      });
    },

    async getCart(ownerType, ownerId) {
      return runSerialized(async () => {
        await loadDb();
        return findCartRecord(ownerType, ownerId)?.items.map((item) => ({ ...item })) ?? [];
      });
    },

    async setCart(ownerType, ownerId, items) {
      return runSerialized(async () => {
        await loadDb();

        const record = findCartRecord(ownerType, ownerId);
        if (record) {
          record.items = items.map((item) => ({ ...item }));
        } else {
          db.data.carts.push({
            ownerType,
            ownerId,
            items: items.map((item) => ({ ...item })),
          });
        }

        await writeDb();
        return items;
      });
    },

    async mergeCart(fromOwnerType, fromOwnerId, toOwnerType, toOwnerId) {
      return runSerialized(async () => {
        await loadDb();

        const fromRecord = findCartRecord(fromOwnerType, fromOwnerId);
        if (!fromRecord || fromRecord.items.length === 0) {
          return findCartRecord(toOwnerType, toOwnerId)?.items.map((item) => ({ ...item })) ?? [];
        }

        const toRecord = findCartRecord(toOwnerType, toOwnerId);
        const mergedItems = mergeCartItems(toRecord?.items ?? [], fromRecord.items);

        if (toRecord) {
          toRecord.items = mergedItems;
        } else {
          db.data.carts.push({
            ownerType: toOwnerType,
            ownerId: toOwnerId,
            items: mergedItems,
          });
        }

        fromRecord.items = [];
        await writeDb();
        return mergedItems.map((item) => ({ ...item }));
      });
    },

    async listOrders(ownerType, ownerId) {
      return runSerialized(async () => {
        await loadDb();
        return db.data.orders
          .filter((order) => order.ownerType === ownerType && order.ownerId === ownerId)
          .map((order) => ({ ...order }));
      });
    },

    async createOrder({ ownerType, ownerId, userId, guestSessionId, items, totalPrice, customer, now }) {
      return runSerialized(async () => {
        await loadDb();

        const order = {
          id: nextId('order-', db.data.orders),
          ownerType,
          ownerId,
          userId: userId ?? null,
          guestSessionId: guestSessionId ?? null,
          items: items.map((item) => ({ ...item })),
          totalPrice,
          customer: customer || null,
          createdAt: now,
        };

        db.data.orders.push(order);
        await writeDb();
        return order;
      });
    },

    async deleteUserByEmail(email) {
      return runSerialized(async () => {
        await loadDb();

        const user = db.data.users.find((entry) => entry.email === email);
        if (!user) {
          return null;
        }

        const beforeUsersCount = db.data.users.length;
        db.data.users = db.data.users.filter((entry) => entry.id !== user.id);
        const deletedUsersCount = beforeUsersCount - db.data.users.length;

        const beforeOrdersCount = db.data.orders.length;
        db.data.orders = db.data.orders.filter((order) => order.ownerType !== 'user' || order.ownerId !== user.id);
        const deletedOrdersCount = beforeOrdersCount - db.data.orders.length;

        db.data.carts = db.data.carts.filter((cart) => cart.ownerType !== 'user' || cart.ownerId !== user.id);
        db.data.sessions = db.data.sessions.filter((session) => session.userId !== user.id);

        await writeDb();

        return { user, deletedUsersCount, deletedOrdersCount };
      });
    },

    async deleteOrdersByEmail(email) {
      return runSerialized(async () => {
        await loadDb();

        const user = db.data.users.find((entry) => entry.email === email);
        if (!user) {
          return null;
        }

        const beforeCount = db.data.orders.length;
        db.data.orders = db.data.orders.filter((order) => order.ownerType !== 'user' || order.ownerId !== user.id);
        const deletedCount = beforeCount - db.data.orders.length;

        await writeDb();
        return { user, deletedCount };
      });
    },
  };
};

const getTokenFromRequest = (req) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice('Bearer '.length).trim() || null;
};

const ensureGuestSession = (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const existing = cookies[GUEST_SESSION_COOKIE];
  if (existing) {
    return existing;
  }

  const guestSessionId = `guest-${randomUUID()}`;
  appendSetCookieHeader(
    res,
    serializeCookie(GUEST_SESSION_COOKIE, guestSessionId, {
      httpOnly: true,
      maxAge: GUEST_SESSION_MAX_AGE_SECONDS,
      path: '/',
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    }),
  );
  return guestSessionId;
};

const resolveActor = async (store, req, res) => {
  const token = getTokenFromRequest(req);
  if (token) {
    const session = await store.findSessionByToken(token);
    if (session?.userId) {
      return {
        ownerType: 'user',
        ownerId: session.userId,
        userId: session.userId,
        guestSessionId: null,
      };
    }
  }

  const guestSessionId = ensureGuestSession(req, res);
  return {
    ownerType: 'guest',
    ownerId: guestSessionId,
    userId: null,
    guestSessionId,
  };
};

export const createApp = ({ store, now = () => new Date().toISOString() } = {}) => {
  if (!store) {
    throw new Error('createApp requires a store');
  }

  const app = express();

  app.use(express.json());
  app.use('/static', express.static(store.getImagesDir()));

  app.get('/api/cats', async (_req, res) => {
    const cats = await store.listCats();
    res.json(cats);
  });

  app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Необходимо указать имя, email и пароль' });
    }

    const existing = await store.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const user = await store.createUser({ name, email, password });
    return res.status(201).json({ id: user.id, name: user.name, email: user.email });
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Необходимо указать email и пароль' });
    }

    const user = await store.findUserByEmailAndPassword(email, password);
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const cookies = parseCookies(req.headers.cookie);
    const guestSessionId = cookies[GUEST_SESSION_COOKIE];
    if (guestSessionId) {
      await store.mergeCart('guest', guestSessionId, 'user', user.id);
    }

    const session = await store.createSession(user.id);

    return res.json({
      token: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  });

  app.delete('/api/users/by-email', async (req, res) => {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Необходимо указать email' });
    }

    const result = await store.deleteUserByEmail(email);
    if (!result) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.json({
      deletedUsersCount: result.deletedUsersCount,
      deletedOrdersCount: result.deletedOrdersCount,
    });
  });

  app.get('/api/cart', async (req, res) => {
    const actor = await resolveActor(store, req, res);
    const items = await store.getCart(actor.ownerType, actor.ownerId);
    res.json({ items });
  });

  app.post('/api/cart/items', async (req, res) => {
    const item = req.body;

    if (!item || !item.id || !item.name || typeof item.price !== 'number') {
      return res.status(400).json({ message: 'Некорректный формат элемента корзины' });
    }

    const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
    const actor = await resolveActor(store, req, res);
    const items = await store.getCart(actor.ownerType, actor.ownerId);
    const incomingKey = `${item.id}__${normalizeOptions(item.options)}`;

    const existing = items.find((cartItem) => {
      const key = `${cartItem.id}__${normalizeOptions(cartItem.options)}`;
      return key === incomingKey;
    });

    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ ...item, quantity });
    }

    await store.setCart(actor.ownerType, actor.ownerId, items);
    res.status(201).json({ items });
  });

  app.patch('/api/cart/items/:id', async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body || {};

    if (typeof quantity !== 'number') {
      return res.status(400).json({ message: 'quantity должен быть числом' });
    }

    const actor = await resolveActor(store, req, res);
    const items = await store.getCart(actor.ownerType, actor.ownerId);
    const updated = items
      .map((item) => (item.id === id ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);

    await store.setCart(actor.ownerType, actor.ownerId, updated);
    res.json({ items: updated });
  });

  app.delete('/api/cart/items/:id', async (req, res) => {
    const { id } = req.params;
    const actor = await resolveActor(store, req, res);
    const items = await store.getCart(actor.ownerType, actor.ownerId);
    const updated = items.filter((item) => item.id !== id);
    await store.setCart(actor.ownerType, actor.ownerId, updated);
    res.status(204).send();
  });

  app.post('/api/cart/clear', async (req, res) => {
    const actor = await resolveActor(store, req, res);
    await store.setCart(actor.ownerType, actor.ownerId, []);
    res.status(204).send();
  });

  app.post('/api/orders', async (req, res) => {
    const { items, customer } = req.body || {};
    const actor = await resolveActor(store, req, res);
    const currentCart = await store.getCart(actor.ownerType, actor.ownerId);
    const orderItems = Array.isArray(items) && items.length > 0 ? items : currentCart;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Нельзя создать заказ с пустой корзиной' });
    }

    const totalPrice = orderItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0,
    );

    try {
      const order = await store.createOrder({
        ownerType: actor.ownerType,
        ownerId: actor.ownerId,
        userId: actor.userId,
        guestSessionId: actor.guestSessionId,
        items: orderItems,
        totalPrice,
        customer,
        now: now(),
      });

      await store.setCart(actor.ownerType, actor.ownerId, []);
      res.status(201).json(order);
    } catch (err) {
      console.error('Failed to create order:', err);
      res.status(500).json({ message: 'Не удалось создать заказ' });
    }
  });

  app.get('/api/orders', async (req, res) => {
    const actor = await resolveActor(store, req, res);
    const orders = await store.listOrders(actor.ownerType, actor.ownerId);
    res.json({ orders });
  });

  app.delete('/api/orders/by-email', async (req, res) => {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ message: 'Необходимо указать email' });
    }

    const result = await store.deleteOrdersByEmail(email);
    if (!result) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.json({ deletedCount: result.deletedCount });
  });

  return app;
};
