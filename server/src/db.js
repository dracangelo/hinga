import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CATEGORIES } from './lib/categories.js';

let DatabaseSync;
try {
  const sqliteModule = await import('node:sqlite');
  DatabaseSync = sqliteModule.DatabaseSync;
} catch (err) {
  console.error(
    `[DB CRITICAL] Cannot load 'node:sqlite' on Node ${process.version}. ` +
    `Please set Node.js Version to "22.x" in Vercel Project Settings -> General -> Node.js Version.`,
    err,
  );
  throw err;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = join(__dirname, '..', 'data');

const SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NOW_REGION,
);

export const DB_PATH = SERVERLESS
  ? (process.env.DB_PATH && process.env.DB_PATH.startsWith('/tmp')
      ? resolve(process.env.DB_PATH)
      : join(tmpdir(), 'hinga.db'))
  : (process.env.DB_PATH
      ? resolve(process.env.DB_PATH)
      : join(DATA_DIR, 'hinga.db'));

try {
  mkdirSync(dirname(DB_PATH), { recursive: true });
} catch {
  /* Ignore EROFS or existing directory */
}

export const db = new DatabaseSync(DB_PATH);

db.exec(SERVERLESS ? 'PRAGMA journal_mode = MEMORY' : 'PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer',
  phone         TEXT,
  city          TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slug              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  story             TEXT,
  category          TEXT NOT NULL DEFAULT 'flowering-plants',
  occasions         TEXT NOT NULL DEFAULT '',
  price_cents       INTEGER NOT NULL,
  compare_at_cents  INTEGER,
  stock             INTEGER NOT NULL DEFAULT 0,
  image             TEXT NOT NULL DEFAULT '',
  gallery           TEXT NOT NULL DEFAULT '',
  colors            TEXT NOT NULL DEFAULT '',
  sizes             TEXT NOT NULL DEFAULT 'Standard',
  rating            REAL NOT NULL DEFAULT 0,
  review_count      INTEGER NOT NULL DEFAULT 0,
  sold_count        INTEGER NOT NULL DEFAULT 0,
  featured          INTEGER NOT NULL DEFAULT 0,
  active            INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT '',
  links       TEXT NOT NULL DEFAULT '[]',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name       TEXT NOT NULL DEFAULT 'Guest',
  rating     INTEGER NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  body       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size       TEXT NOT NULL DEFAULT 'Standard',
  color      TEXT NOT NULL DEFAULT '',
  qty        INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, product_id, size, color)
);

