import { Router } from 'express';
import { db, tx } from '../db.js';
import { requireAuth } from '../auth.js';
import { productPayload, money } from '../lib/helpers.js';

const router = Router();

function cartRows(userId) {
  return db
    .prepare(
      `SELECT ci.*, p.name, p.slug, p.price_cents, p.image, p.stock, p.active
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?
       ORDER BY ci.id DESC`,
    )
    .all(userId);
}

function buildCart(userId) {
  const rows = cartRows(userId);
  const items = rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    slug: row.slug,
    name: row.name,
    image: row.image,
    price: money(row.price_cents),
    priceCents: row.price_cents,
    qty: row.qty,
    size: row.size,
    color: row.color,
    lineTotal: money(row.price_cents * row.qty),
    stock: row.stock,
    available: row.stock >= row.qty && !!row.active,
  }));

  const subtotalCents = items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
  return {
    items,
    count: items.reduce((sum, i) => sum + i.qty, 0),
    subtotal: money(subtotalCents),
    subtotalCents,
  };
}

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json(buildCart(req.user.id));
});

router.post('/items', (req, res) => {
  const productId = Number(req.body?.productId);
  const qty = Math.min(Math.max(Number(req.body?.qty) || 1, 1), 99);
  const size = String(req.body?.size || 'Standard');
  const color = String(req.body?.color || '');

  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock < 1) return res.status(400).json({ error: 'This plant is out of stock' });

  const existing = db
    .prepare(
      'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?',
    )
    .get(req.user.id, productId, size, color);

  const desired = (existing?.qty || 0) + qty;
  if (desired > product.stock) {
    return res.status(400).json({ error: `Only ${product.stock} left in stock` });
  }

  if (existing) {
    db.prepare('UPDATE cart_items SET qty = ? WHERE id = ?').run(desired, existing.id);
  } else {
    db.prepare(
      'INSERT INTO cart_items (user_id, product_id, size, color, qty) VALUES (?, ?, ?, ?, ?)',
    ).run(req.user.id, productId, size, color, qty);
  }

  res.status(201).json(buildCart(req.user.id));
});

router.patch('/items/:id', (req, res) => {
  const qty = Math.min(Math.max(Number(req.body?.qty) || 1, 1), 99);
  const item = db
    .prepare('SELECT ci.*, p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.id = ? AND ci.user_id = ?')
    .get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Item not found in cart' });
  if (qty > item.stock) return res.status(400).json({ error: `Only ${item.stock} left in stock` });

  db.prepare('UPDATE cart_items SET qty = ? WHERE id = ?').run(qty, item.id);
  res.json(buildCart(req.user.id));
});

router.delete('/items/:id', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json(buildCart(req.user.id));
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json(buildCart(req.user.id));
});

/* Merge a guest (localStorage) cart into the signed-in user's cart. */
router.post('/merge', (req, res) => {
  mergeGuestCart(req.user.id, req.body?.items || []);
  res.json(buildCart(req.user.id));
});

/* Local (guest) cart merge helper, used after login. */
export function mergeGuestCart(userId, guestItems = []) {
  if (!Array.isArray(guestItems) || guestItems.length === 0) return;
  tx(() => {
    for (const item of guestItems) {
      const product = db
        .prepare('SELECT * FROM products WHERE id = ? AND active = 1')
        .get(Number(item.productId));
      if (!product) continue;
      const qty = Math.min(Math.max(Number(item.qty) || 1, 1), product.stock);
      if (qty < 1) continue;
      const existing = db
        .prepare(
          'SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ? AND color = ?',
        )
        .get(userId, product.id, item.size || 'Standard', item.color || '');
      if (existing) {
        const next = Math.min(existing.qty + qty, product.stock);
        db.prepare('UPDATE cart_items SET qty = ? WHERE id = ?').run(next, existing.id);
      } else {
        db.prepare(
          'INSERT INTO cart_items (user_id, product_id, size, color, qty) VALUES (?, ?, ?, ?, ?)',
        ).run(userId, product.id, item.size || 'Standard', item.color || '', qty);
      }
    }
  });
}

export { buildCart };
export default router;
