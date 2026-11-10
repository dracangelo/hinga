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
import { db, DB_DRIVER, DB_MODE, DB_TARGET } from './db.js';
import { seed } from './seed.js';
import { ensureBootstrapAdmin } from './lib/bootstrap.js';

// Auto-seed on cold start if database is empty (e.g. fresh Vercel /tmp instance)
try {
  const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get()?.count || 0;
  if (productCount === 0) {
    seed();
  }
} catch (e) {
  console.warn('Auto-seed skipped or failed:', e);
}

/*
 * Keep a working administrator account on ephemeral hosts. With a durable
 * database this is a no-op once an admin exists.
 */
try {
  if (ensureBootstrapAdmin()) {
    console.log(
      `[admin] Bootstrap administrator ready: ${process.env.ADMIN_EMAIL || 'admin@hinga.shop'}`,
    );
  }
} catch (e) {
  console.warn('Bootstrap administrator skipped or failed:', e);
}

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn(
    '[auth] JWT_SECRET is not set. Sessions use the development secret; set it to keep sessions stable and secure.',
  );
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4000;
const app = express();

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NOW_REGION,
);

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '6mb' }));
app.use(attachUser);

const uploadsDir = IS_SERVERLESS
  ? join(tmpdir(), 'uploads')
  : join(__dirname, '..', 'uploads');
try {
  mkdirSync(uploadsDir, { recursive: true });
} catch {}
app.use('/uploads', express.static(uploadsDir));

/*
 * Uploaded product images are stored in the database (see POST /api/admin/upload)
 * so they survive restarts and are visible to every instance. Static files above
 * still cover uploads made before that change.
 */
app.get('/uploads/:name', (req, res) => {
  let image = null;
  try {
    image = db.prepare('SELECT mime, data FROM uploads WHERE name = ?').get(req.params.name);
  } catch {
    image = null;
  }
  if (!image) return res.status(404).json({ error: 'Image not found' });

  const bytes = Buffer.from(image.data);
  res.set('Content-Type', image.mime || 'application/octet-stream');
  res.set('Content-Length', String(bytes.length));
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.end(bytes);
});

const apiRouter = express.Router();

apiRouter.get('/health', (_req, res) => {
  let productCount = null;
  try {
    productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get()?.count ?? 0;
  } catch {}
  res.json({
    ok: true,
    service: 'hinga-api',
    time: new Date().toISOString(),
    node: process.version,
    env: process.env.NODE_ENV || 'development',
    serverless: IS_SERVERLESS,
    dbMode: DB_MODE,
    dbDriver: DB_DRIVER,
    dbTarget: DB_TARGET,
    products: productCount,
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/cart', cartRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/landscaping', landscapingRoutes);
apiRouter.use('/admin', adminRoutes);

apiRouter.post('/newsletter', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }
  db.prepare('INSERT OR IGNORE INTO newsletter (email) VALUES (?)').run(email);
  res.json({ ok: true, message: "You're on the list — welcome to the Hinga bloom club." });
});

// Mount under both /api and root so requests work whether Vercel strips the prefix or preserves it
app.use('/api', apiRouter);
app.use(apiRouter);

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
    console.log(
      `  Admin login: ${process.env.ADMIN_EMAIL || 'admin@hinga.shop'} / ${process.env.ADMIN_PASSWORD || 'admin1234'}`,
    );
    console.log(
      `  Admin sign-up: ${adminSignupEnabled() ? 'enabled' : 'disabled (set ADMIN_SIGNUP_CODE to enable)'}\n`,
    );
  });
}

export default app;
