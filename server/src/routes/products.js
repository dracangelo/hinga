import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { productPayload, splitList } from '../lib/helpers.js';

const router = Router();

const SORTS = {
  featured: 'p.featured DESC, p.sold_count DESC, p.id DESC',
  newest: 'p.created_at DESC, p.id DESC',
  'price-asc': 'p.price_cents ASC',
  'price-desc': 'p.price_cents DESC',
  rating: 'p.rating DESC, p.review_count DESC',
  popular: 'p.sold_count DESC, p.rating DESC',
};

router.get('/', (req, res) => {
  const {
    q = '',
    category = '',
    occasion = '',
    min,
    max,
    sort = 'featured',
    featured,
    inStock,
    page = 1,
    limit = 24,
  } = req.query;

  const where = ['p.active = 1'];
  const params = [];

  if (q) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.occasions LIKE ? OR p.category LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (category) {
    where.push('p.category = ?');
    params.push(category);
  }
  if (occasion) {
    where.push('p.occasions LIKE ?');
    params.push(`%${occasion}%`);
  }
  if (min !== undefined && min !== '') {
    where.push('p.price_cents >= ?');
    params.push(Math.round(Number(min) * 100));
  }
  if (max !== undefined && max !== '') {
    where.push('p.price_cents <= ?');
    params.push(Math.round(Number(max) * 100));
  }
  if (featured === 'true' || featured === '1') {
    where.push('p.featured = 1');
  }
  if (inStock === 'true' || inStock === '1') {
    where.push('p.stock > 0');
  }

  const clause = where.join(' AND ');
  const orderBy = SORTS[sort] || SORTS.featured;
  const perPage = Math.min(Math.max(Number(limit) || 24, 1), 60);
  const current = Math.max(Number(page) || 1, 1);
  const offset = (current - 1) * perPage;

  const total = db.prepare(`SELECT COUNT(*) AS c FROM products p WHERE ${clause}`).get(...params).c;
  const rows = db
    .prepare(`SELECT p.* FROM products p WHERE ${clause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .all(...params, perPage, offset);

  res.json({
    products: rows.map(productPayload),
    total,
    page: current,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  });
});

router.get('/facets', (_req, res) => {
  const categories = db
    .prepare(
      `SELECT c.slug AS name, c.name AS label, COUNT(p.id) AS count
       FROM categories c
       JOIN products p ON p.category = c.slug AND p.active = 1
       WHERE c.active = 1
       GROUP BY c.slug, c.name
       ORDER BY c.sort_order ASC, c.name ASC`,
    )
    .all();

  const occasions = db
    .prepare(`SELECT occasions FROM products WHERE active = 1`)
    .all()
    .flatMap((row) => splitList(row.occasions));

  const occasionCounts = occasions.reduce((acc, o) => {
    acc[o] = (acc[o] || 0) + 1;
    return acc;
  }, {});

  const priceRange = db
    .prepare(
      'SELECT MIN(price_cents) AS min, MAX(price_cents) AS max FROM products WHERE active = 1',
    )
    .get();

  res.json({
    categories: categories.map((c) => ({ ...c, slug: c.name })),
    occasions: Object.entries(occasionCounts)
      .map(([name, count]) => ({ name, count, slug: name.toLowerCase().replace(/\s+/g, '-') }))
      .sort((a, b) => b.count - a.count),
    priceRange: {
      min: (priceRange.min || 0) / 100,
      max: (priceRange.max || 2000000) / 100,
    },
  });
});

router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE slug = ? AND active = 1').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Product not found' });

  const related = db
    .prepare(
      `SELECT * FROM products WHERE category = ? AND id != ? AND active = 1 ORDER BY RANDOM() LIMIT 4`,
    )
    .all(row.category, row.id);

  res.json({ product: productPayload(row), related: related.map(productPayload) });
});

/* ------------------------------ reviews ----------------------------- */

router.get('/:id/reviews', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC')
    .all(req.params.id);
  res.json({
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      name: r.name,
      createdAt: r.created_at,
    })),
  });
});

router.post('/:id/reviews', requireAuth, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 0));
  if (!rating) return res.status(400).json({ error: 'A rating is required' });

  const title = String(req.body?.title || '').trim();
  const body = String(req.body?.body || '').trim();
  if (body.length < 4) return res.status(400).json({ error: 'Please write a short review' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  db.prepare(
    'INSERT INTO product_reviews (product_id, user_id, name, rating, title, body) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(product.id, req.user.id, user?.name || 'Guest', rating, title, body);

  const stats = db
    .prepare('SELECT AVG(rating) AS avg, COUNT(*) AS c FROM product_reviews WHERE product_id = ?')
    .get(product.id);
  db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?').run(
    Math.round((stats.avg || 0) * 100) / 100,
    stats.c,
    product.id,
  );

  res.status(201).json({ ok: true });
});

export default router;
