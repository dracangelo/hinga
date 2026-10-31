# SAMHIN — Your Nairobi Plant Haven

A full-stack e-commerce plant studio: a customer-facing storefront for potted plants and
flowering houseplants, plus an admin panel for running orders, products, customers, coupons
and reviews. Prices are in Kenyan shillings and checkout supports M-Pesa.

```
hinga/
├── server/      Express 5 API (SQLite via node:sqlite, hand-rolled auth)
└── web/         React 19 + Vite 8 + Tailwind CSS v4 storefront & admin
```

## Quick start

```bash
npm install          # installs both workspaces
npm run seed         # create + populate the database
npm run dev          # API on :4000, storefront on :5173
```

Open <http://localhost:5173>.

### Accounts & Administration

- **Customer registration & login**: Customers can sign up directly on `/register` and sign in on `/login`.
- **Administrator login**: Administrators can sign in directly at `/admin/login` or via the "Store administrator" tab on `/login`. When an admin signs in, they are automatically directed to `/admin`.
- **Administrator registration**: Gated behind `ADMIN_SIGNUP_CODE` at `/admin/register`. In development, this defaults to `samhin-admin` (and `hinga-admin`). In production, configure your own secret code in your environment variables.

## Scripts

| Command            | What it does                                                     |
| ------------------ | ---------------------------------------------------------------- |
| `npm run dev`      | Runs the API and the Vite dev server together                    |
| `npm run build`    | Builds the storefront into `web/dist`                             |
| `npm start`        | Runs the API alone; also serves `web/dist` when it exists        |
| `npm run seed`     | Seeds the database (no-op if already populated)                   |
| `npm run reset`    | Wipes and re-seeds the database                                   |

Per-workspace scripts: `npm run dev --workspace server`, `npm run build --workspace web`, etc.

## Configuration

Copy `.env.example` to `.env` in the repo root — the server loads it automatically at startup.

| Variable       | Default                       | Purpose                                  |
| -------------- | ----------------------------- | ---------------------------------------- |
| `PORT`         | `4000`                        | API port                                 |
| `JWT_SECRET`   | `hinga-dev-secret-change-me`  | Token signing key — **set this in prod** |
| `DB_PATH`      | `server/data/hinga.db`        | SQLite file location                     |
| `CORS_ORIGIN`  | any origin                    | Allowed browser origin                   |
| `ADMIN_SIGNUP_CODE` | `samhin-admin` (dev only) | Shared code required to sign up as an administrator. Unset in production disables admin sign-up. |

## Architecture

**Backend** — Express 5 on Node 24.

- **Database** — SQLite through Node's built-in `node:sqlite`. No native modules, no
  ORM. Schema and helpers live in `server/src/db.js`; money is stored in integer cents
  throughout and only converted to shillings at the API boundary.
- **Auth** — `scrypt` password hashing (per-user salt, `timingSafeEqual` comparison) and a
  hand-rolled HS256 JWT in `server/src/auth.js`. No `bcrypt`, no `jsonwebtoken`.
- **Orders** — status transitions are enforced server-side by `STATUS_FLOW` in
  `server/src/lib/helpers.js`. Cancelling restores product stock and decrements `sold_count`.
- **Pricing** — 16% VAT, free standard delivery over KSh 7,500, KSh 400 flat rate, KSh 800 express.

**Frontend** — React 19 with Vite 8 and Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first
config with `@theme` tokens in `web/src/index.css`). React Router v7 with lazy-loaded admin
routes. State lives in three contexts: `AuthContext`, `CartContext` and `ToastContext`.

**Carts** — guests shop with a cart in `localStorage`; on sign-in the guest cart is merged
into the server cart via `POST /api/cart/merge`.

## Order lifecycle

```
pending → confirmed → preparing → out_for_delivery → delivered
   └──────────┴───────────┴──────────┘
                  cancelled
```

`cancelled` is reachable from any pre-delivered state. Customers can cancel their own
orders while they are `pending` or `confirmed`; admins can move an order through any
legal transition. Delivering an unpaid order marks it paid.

## API

All endpoints are prefixed with `/api`. Authenticated routes expect
`Authorization: Bearer <token>`.

### Public

| Method | Path                             | Description                                  |
| ------ | -------------------------------- | -------------------------------------------- |
| GET    | `/health`                        | Liveness probe                               |
| GET    | `/products`                      | List/filter products                         |
| GET    | `/products/facets`               | Categories, occasions and price range        |
| GET    | `/products/:slug`                | One product plus related items               |
| GET    | `/products/:id/reviews`          | Reviews for a product                        |
| POST   | `/products/:id/reviews`          | Add a review *(auth)*                        |
| POST   | `/orders/quote`                  | Price a cart (items + coupon + shipping)     |
| POST   | `/orders/coupon/validate`        | Validate a promo code                        |
| POST   | `/newsletter`                    | Join the newsletter                          |
| POST   | `/auth/login`                    | Sign in                                      |
| POST   | `/auth/register`                 | Create a customer account                    |
| POST   | `/auth/admin/register`           | Create an admin account *(access code)*      |
| GET    | `/auth/admin/signup-status`      | Whether admin sign-up is enabled             |

