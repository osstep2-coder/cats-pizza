import express from 'express';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// В реальном приложении здесь могла бы быть БД.
// Пока что отдаем статический список котопицц и храним все в памяти.
const cats = [
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

// In-memory токены
const tokens = new Map(); // token -> userId

// Пользователи с простой файловой персистентностью
const DATA_DIR = path.join(process.cwd(), 'server-data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Директория с изображениями котопицц
const IMAGES_DIR = path.join(process.cwd(), 'pizza-images');

let users = [];

const loadUsersFromFile = async () => {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!existsSync(USERS_FILE)) {
      users = [];
      await writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
      return;
    }

    const raw = await readFile(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      users = parsed;
    } else {
      users = [];
    }
  } catch (err) {
    console.error('Failed to load users from file:', err);
    users = [];
  }
};

const saveUsersToFile = async () => {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    await writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save users to file:', err);
  }
};

// In-memory корзина и заказы
let guestCartItems = [];
let guestOrders = [];
const cartsByUser = new Map(); // userId -> CartItem[]
const ordersByUser = new Map(); // userId -> Order[]

// Убедимся, что директория для картинок существует и отдаем её как статику
if (!existsSync(IMAGES_DIR)) {
  mkdirSync(IMAGES_DIR, { recursive: true });
}
app.use('/static', express.static(IMAGES_DIR));

const getUserIdFromRequest = (req) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  return tokens.get(token) ?? null;
};

const getCartForReq = (req) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return { userId: null, items: guestCartItems };
  }

  const existing = cartsByUser.get(userId) ?? [];
  cartsByUser.set(userId, existing);
  return { userId, items: existing };
};

const setCartForReq = (req, newItems) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    guestCartItems = newItems;
  } else {
    cartsByUser.set(userId, newItems);
  }
};

const getOrdersForReq = (req) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return { userId: null, orders: guestOrders };
  }

  const existing = ordersByUser.get(userId) ?? [];
  ordersByUser.set(userId, existing);
  return { userId, orders: existing };
};

const setOrdersForReq = (req, newOrders) => {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    guestOrders = newOrders;
  } else {
    ordersByUser.set(userId, newOrders);
  }
};

app.get('/api/cats', (_req, res) => {
  res.json(cats);
});

// Регистрация и авторизация (очень упрощенная)

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Необходимо указать имя, email и пароль' });
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
  }

  const user = {
    id: `user-${users.length + 1}`,
    name,
    email,
    password,
  };

  users.push(user);

  await saveUsersToFile();

  return res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Необходимо указать email и пароль' });
  }

  // На всякий случай убеждаемся, что пользователи загружены
  if (!users || users.length === 0) {
    await loadUsersFromFile();
  }

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  // Переносим гостевую корзину в корзину пользователя, если он только что залогинился
  if (guestCartItems && guestCartItems.length > 0) {
    const existingUserCart = cartsByUser.get(user.id) ?? [];
    const mergedCart = [...existingUserCart, ...guestCartItems];
    cartsByUser.set(user.id, mergedCart);
    guestCartItems = [];
  }

  const token = `token-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  tokens.set(token, user.id);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

// Корзина
// Формат элемента корзины: { id, name, basePrice, price, quantity, options }

app.get('/api/cart', (req, res) => {
  const { items } = getCartForReq(req);
  res.json({ items });
});

app.post('/api/cart/items', (req, res) => {
  const item = req.body;

  if (!item || !item.id || !item.name || typeof item.price !== 'number') {
    return res.status(400).json({ message: 'Некорректный формат элемента корзины' });
  }

  const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;

  const normalizeOptions = (options) => (options ? JSON.stringify(options) : '');
  const incomingKey = `${item.id}__${normalizeOptions(item.options)}`;

  const { items } = getCartForReq(req);

  const existing = items.find((cartItem) => {
    const key = `${cartItem.id}__${normalizeOptions(cartItem.options)}`;
    return key === incomingKey;
  });

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ ...item, quantity });
  }

  setCartForReq(req, items);

  res.status(201).json({ items });
});

app.patch('/api/cart/items/:id', (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (typeof quantity !== 'number') {
    return res.status(400).json({ message: 'quantity должен быть числом' });
  }

  const { items } = getCartForReq(req);

  const updated = items
    .map((item) => (item.id === id ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);

  setCartForReq(req, updated);

  res.json({ items: updated });
});

app.delete('/api/cart/items/:id', (req, res) => {
  const { id } = req.params;
  const { items } = getCartForReq(req);
  const updated = items.filter((item) => item.id !== id);
  setCartForReq(req, updated);
  res.status(204).send();
});

app.post('/api/cart/clear', (req, res) => {
  setCartForReq(req, []);
  res.status(204).send();
});

// Заказы
// Формат заказа: { id, items, totalPrice, createdAt, customer? }

app.post('/api/orders', (req, res) => {
  const { items, customer } = req.body || {};

  const { items: currentCart } = getCartForReq(req);
  const orderItems = Array.isArray(items) && items.length > 0 ? items : currentCart;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'Нельзя создать заказ с пустой корзиной' });
  }

  const totalPrice = orderItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0,
  );

  const { orders } = getOrdersForReq(req);

  const order = {
    id: `order-${orders.length + 1}`,
    items: orderItems,
    totalPrice,
    customer: customer || null,
    createdAt: new Date().toISOString(),
  };

  const updatedOrders = [...orders, order];
  setOrdersForReq(req, updatedOrders);
  setCartForReq(req, []);

  res.status(201).json(order);
});

app.get('/api/orders', (req, res) => {
  const { orders } = getOrdersForReq(req);
  res.json({ orders });
});

// Перед стартом сервера подгружаем пользователей из файла
loadUsersFromFile().finally(() => {
  app.listen(port, () => {
    console.log(`Cat pizza backend listening on http://localhost:${port}`);
  });
});
