import './env.js'; // must be first: loads .env before other modules read process.env
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

import { adminSignupEnabled, attachUser } from './auth.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import landscapingRoutes from './routes/landscaping.js';
import adminRoutes from './routes/admin.js';
import { db } from './db.js';
import { seed } from './seed.js';

// Auto-seed on cold start if database is empty (e.g. fresh Vercel /tmp instance)
try {
  const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get()?.count || 0;
  if (productCount === 0) {
    seed();
  }
} catch (e) {
  console.warn('Auto-seed skipped or failed:', e);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;
const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '25mb' }));
app.use(attachUser);

const uploadsDir = process.env.VERCEL
  ? join(tmpdir(), 'uploads')
  : join(__dirname, '..', 'uploads');
try {
  mkdirSync(uploadsDir, { recursive: true });
} catch {}
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'hinga-api', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/landscaping', landscapingRoutes);
app.use('/api/admin', adminRoutes);

app.post('/api/newsletter', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  db.prepare('INSERT OR IGNORE INTO newsletter (email) VALUES (?)').run(email);
  res.json({ ok: true, message: "You're on the list — welcome to the Hinga bloom club." });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

// Serve the built SPA in production.
const webDist = join(__dirname, '..', '..', 'web', 'dist');
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/.*/, (_req, res) => res.sendFile(join(webDist, 'index.html')));
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n  Hinga API listening on http://localhost:${PORT}`);
    console.log(`  Admin login: admin@hinga.shop / admin1234`);
    console.log(
      `  Admin sign-up: ${adminSignupEnabled() ? 'enabled' : 'disabled (set ADMIN_SIGNUP_CODE to enable)'}\n`,
    );
  });
}

export default app;
