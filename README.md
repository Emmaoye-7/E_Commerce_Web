# Morrow E-Commerce

A responsive storefront and a Node.js API backed by MongoDB.

## Features

- Product browsing, filtering, search, sorting, and a local browser shopping bag
- MongoDB-backed product catalog, user accounts, carts, and orders
- Password hashing and JWT bearer-token authentication
- Administrator-only product creation, updates, and deletion
- Transactional order creation with price snapshots and a configurable shipping fee

## Run the storefront

Open `index.html` directly in a browser, or serve this folder:

```bash
python -m http.server 8000
```

Visit `http://localhost:8000`.

## Run the API

Requirements: Node.js 18+ and MongoDB. Order creation uses MongoDB transactions, so use MongoDB Atlas or a local MongoDB replica set.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and the admin credentials.
3. Configure `CLIENT_ORIGIN` to the storefront origin. For local Python hosting, the example uses `http://localhost:8000`.
4. Seed the storefront catalog and provision the administrator with `npm run seed`.
5. Start the API with `npm run dev` (or `npm start` for a normal run). It listens on port `3000` by default.

Run the API checks with `npm test`.

The seed command inserts the eight products already shown in the storefront without overwriting existing products. If both admin environment variables are set, it creates the admin account or grants admin role to that email. Keep `.env` private. The default order shipping fee is `$8`, with free shipping at `$75` or more; set `SHIPPING_FEE` to change the fee.

## API

All responses use JSON. Send protected requests with `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | Public | Health check |
| `POST` | `/api/auth/register` | Public | Register with `{ "name", "email", "password" }` |
| `POST` | `/api/auth/login` | Public | Sign in with `{ "email", "password" }` |
| `GET` | `/api/auth/me` | Signed in | Read the current account |
| `GET` | `/api/products` | Public | List products |
| `GET` | `/api/products/:id` | Public | Read one product |
| `POST` | `/api/products` | Admin | Add product; include its string `id` and product fields |
| `PATCH` | `/api/products/:id` | Admin | Update product fields |
| `DELETE` | `/api/products/:id` | Admin | Delete product and remove it from carts |
| `GET` | `/api/cart` | Signed in | Read the current user's cart |
| `POST` | `/api/cart/items` | Signed in | Add `{ "productId", "quantity" }` (quantity defaults to 1) |
| `PATCH` | `/api/cart/items/:productId` | Signed in | Set `{ "quantity" }` |
| `DELETE` | `/api/cart/items/:productId` | Signed in | Remove a cart item |
| `DELETE` | `/api/cart` | Signed in | Empty the cart |
| `POST` | `/api/orders` | Signed in | Create an order from the cart with a `shippingAddress` |
| `GET` | `/api/orders` | Signed in | List the current user's orders |
| `GET` | `/api/orders/:id` | Signed in | Read one of the current user's orders |

Product fields: `name`, `category`, `price`, `description`, `image`, and `alt`; `badge` is optional. The API assigns new accounts the customer role; the role cannot be set through registration. Orders are created with `pending` status. No payment provider is integrated.

## Project structure

- `index.html`, `styles.css`, `script.js` — static storefront
- `server.js`, `src/` — API server, routes, middleware, and MongoDB models
- `scripts/seed.js` — initial catalog and administrator setup
