import { Router } from 'express';
import { db } from '../db.js';
import { categoryPayload } from '../lib/helpers.js';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*,
         (SELECT COUNT(*) FROM products p
           WHERE p.category = c.slug AND p.active = 1) AS product_count
       FROM categories c
       WHERE c.active = 1
       ORDER BY c.sort_order ASC, c.name ASC`,
    )
    .all();

  res.json({ categories: rows.map(categoryPayload) });
});

export default router;
