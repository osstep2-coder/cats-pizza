## README для проекта `web-pizza`

---

# Web Pizza (Cat Pizza Shop)

Учебный проект интернет‑магазина «пиццы из котиков» на стеке **React + TypeScript + Vite** с простым backend на **Express**.  
Приложение позволяет просматривать «котиков‑пиццы», добавлять их в корзину, оформлять заказ и просматривать историю заказов с базовой авторизацией.

## Стек технологий

- **Frontend**
  - React
  - TypeScript
  - React Router DOM
  - Vite
- **Backend**
  - Node.js
  - Express
- **Прочее**
  - ESLint (настройки для React/TS)
  - `lowdb` для локальной персистентности backend-состояния в `server-data/db.json`
  - Гостевая сессия в `HttpOnly` cookie, токены и корзины в persistent storage

## Возможности приложения

- **Каталог котиков**
  - Получение списка котиков с бэкенда по `/api/cats`
  - Карточки с выбором опций (шерсть, активность, дополнительные «топпинги»)

- **Корзина**
  - Добавление товара с конкретными опциями (`CartContext`)
  - Поддержка гостей и авторизованных пользователей
  - Изменение количества, удаление товара, очистка корзины
  - Синхронизация с backend `/api/cart`, `/api/cart/items`, `/api/cart/clear`
  - Изоляция гостевой корзины по cookie-сессии вместо общей памяти процесса

- **Оформление заказа**
  - Страница `CheckoutPage` и модальное окно `CheckoutModal`
  - Валидация адреса (город, улица, дом)
  - Выбор способа оплаты (карта / наличные)
  - Отправка заказа на бэкенд `/api/orders`
  - Очистка корзины после успешного оформления

- **Авторизация**
  - Регистрация пользователя `/api/register`
  - Логин `/api/login`
  - Хранение токена и пользователя в `localStorage` (`AuthContext`)
  - Перенос гостевой корзины в корзину пользователя при логине
  - Токены backend-сессии сохраняются в `server-data/db.json`, поэтому не теряются при рестарте сервера

- **История заказов**
  - Страница `OrdersPage`
  - Получение заказов по `/api/orders`
  - Отображение списка заказов с датой, суммой и составом

## Структура проекта

```text
web-pizza/
  server/
    app.mjs             # createApp(...) и lowdb-backed storage для API
    index.mjs           # Bootstrap сервера и запуск app.listen(...)
    seeds/
      users.json        # Коммитимый seed пользователей для пустой db.json
  server-data/
    db.json             # lowdb-хранилище cats/users/sessions/carts/orders
    users.json          # Локальный runtime-файл, не используется как seed в CI
  pizza-images/         # Картинки котиков, раздаются как статика /static
  src/
    auth/
      AuthContext.tsx   # Контекст авторизации, хранение user + token
    cart/
      CartContext.tsx   # Контекст корзины, работа с /api/cart
    components/
      auth/             # Модальные окна авторизации и оформления заказа
      cats/             # Компоненты каталога котиков
    pages/
      HomePage.tsx      # Главная страница с котиками
      CartPage.tsx      # Страница корзины
      CheckoutPage.tsx  # Страница оформления заказа
      OrdersPage.tsx    # История заказов
    App.tsx             # Маршрутизация и основные layout-компоненты
    main.tsx            # Точка входа фронтенда
```

## Установка и запуск

### Требования

- Node.js (актуальная LTS‑версия)
- npm

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

Frontend (Vite):

```bash
npm run dev
# по умолчанию http://localhost:5173
```

Backend (Express):

```bash
npm run dev:server
# по умолчанию http://localhost:3001
```

Оба сервера одновременно (удобно для разработки):

```bash
npm run dev:all
```

### Сборка production‑версии frontend

```bash
npm run build
```

### Предпросмотр собранного фронта

```bash
npm run preview
```

## API (кратко)

- `GET /api/cats` — список котиков
- `POST /api/register` — регистрация пользователя
- `POST /api/login` — логин, возвращает `token` и `user`
- `DELETE /api/users/by-email` — удалить пользователя по email (тело запроса: `{ "email": string }`, ответ: `{ deletedUsersCount, deletedOrdersCount }`)
- `GET /api/cart` — текущая корзина
- `POST /api/cart/items` — добавить товар в корзину
- `PATCH /api/cart/items/:id` — изменить количество
- `DELETE /api/cart/items/:id` — удалить товар
- `POST /api/cart/clear` — очистить корзину
- `POST /api/orders` — создать заказ (из тела запроса или текущей корзины)
- `GET /api/orders` — получить заказы текущего пользователя или гостя
- `DELETE /api/orders/by-email` — удалить все заказы пользователя по email (тело запроса: `{ "email": string }`, ответ: `{ deletedCount }`)

Авторизация реализована через токен в заголовке `Authorization: Bearer <token>`. Токен хранится в `localStorage` на фронтенде, а серверная сессия и данные корзины/заказов сохраняются в `server-data/db.json`. Для гостя backend создаёт `HttpOnly` cookie `guestSessionId`, чтобы корзина и история заказов были изолированы между браузерами и тестами.

## Разработка

- Линтинг:

```bash
npm run lint
```

- Основная бизнес‑логика фронтенда сосредоточена в контекстах:
  - `src/auth/AuthContext.tsx`
  - `src/cart/CartContext.tsx`

---
