import { Router } from 'express';
import { db, tx } from '../db.js';
import { requireAuth } from '../auth.js';
import {
  computeTotals,
  findCoupon,
  generateOrderNumber,
  money,
  orderPayload,
  couponError,
  couponPayload,
} from '../lib/helpers.js';

const router = Router();

function itemsFor(orderId) {
  return db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(orderId);
}

/* Quote + coupon validation are public so guests can see live totals in the cart. */
router.post('/quote', (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const subtotalCents = items.reduce(
    (sum, i) => sum + Math.round(Number(i.priceCents || 0) * Number(i.qty || 0)),
    0,
  );
  const coupon = findCoupon(req.body?.couponCode);
  const totals = computeTotals(
    subtotalCents,
    coupon,
    req.body?.shippingMethod === 'express' ? 'express' : 'standard',
  );
  res.json({
    ...totals,
    subtotal: money(totals.subtotalCents),
    discount: money(totals.discountCents),
    shipping: money(totals.shippingCents),
    tax: money(totals.taxCents),
    total: money(totals.totalCents),
    coupon: couponPayload(coupon),
  });
});

router.post('/coupon/validate', (req, res) => {
  const code = String(req.body?.code || '').trim();
  const subtotalCents = Math.round(Number(req.body?.subtotalCents || 0));
  const error = couponError(code, subtotalCents);
  if (error) return res.status(400).json({ error });

  const coupon = findCoupon(code);
  res.json({
    coupon: couponPayload(coupon),
    label:
      coupon.kind === 'percent'
        ? `${coupon.value}% off`
        : `KSh ${Math.round(money(coupon.value)).toLocaleString('en-KE')} off`,
  });
});

router.post('/', requireAuth, (req, res) => {
  const b = req.body || {};
  const shipping = b.shipping || {};
  const payment = b.payment || {};

  const errors = [];
  if (!b.customer?.name) errors.push('Recipient name is required');
  if (!b.customer?.email) errors.push('Email is required');
  if (!shipping.address) errors.push('Street address is required');
  if (!shipping.city) errors.push('City is required');
  if (!shipping.zip) errors.push('Postal code is required');
  if (errors.length) return res.status(400).json({ error: errors[0], errors });

  const cartRows = db
    .prepare(
      `SELECT ci.*, p.name, p.price_cents, p.image, p.stock, p.active
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`,
    )
    .all(req.user.id);

  if (!cartRows.length) return res.status(400).json({ error: 'Your cart is empty' });

  for (const row of cartRows) {
    if (!row.active) return res.status(400).json({ error: `${row.name} is no longer available` });
    if (row.qty > row.stock) {
      return res.status(400).json({ error: `Only ${row.stock} of ${row.name} left in stock` });
    }
  }

  const subtotalCents = cartRows.reduce((sum, r) => sum + r.price_cents * r.qty, 0);
  const coupon = findCoupon(b.couponCode);
  if (b.couponCode && !coupon) return res.status(400).json({ error: 'That promo code is not valid' });
  if (coupon && subtotalCents < coupon.min_subtotal_cents) {
    return res.status(400).json({ error: 'This order does not meet the promo code minimum' });
  }

  const shippingMethod = shipping.method === 'express' ? 'express' : 'standard';
  const totals = computeTotals(subtotalCents, coupon, shippingMethod);
  const orderNumber = generateOrderNumber();

  const orderId = tx(() => {
    const info = db
      .prepare(
        `INSERT INTO orders (
           order_number, user_id, status, payment_status, payment_method,
           subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, coupon_code,
           customer_name, customer_email, customer_phone,
           ship_address, ship_city, ship_state, ship_zip, ship_country, notes
         ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        orderNumber,
        req.user.id,
        payment.status === 'paid' ? 'paid' : 'unpaid',
        payment.method || 'card',
        totals.subtotalCents,
        totals.discountCents,
        totals.shippingCents,
        totals.taxCents,
        totals.totalCents,
        coupon?.code || null,
        b.customer.name,
        b.customer.email,
        b.customer.phone || '',
        shipping.address,
        shipping.city,
        shipping.state || '',
        shipping.zip,
        shipping.country || 'US',
        b.notes || '',
      );

    const id = Number(info.lastInsertRowid);
    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, name, image, unit_price_cents, qty, size, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const row of cartRows) {
      insertItem.run(
        id,
        row.product_id,
        row.name,
        row.image,
        row.price_cents,
        row.qty,
        row.size,
        row.color,
      );
      db.prepare('UPDATE products SET stock = stock - ?, sold_count = sold_count + ? WHERE id = ?').run(
        row.qty,
        row.qty,
        row.product_id,
      );
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return id;
  });

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  res.status(201).json({ order: orderPayload(order, itemsFor(orderId)) });
});

router.get('/', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  res.json({
    orders: rows.map((row) => orderPayload(row, itemsFor(row.id))),
  });
});

router.get('/:orderNumber', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?')
    .get(req.params.orderNumber, req.user.id);
  if (!row) return res.status(404).json({ error: 'Order not found' });
  res.json({ order: orderPayload(row, itemsFor(row.id)) });
});

router.post('/:orderNumber/cancel', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ?')
    .get(req.params.orderNumber, req.user.id);
  if (!row) return res.status(404).json({ error: 'Order not found' });
  if (!['pending', 'confirmed'].includes(row.status)) {
    return res.status(400).json({ error: 'This order can no longer be cancelled' });
  }

  tx(() => {
    db.prepare(`UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`).run(
      row.id,
    );
    for (const item of itemsFor(row.id)) {
      if (item.product_id) {
        db.prepare(
          'UPDATE products SET stock = stock + ?, sold_count = MAX(0, sold_count - ?) WHERE id = ?',
        ).run(item.qty, item.qty, item.product_id);
      }
    }
  });

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(row.id);
  res.json({ order: orderPayload(updated, itemsFor(row.id)) });
});

export { itemsFor };
export default router;
