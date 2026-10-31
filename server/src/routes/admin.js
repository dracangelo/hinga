import { Router } from 'express';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { db, tx } from '../db.js';
import { requireAdmin } from '../auth.js';
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  STATUS_FLOW,
  money,
  orderPayload,
  productPayload,
  serializeAddress,
  uniqueSlug,
  slugify,
  categoryLinks,
  categoryPayload,
  uniqueCategorySlug,
  couponPayload,
  couponValueToCents,
} from '../lib/helpers.js';
import { itemsFor } from './orders.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NOW_REGION,
);
const SERVER_UPLOADS_DIR = SERVERLESS
  ? join(tmpdir(), 'uploads')
  : join(__dirname, '..', '..', 'uploads');
const WEB_UPLOADS_DIR = SERVERLESS
  ? join(tmpdir(), 'uploads')
  : join(__dirname, '..', '..', '..', 'web', 'public', 'uploads');

router.use(requireAdmin);

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

router.get('/stats', (_req, res) => {
  const revenueRows = db
    .prepare(
      `SELECT DATE(created_at) AS day, SUM(total_cents) AS revenue, COUNT(*) AS orders
       FROM orders WHERE status != 'cancelled' GROUP BY DATE(created_at) ORDER BY day DESC LIMIT 30`,
    )
    .all()
    .reverse();

  const totals = db
    .prepare(
      `SELECT
         COUNT(*) AS orders,
         SUM(CASE WHEN status != 'cancelled' THEN total_cents ELSE 0 END) AS revenue,
         SUM(CASE WHEN status != 'cancelled' THEN 1 ELSE 0 END) AS paid_orders,
         AVG(CASE WHEN status != 'cancelled' THEN total_cents END) AS avg_order
       FROM orders`,
    )
    .get();

  const today = db
    .prepare(
      `SELECT COUNT(*) AS orders, SUM(total_cents) AS revenue
       FROM orders WHERE DATE(created_at) = DATE('now') AND status != 'cancelled'`,
    )
    .get();

  const previousPeriod = db
    .prepare(
      `SELECT COUNT(*) AS orders, SUM(total_cents) AS revenue
       FROM orders WHERE DATE(created_at) = DATE('now', '-30 days') AND status != 'cancelled'`,
    )
    .get();

  const statusCounts = db
    .prepare('SELECT status, COUNT(*) AS count FROM orders GROUP BY status')
    .all();

  const productStats = db
    .prepare(
      `SELECT
         SUM(CASE WHEN active = 1 THEN sold_count ELSE 0 END) AS sold,
         COUNT(*) AS products,
         SUM(CASE WHEN active = 1 AND stock = 0 THEN 1 ELSE 0 END) AS out_of_stock,
         SUM(CASE WHEN active = 1 AND stock > 0 AND stock <= 5 THEN 1 ELSE 0 END) AS low_stock
       FROM products`,
    )
    .get();

  const customers = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'")
    .get();

  const topProducts = db
    .prepare(
      `SELECT oi.name, SUM(oi.qty) AS units, SUM(oi.qty * oi.unit_price_cents) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.status != 'cancelled'
       GROUP BY oi.name ORDER BY revenue DESC LIMIT 5`,
    )
    .all();

  const topCustomers = db
    .prepare(
      `SELECT o.customer_name AS name, o.customer_email AS email, COUNT(*) AS orders,
              SUM(o.total_cents) AS spend
       FROM orders o WHERE o.status != 'cancelled'
       GROUP BY o.customer_email ORDER BY spend DESC LIMIT 5`,
    )
    .all();

  const lowStockItems = db
    .prepare(
      `SELECT * FROM products WHERE active = 1 AND stock <= 5 ORDER BY stock ASC, name ASC LIMIT 8`,
    )
    .all();

  res.json({
    totals: {
      orders: totals.orders || 0,
      revenue: money(totals.revenue || 0),
      paidOrders: totals.paid_orders || 0,
      avgOrder: money(totals.avg_order || 0),
      todayOrders: today.orders || 0,
      todayRevenue: money(today.revenue || 0),
      periodOrders: previousPeriod.orders || 0,
      periodRevenue: money(previousPeriod.revenue || 0),
      customers: customers.count || 0,
      products: productStats.products || 0,
      unitsSold: productStats.sold || 0,
      outOfStock: productStats.out_of_stock || 0,
      lowStock: productStats.low_stock || 0,
    },
    revenueSeries: revenueRows.map((r) => ({
      day: r.day,
      revenue: money(r.revenue || 0),
      orders: r.orders,
    })),
    statusCounts: ORDER_STATUSES.map((status) => ({
      status,
      count: statusCounts.find((s) => s.status === status)?.count || 0,
    })),
    topProducts: topProducts.map((p) => ({
      name: p.name,
      units: p.units,
      revenue: money(p.revenue),
    })),
    topCustomers: topCustomers.map((c) => ({
      name: c.name,
      email: c.email,
      orders: c.orders,
      spend: money(c.spend),
    })),
    lowStock: lowStockItems.map(productPayload),
  });
});

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