CREATE TABLE IF NOT EXISTS orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number      TEXT NOT NULL UNIQUE,
  user_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  payment_status    TEXT NOT NULL DEFAULT 'unpaid',
  payment_method    TEXT NOT NULL DEFAULT 'card',
  subtotal_cents    INTEGER NOT NULL DEFAULT 0,
  discount_cents    INTEGER NOT NULL DEFAULT 0,
  shipping_cents    INTEGER NOT NULL DEFAULT 0,
  tax_cents         INTEGER NOT NULL DEFAULT 0,
  total_cents       INTEGER NOT NULL DEFAULT 0,
  coupon_code       TEXT,
  customer_name     TEXT NOT NULL DEFAULT '',
  customer_email    TEXT NOT NULL DEFAULT '',
  customer_phone    TEXT NOT NULL DEFAULT '',
  ship_address      TEXT NOT NULL DEFAULT '',
  ship_city         TEXT NOT NULL DEFAULT '',
  ship_state        TEXT NOT NULL DEFAULT '',
  ship_zip          TEXT NOT NULL DEFAULT '',
  ship_country      TEXT NOT NULL DEFAULT 'US',
  notes             TEXT NOT NULL DEFAULT '',
  tracking_number   TEXT NOT NULL DEFAULT '',
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  image            TEXT NOT NULL DEFAULT '',
  unit_price_cents INTEGER NOT NULL,
  qty              INTEGER NOT NULL,
  size             TEXT NOT NULL DEFAULT 'Standard',
  color            TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS coupons (
  code                TEXT PRIMARY KEY,
  kind                TEXT NOT NULL DEFAULT 'percent',
  value               INTEGER NOT NULL DEFAULT 0,
  min_subtotal_cents  INTEGER NOT NULL DEFAULT 0,
  active              INTEGER NOT NULL DEFAULT 1,
  expires_at          TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS addresses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label      TEXT NOT NULL DEFAULT 'Home',
  recipient  TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  address    TEXT NOT NULL DEFAULT '',
  city       TEXT NOT NULL DEFAULT '',
  state      TEXT NOT NULL DEFAULT '',
  zip        TEXT NOT NULL DEFAULT '',
  country    TEXT NOT NULL DEFAULT 'US',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS newsletter (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS landscaping_requests (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  reference         TEXT NOT NULL UNIQUE,
  user_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name              TEXT NOT NULL DEFAULT '',
  email             TEXT NOT NULL DEFAULT '',
  phone             TEXT NOT NULL DEFAULT '',
  location          TEXT NOT NULL DEFAULT '',
  land_size         TEXT NOT NULL DEFAULT '',
  site_type         TEXT NOT NULL DEFAULT 'home-garden',
  preferred_flowers TEXT NOT NULL DEFAULT '',
  timeline          TEXT NOT NULL DEFAULT '',
  budget            TEXT NOT NULL DEFAULT '',
  notes             TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'new',
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS landscaping_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id  INTEGER NOT NULL REFERENCES landscaping_requests(id) ON DELETE CASCADE,
  author      TEXT NOT NULL DEFAULT 'customer',
  author_name TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_landscaping_status ON landscaping_requests(status);
CREATE INDEX IF NOT EXISTS idx_landscaping_messages_request ON landscaping_messages(request_id);
`);

/*
 * Seed the original six storefront categories once. The settings marker keeps
 * this migration idempotent, so deleting or renaming a default category later
 * is permanent. Rows created by an earlier partial migration are backfilled
 * when they have no description or menu links yet.
 */
const categoriesSeeded = db
  .prepare("SELECT value FROM settings WHERE key = 'categories_seeded'")
  .get();

const insertCategory = db.prepare(
  `INSERT OR IGNORE INTO categories
    (slug, name, description, image, links, sort_order, active)
   VALUES (?, ?, ?, ?, ?, ?, 1)`,
);

if (!categoriesSeeded) {
  DEFAULT_CATEGORIES.forEach((category, index) => {
    const existing = db.prepare('SELECT * FROM categories WHERE slug = ?').get(category.slug);
    if (!existing) {
      insertCategory.run(
        category.slug,
        category.name,
        category.description,
        category.image,
        JSON.stringify(category.links),
        index,
      );
      return;
    }

    if (!existing.description && (!existing.links || existing.links === '[]')) {
      db.prepare(
        `UPDATE categories
         SET name = ?, description = ?, image = ?, links = ?, sort_order = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
      ).run(
        category.name,
        category.description,
        category.image,
        JSON.stringify(category.links),
        index,
        existing.id,
      );
    }
  });

  db.prepare(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('categories_seeded', datetime('now'))",
  ).run();
}

const legacyCategories = db
  .prepare(
    `SELECT category AS slug, MIN(image) AS image
     FROM products WHERE TRIM(category) != ''
     GROUP BY category`,
  )
  .all();

let legacyOrder = DEFAULT_CATEGORIES.length + 10;
for (const category of legacyCategories) {
  const exists = db.prepare('SELECT id FROM categories WHERE slug = ?').get(category.slug);
  if (exists) continue;

  const name = category.slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  insertCategory.run(category.slug, name, '', category.image || '', '[]', legacyOrder);
  legacyOrder += 1;
}

/** Convert snake_case row into camelCase object. */
export function camel(row) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())] = value;
  }
  return out;
}

/** Convert camelCase object into snake_case row fragment. */
export function snake(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = value;
  }
  return out;
}

export function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