### Authenticated

| Method | Path                        | Description                          |
| ------ | --------------------------- | ------------------------------------ |
| GET    | `/auth/me`                  | Current user                         |
| PATCH  | `/auth/me`                  | Update profile                       |
| GET    | `/auth/addresses`           | Saved addresses                      |
| POST   | `/auth/addresses`           | Save an address                      |
| DELETE | `/auth/addresses/:id`       | Remove an address                    |
| GET    | `/cart`                     | Server cart                          |
| POST   | `/cart/items`               | Add a product                        |
| PATCH  | `/cart/items/:id`           | Change quantity                      |
| DELETE | `/cart/items/:id`           | Remove a line                        |
| DELETE | `/cart`                     | Empty the cart                       |
| POST   | `/cart/merge`               | Merge a guest cart after sign-in     |
| POST   | `/orders`                   | Place an order                       |
| GET    | `/orders`                   | My orders                            |
| GET    | `/orders/:orderNumber`      | One of my orders                     |
| POST   | `/orders/:orderNumber/cancel` | Cancel my order                    |

### Admin

| Method | Path                        | Description                          |
| ------ | --------------------------- | ------------------------------------ |
| GET    | `/admin/stats`              | Dashboard totals and charts          |
| GET    | `/admin/orders`             | Searchable, filterable order list    |
| GET    | `/admin/orders/:id`         | Order detail + allowed transitions   |
| PATCH  | `/admin/orders/:id`         | Status, payment, tracking, notes     |
| DELETE | `/admin/orders/:id`         | Delete an order                      |
| GET    | `/admin/products`           | All products, including archived     |
| POST   | `/admin/products`           | Create a product                     |
| PATCH  | `/admin/products/:id`       | Update a product                     |
| DELETE | `/admin/products/:id`       | Archive a product                    |
| POST   | `/admin/products/:id/restore` | Restore an archived product        |
| GET    | `/admin/customers`          | Customer list with spend             |
| GET    | `/admin/customers/:id`      | Customer detail                      |
| GET    | `/admin/coupons`            | Coupon list                          |
| POST   | `/admin/coupons`            | Create a coupon                      |
| PATCH  | `/admin/coupons/:code`      | Update a coupon                      |
| DELETE | `/admin/coupons/:code`      | Delete a coupon                      |
| GET    | `/admin/reviews`            | All reviews                          |
| DELETE | `/admin/reviews/:id`        | Delete a review                      |

Product filters: `q`, `category`, `stock=out|low`, `sort=featured|newest|price-asc|price-desc|rating|popular`.
Order filters: `status`, `payment`, `q`, `from`, `to`, `page`, `limit`.

### Coupons

Seeded codes:

| Code        | Discount        | Minimum | Active |
| ----------- | --------------- | ------- | ------ |
| `BLOOM10`   | 10% off         | —       | yes    |
| `FRESH15`   | 15% off         | KSh 6,000 | yes  |
| `WELCOME20` | KSh 2,000 off   | KSh 5,000 | yes  |
| `MOTHERFIVE`| 20% off         | KSh 8,000 | no   |

Coupon amounts are expressed in shillings at the API boundary (a fixed coupon of `2000` means
KSh 2,000). Responses include both `value`/`minSubtotal` in shillings and `valueCents`/`minSubtotalCents`.

## Seed data

`npm run seed` creates 25 products across 6 categories (flowering plants, foliage plants,
succulents & cacti, orchids, herbs & edibles, pots & care), 9 users (1 admin + 8 customers),
26 historical orders spread over the past few months, product reviews and the coupons above.
Customer accounts, addresses and order history are Kenyan, and seeded orders use card and
M-Pesa payments. Product images are hosted on Pexels and Unsplash; each one falls back to a
branded gradient if the image cannot be loaded.

## Production

```bash
npm run build          # bundles the storefront into web/dist
JWT_SECRET=<strong> npm start
```The API serves `web/dist` as static files with an SPA fallback, so a single process serves the whole site on `PORT`.

### Deploying to Vercel

`vercel.json` declares two [Vercel Services](https://vercel.com/docs/services) in one project:
`server` (the Express API, root `server/`) and `web` (the Vite storefront, root `web/`). Top-level
rewrites send `/api/*` to the API and everything else to the storefront. The storefront carries its
own SPA fallback rewrite, so deep links like `/shop/monstera-deliciosa` resolve to `index.html`
while real build assets still come from the filesystem. Rewrites forward the original path, so the
API keeps serving the `/api` prefix it already mounts — nothing has to be remapped.

Set `JWT_SECRET` (and `CORS_ORIGIN`, if you want to narrow it) in the project's environment
variables; services share them. Run `vercel dev` to exercise both services locally.

> **Data does not persist as configured.** Vercel functions run from a read-only directory, so on
> Vercel the API keeps its SQLite file in `/tmp`. That file is per-instance and disappears when the
> instance recycles, so the catalogue and orders reset. Point the database at durable storage (a
> hosted SQLite such as libSQL/Turso, or Postgres) before trusting the deployment with real data.