router.get('/orders', (req, res) => {
  const { status = '', q = '', payment = '', from = '', to = '', page = 1, limit = 25 } = req.query;

  const where = [];
  const params = [];

  if (status && status !== 'all') {
    where.push('status = ?');
    params.push(status);
  }
  if (payment && payment !== 'all') {
    where.push('payment_status = ?');
    params.push(payment);
  }
  if (q) {
    where.push(
      '(order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ?)',
    );
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (from) {
    where.push('DATE(created_at) >= DATE(?)');
    params.push(from);
  }
  if (to) {
    where.push('DATE(created_at) <= DATE(?)');
    params.push(to);
  }

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const perPage = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const current = Math.max(Number(page) || 1, 1);

  const total = db.prepare(`SELECT COUNT(*) AS c FROM orders ${clause}`).get(...params).c;
  const rows = db
    .prepare(`SELECT * FROM orders ${clause} ORDER BY id DESC LIMIT ? OFFSET ?`)
    .all(...params, perPage, (current - 1) * perPage);

  res.json({
    orders: rows.map((row) => orderPayload(row, itemsFor(row.id))),
    total,
    page: current,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  });
});

router.get('/orders/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(
    Number(req.params.id) || -1,
    req.params.id,
  );
  if (!row) return res.status(404).json({ error: 'Order not found' });

  const customer = row.user_id
    ? db
        .prepare('SELECT id, name, email, phone FROM users WHERE id = ?')
        .get(row.user_id)
    : null;

  res.json({
    order: orderPayload(row, itemsFor(row.id)),
    customer,
    allowedTransitions: STATUS_FLOW[row.status] || [],
  });
});

router.patch('/orders/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Order not found' });

  const body = req.body || {};
  const updates = [];
  const params = [];

  if (body.status !== undefined) {
    if (!ORDER_STATUSES.includes(body.status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const allowed = STATUS_FLOW[row.status] || [];
    if (body.status !== row.status && !allowed.includes(body.status)) {
      return res.status(400).json({
        error: `Cannot move an order from "${row.status}" to "${body.status}"`,
      });
    }
    updates.push('status = ?');
    params.push(body.status);

    if (body.status === 'delivered' && row.payment_status === 'unpaid') {
      updates.push("payment_status = 'paid'");
    }
    if (body.status === 'cancelled' && row.status !== 'cancelled') {
      tx(() => {
        for (const item of itemsFor(row.id)) {
          if (item.product_id) {
            db.prepare(
              'UPDATE products SET stock = stock + ?, sold_count = MAX(0, sold_count - ?) WHERE id = ?',
            ).run(item.qty, item.qty, item.product_id);
          }
        }
      });
    }
  }

  if (body.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }
    updates.push('payment_status = ?');
    params.push(body.paymentStatus);
  }

  if (body.trackingNumber !== undefined) {
    updates.push('tracking_number = ?');
    params.push(String(body.trackingNumber).trim());
  }

  if (body.notes !== undefined) {
    updates.push('notes = ?');
    params.push(String(body.notes));
  }

  if (body.shippingAddress) {
    const s = body.shippingAddress;
    if (s.address !== undefined) {
      updates.push('ship_address = ?');
      params.push(String(s.address));
    }
    if (s.city !== undefined) {
      updates.push('ship_city = ?');
      params.push(String(s.city));
    }
    if (s.state !== undefined) {
      updates.push('ship_state = ?');
      params.push(String(s.state));
    }
    if (s.zip !== undefined) {
      updates.push('ship_zip = ?');
      params.push(String(s.zip));
    }
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  updates.push("updated_at = datetime('now')");
  db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params, row.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(row.id);
  res.json({
    order: orderPayload(updated, itemsFor(row.id)),
    allowedTransitions: STATUS_FLOW[updated.status] || [],
  });
});

