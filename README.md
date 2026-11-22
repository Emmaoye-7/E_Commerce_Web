# Morrow E-Commerce

A responsive storefront and a Node.js API backed by MongoDB.

## Features

- Product browsing, filtering, search, sorting, and a local browser shopping bag
- MongoDB-backed product catalog, user accounts, carts, and orders
- Password hashing and JWT bearer-token authentication
- Administrator-only product creation, updates, and deletion
- Transactional order creation with price snapshots and a configurable shipping fee
- Responsive storefront with product search, category filters, sorting, and product details
- Browser-local shopping bag

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

## Deploy to Render

The included `render.yaml` configures one Render web service to serve both the storefront and API. MongoDB must be hosted separately; MongoDB Atlas is one option.

1. Create a MongoDB Atlas database and a database user with a strong password. Render's free web services do not provide static outbound IPs. For a free deployment, Atlas network access may need `0.0.0.0/0`, which permits network connections from any IP; protect the database with a strong unique password, least-privilege database user, and TLS. For stricter IP allowlisting, use a hosting plan with fixed egress IPs.
2. Push this project to GitHub, then in Render choose **New → Blueprint** and select the repository containing `render.yaml`.
3. In the Blueprint environment prompt, set `MONGODB_URI` to the full Atlas connection URI (it must begin with `mongodb+srv://` or `mongodb://`; do not enter only the database password). Render generates `JWT_SECRET`. Do not commit these secrets.
4. Deploy the Blueprint and wait for the service health check to pass. The Render URL serves the storefront; API endpoints use the same domain under `/api`.
5. To seed the catalog and provision an administrator, set `MONGODB_URI`, `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD` (10–72 characters) in your local, git-ignored `.env`, then run `npm run seed` from this project. Confirm products appear at `/api/products`, then sign in through `/api/auth/login` with the configured admin credentials and test a protected route.
6. Run `npm test` locally before pushing changes. After deployment, verify the Render URL, `/api/health`, product listing, registration/login, cart, and order flows. Order placement requires Atlas transaction support.

The storefront's shopping bag and checkout button are still browser-local/demo behavior; they are not yet connected to the API's authenticated cart and order endpoints. Production API checkout must be tested separately until that frontend integration is added. No payment provider is configured.

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

## Description

Morrow is a lightweight e-commerce web app designed to mimic a premium lifestyle brand storefront. It focuses on a refined shopping experience with simple navigation, product discovery tools, and a convenient bag experience for everyday online shopping.