router.delete('/orders/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Order not found' });
  db.prepare('DELETE FROM orders WHERE id = ?').run(row.id);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

function categoryExists(slug) {
  return Boolean(db.prepare('SELECT 1 FROM categories WHERE slug = ?').get(slug));
}

function defaultCategorySlug() {
  return (
    db
      .prepare(
        'SELECT slug FROM categories ORDER BY active DESC, sort_order ASC, name ASC LIMIT 1',
      )
      .get()?.slug || null
  );
}

router.get('/products', (req, res) => {
  const { q = '', category = '', stock = '', includeInactive = 'true' } = req.query;
  const where = [];
  const params = [];

  if (q) {
    where.push('(name LIKE ? OR category LIKE ? OR slug LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  if (stock === 'out') where.push('stock = 0');
  if (stock === 'low') where.push('stock > 0 AND stock <= 5');

  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  if (includeInactive === 'false') {
    const joined = clause ? `${clause} AND active = 1` : 'WHERE active = 1';
    const rows = db.prepare(`SELECT * FROM products ${joined} ORDER BY id DESC`).all(...params);
    return res.json({ products: rows.map(productPayload) });
  }

  const rows = db.prepare(`SELECT * FROM products ${clause} ORDER BY id DESC`).all(...params);
  res.json({ products: rows.map(productPayload) });
});

router.post('/products', (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Product name is required' });

  let category = String(b.category || '').trim();
  if (!category) category = defaultCategorySlug();
  if (!category) {
    return res.status(400).json({ error: 'Create a category before adding products' });
  }
  if (!categoryExists(category)) {
    return res.status(400).json({ error: 'Choose a valid category' });
  }

  const priceCents = Math.round(Number(b.priceCents ?? Number(b.price || 0) * 100));
  if (!Number.isFinite(priceCents) || priceCents < 0) {
    return res.status(400).json({ error: 'Enter a valid price' });
  }

  const slug = uniqueSlug(b.slug || name);
  const list = (value) =>
    (Array.isArray(value) ? value : String(value || '').split(','))
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(',');

  const info = db
    .prepare(
      `INSERT INTO products
        (slug, name, description, story, category, occasions, price_cents, compare_at_cents,
         stock, image, gallery, colors, sizes, featured, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      slug,
      name,
      String(b.description || ''),
      String(b.story || ''),
      category,
      list(b.occasions),
      priceCents,
      b.compareAtCents ? Math.round(Number(b.compareAtCents)) : null,
      Math.max(0, Number(b.stock) || 0),
      String(b.image || ''),
      list(b.gallery),
      list(b.colors),
      list(b.sizes) || 'Standard',
      b.featured ? 1 : 0,
      b.active === false ? 0 : 1,
    );

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ product: productPayload(row) });
});

router.patch('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const b = req.body || {};
  if (b.category !== undefined) {
    const category = String(b.category || '').trim();
    if (!category || !categoryExists(category)) {
      return res.status(400).json({ error: 'Choose a valid category' });
    }
  }

  const list = (value) =>
    (Array.isArray(value) ? value : String(value || '').split(','))
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(',');

  const map = {
    name: (v) => String(v).trim(),
    description: (v) => String(v),
    story: (v) => String(v),
    category: (v) => String(v),
    occasions: (v) => list(v),
    priceCents: (v) => Math.round(Number(v)),
    compareAtCents: (v) => (v ? Math.round(Number(v)) : null),
    stock: (v) => Math.max(0, Number(v)),
    image: (v) => String(v),
    gallery: (v) => list(v),
    colors: (v) => list(v),
    sizes: (v) => list(v),
    featured: (v) => (v ? 1 : 0),
    active: (v) => (v ? 1 : 0),
  };

  /* API field name -> database column name. */
  const columns = {
    priceCents: 'price_cents',
    compareAtCents: 'compare_at_cents',
  };

  const updates = [];
  const params = [];
  for (const [key, transform] of Object.entries(map)) {
    if (b[key] !== undefined) {
      updates.push(`${columns[key] || key} = ?`);
      params.push(transform(b[key]));
    }
  }
  if (b.slug !== undefined) {
    updates.push('slug = ?');
    params.push(uniqueSlug(b.slug, existing.id));
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...params, existing.id);
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(existing.id);
  res.json({ product: productPayload(row) });
});

router.delete('/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(existing.id);
  res.json({ ok: true, product: productPayload(existing) });
});

router.post('/products/:id/restore', (req, res) => {
  db.prepare('UPDATE products SET active = 1 WHERE id = ?').run(req.params.id);
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ product: productPayload(row) });
});

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

router.get('/categories', (req, res) => {
  const includeInactive = String(req.query.includeInactive ?? 'true') !== 'false';
  const clause = includeInactive ? '' : 'WHERE c.active = 1';
  const rows = db
    .prepare(
      `SELECT c.*,
         (SELECT COUNT(*) FROM products p WHERE p.category = c.slug) AS product_count
       FROM categories c ${clause}
       ORDER BY c.sort_order ASC, c.name ASC`,
    )
    .all();

  res.json({ categories: rows.map(categoryPayload) });
});

router.post('/categories', (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  const slug = uniqueCategorySlug(b.slug || name);
  const sortOrder = Number.isFinite(Number(b.sortOrder)) ? Math.round(Number(b.sortOrder)) : 0;

  const info = db
    .prepare(
      `INSERT INTO categories
        (slug, name, description, image, links, sort_order, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      slug,
      name,
      String(b.description || ''),
      String(b.image || '').trim(),
      JSON.stringify(categoryLinks(b.links, slug)),
      sortOrder,
      b.active === false ? 0 : 1,
    );

  const row = db
    .prepare(
      `SELECT c.*, 0 AS product_count FROM categories c WHERE c.id = ?`,
    )
    .get(info.lastInsertRowid);
  res.status(201).json({ category: categoryPayload(row) });
});

router.patch('/categories/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  const b = req.body || {};
  const updates = [];
  const params = [];
  let nextSlug = existing.slug;

  if (b.name !== undefined) {
    const name = String(b.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    updates.push('name = ?');
    params.push(name);
  }

  if (b.slug !== undefined) {
    nextSlug = uniqueCategorySlug(b.slug || b.name || existing.name, existing.id);
    updates.push('slug = ?');
    params.push(nextSlug);
  }

  if (b.description !== undefined) {
    updates.push('description = ?');
    params.push(String(b.description || ''));
  }

  if (b.image !== undefined) {
    updates.push('image = ?');
    params.push(String(b.image || '').trim());
  }

  if (b.links !== undefined) {
    updates.push('links = ?');
    params.push(JSON.stringify(categoryLinks(b.links, nextSlug)));
  }

  if (b.sortOrder !== undefined) {
    const sortOrder = Number(b.sortOrder);
    updates.push('sort_order = ?');
    params.push(Number.isFinite(sortOrder) ? Math.round(sortOrder) : 0);
  }

  if (b.active !== undefined) {
    updates.push('active = ?');
    params.push(b.active ? 1 : 0);
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  updates.push("updated_at = datetime('now')");

  tx(() => {
    db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(
      ...params,
      existing.id,
    );
    if (nextSlug !== existing.slug) {
      db.prepare('UPDATE products SET category = ? WHERE category = ?').run(
        nextSlug,
        existing.slug,
      );
    }
  });

  const row = db
    .prepare(
      `SELECT c.*,
         (SELECT COUNT(*) FROM products p WHERE p.category = c.slug) AS product_count
       FROM categories c WHERE c.id = ?`,
    )
    .get(existing.id);

  res.json({ category: categoryPayload(row) });
});

router.delete('/categories/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });

  const productCount = db
    .prepare('SELECT COUNT(*) AS count FROM products WHERE category = ?')
    .get(existing.slug).count;

  if (productCount > 0) {
    return res.status(409).json({
      error: `This category still has ${productCount} product${
        productCount === 1 ? '' : 's'
      }. Move or delete them first, or hide the category instead.`,
    });
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(existing.id);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

router.get('/customers', (req, res) => {
  const q = String(req.query.q || '').trim();
  const params = [];
  let clause = "WHERE u.role = 'customer'";
  if (q) {
    clause += ' AND (u.name LIKE ? OR u.email LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  const rows = db
    .prepare(
      `SELECT u.*,
         (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS order_count,
         (SELECT COALESCE(SUM(o.total_cents), 0) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS spend,
         (SELECT MAX(o.created_at) FROM orders o WHERE o.user_id = u.id) AS last_order_at
       FROM users u ${clause} ORDER BY spend DESC, u.id DESC`,
    )
    .all(...params);

  res.json({
    customers: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || '',
      city: r.city || '',
      orderCount: r.order_count,
      spend: money(r.spend),
      lastOrderAt: r.last_order_at,
      createdAt: r.created_at,
    })),
  });
});

router.get('/customers/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(user.id);
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ?').all(user.id);
  res.json({
    customer: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      city: user.city || '',
      createdAt: user.created_at,
    },
    orders: orders.map((o) => orderPayload(o, itemsFor(o.id))),
    addresses: addresses.map(serializeAddress),
  });
});

/* ------------------------------------------------------------------ */
/* Coupons                                                             */
/* ------------------------------------------------------------------ */

router.get('/coupons', (_req, res) => {
  const rows = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
  res.json({ coupons: rows.map(couponPayload) });
});

router.post('/coupons', (req, res) => {
  const b = req.body || {};
  const code = slugify(b.code).toUpperCase();
  if (!code) return res.status(400).json({ error: 'Coupon code is required' });
  const kind = b.kind === 'fixed' ? 'fixed' : 'percent';
  const value = couponValueToCents(kind, b.value, b.valueCents);
  if (value <= 0) return res.status(400).json({ error: 'Enter a discount value' });
  if (kind === 'percent' && value > 100) {
    return res.status(400).json({ error: 'Percentage cannot exceed 100' });
  }

  const exists = db.prepare('SELECT code FROM coupons WHERE code = ?').get(code);
  if (exists) return res.status(409).json({ error: 'That coupon code already exists' });

  const minSubtotalCents =
    b.minSubtotalCents !== undefined && b.minSubtotalCents !== null && b.minSubtotalCents !== ''
      ? Math.round(Number(b.minSubtotalCents))
      : Math.round((Number(b.minSubtotal) || 0) * 100);

  db.prepare(
    'INSERT INTO coupons (code, kind, value, min_subtotal_cents, active, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    code,
    kind,
    value,
    minSubtotalCents,
    b.active === false ? 0 : 1,
    b.expiresAt || null,
  );

  const row = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code);
  res.status(201).json({ ok: true, coupon: couponPayload(row) });
});

router.patch('/coupons/:code', (req, res) => {
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(req.params.code);
  if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
  const b = req.body || {};

  const updates = [];
  const params = [];

  if (b.active !== undefined) {
    updates.push('active = ?');
    params.push(b.active ? 1 : 0);
  }

  if (b.value !== undefined || b.valueCents !== undefined) {
    const kind = b.kind || coupon.kind;
    const value = couponValueToCents(kind, b.value, b.valueCents);
    if (value <= 0) return res.status(400).json({ error: 'Enter a discount value' });
    if (kind === 'percent' && value > 100) {
      return res.status(400).json({ error: 'Percentage cannot exceed 100' });
    }
    updates.push('value = ?');
    params.push(value);
    if (b.kind && b.kind !== coupon.kind) {
      updates.push('kind = ?');
      params.push(b.kind);
    }
  }

  if (b.minSubtotal !== undefined || b.minSubtotalCents !== undefined) {
    const cents =
      b.minSubtotalCents !== undefined && b.minSubtotalCents !== null && b.minSubtotalCents !== ''
        ? Math.round(Number(b.minSubtotalCents))
        : Math.round((Number(b.minSubtotal) || 0) * 100);
    updates.push('min_subtotal_cents = ?');
    params.push(cents);
  }

  if (b.expiresAt !== undefined) {
    updates.push('expires_at = ?');
    params.push(b.expiresAt || null);
  }

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  db.prepare(`UPDATE coupons SET ${updates.join(', ')} WHERE code = ?`).run(...params, coupon.code);
  const row = db.prepare('SELECT * FROM coupons WHERE code = ?').get(coupon.code);
  res.json({ ok: true, coupon: couponPayload(row) });
});

router.delete('/coupons/:code', (req, res) => {
  db.prepare('DELETE FROM coupons WHERE code = ?').run(req.params.code);
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* Reviews + newsletter                                                */
/* ------------------------------------------------------------------ */

router.get('/reviews', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, p.name AS product_name FROM product_reviews r
       LEFT JOIN products p ON p.id = r.product_id ORDER BY r.id DESC`,
    )
    .all();
  res.json({
    reviews: rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      productName: r.product_name,
      name: r.name,
      rating: r.rating,
      title: r.title,
      body: r.body,
      createdAt: r.created_at,
    })),
  });
});

router.delete('/reviews/:id', (req, res) => {
  const review = db.prepare('SELECT * FROM product_reviews WHERE id = ?').get(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  db.prepare('DELETE FROM product_reviews WHERE id = ?').run(review.id);
  const stats = db
    .prepare('SELECT AVG(rating) AS avg, COUNT(*) AS c FROM product_reviews WHERE product_id = ?')
    .get(review.product_id);
  db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?').run(
    Math.round((stats.avg || 0) * 100) / 100,
    stats.c,
    review.product_id,
  );
  res.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* Deal of the Day                                                     */
/* ------------------------------------------------------------------ */

router.get('/deal-of-the-day', (_req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'deal_of_the_day'").get();
  let deal = null;
  if (row?.value) {
    try {
      deal = JSON.parse(row.value);
    } catch {
      deal = null;
    }
  }

  let product = null;
  if (deal?.productId) {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(deal.productId);
    if (p) product = productPayload(p);
  }

  res.json({ deal, product });
});

router.put('/deal-of-the-day', (req, res) => {
  const productId = Number(req.body?.productId);
  if (!productId) return res.status(400).json({ error: 'Please choose a product for the deal of the day' });

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const discountPercent = Math.max(1, Math.min(99, Number(req.body?.discountPercent) || 20));
  const customTitle = String(req.body?.customTitle || '').trim();

  const dealData = {
    productId: product.id,
    slug: product.slug,
    discountPercent,
    customTitle,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('deal_of_the_day', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(JSON.stringify(dealData));

  res.json({
    ok: true,
    message: `"${product.name}" is now the Deal of the Day!`,
    deal: dealData,
    product: productPayload(product),
  });
});

/* ------------------------------------------------------------------ */
/* File Upload                                                         */
/* ------------------------------------------------------------------ */

router.post('/upload', async (req, res) => {
  const { data, filename = 'image.jpg' } = req.body || {};
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ error: 'Image data is required' });
  }

  // Expect data URL: data:image/png;base64,...
  const match = data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL.' });
  }

  const rawExt = match[1].toLowerCase().replace('jpeg', 'jpg');
  const allowed = ['jpg', 'png', 'webp', 'gif', 'svg+xml', 'svg'];
  const ext = rawExt === 'svg+xml' ? 'svg' : rawExt;
  if (!allowed.includes(ext)) {
    return res.status(400).json({ error: 'Allowed image types: JPG, PNG, WEBP, GIF, SVG' });
  }

  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');

  if (buffer.length > 15 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image file must be under 15MB' });
  }

  const safeBase = filename
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9_-]/g, '-')
    .slice(0, 32) || 'upload';
  const uniqueName = `${safeBase}-${Date.now()}.${ext}`;

  try {
    await mkdir(SERVER_UPLOADS_DIR, { recursive: true });
    await writeFile(join(SERVER_UPLOADS_DIR, uniqueName), buffer);

    try {
      await mkdir(WEB_UPLOADS_DIR, { recursive: true });
      await writeFile(join(WEB_UPLOADS_DIR, uniqueName), buffer);
    } catch {
      // web public uploads is optional in prod
    }

    res.json({
      ok: true,
      url: `/uploads/${uniqueName}`,
      filename: uniqueName,
    });
  } catch (err) {
    console.error('File upload failed:', err);
    res.status(500).json({ error: 'Failed to save image file' });
  }
});

export default router;
