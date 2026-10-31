import { Router } from 'express';
import { db } from '../db.js';
import {
  adminSignupEnabled,
  hashPassword,
  requireAuth,
  signToken,
  verifyAdminSignupCode,
  verifyPassword,
} from '../auth.js';
import { publicUser } from '../lib/helpers.js';

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sessionFor(user) {
  return {
    token: signToken({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    }),
    user: publicUser(user),
  };
}

function createAccount({ name, email, password, phone, role }) {
  const info = db
    .prepare(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
    )
    .run(name, email, hashPassword(password), role, phone);

  return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
}

function validateDetails({ name, email, password }) {
  if (!name) return 'Name is required';
  if (!EMAIL_RE.test(email)) return 'Enter a valid email address';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

router.post('/register', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const phone = String(req.body?.phone || '').trim();

  const invalid = validateDetails({ name, email, password });
  if (invalid) return res.status(400).json({ error: invalid });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const user = createAccount({ name, email, password, phone, role: 'customer' });
  res.status(201).json(sessionFor(user));
});

/*
 * Administrators can create their own account when an access code is
 * configured. The code is checked before validation so an invalid code never
 * reveals which email addresses already exist.
 */
router.post('/admin/register', (req, res) => {
  if (!adminSignupEnabled()) {
    return res.status(503).json({
      error:
        'Administrator sign-up is disabled. Set ADMIN_SIGNUP_CODE on the server to enable it.',
    });
  }

  const code = String(req.body?.adminCode ?? req.body?.inviteCode ?? '');
  if (!verifyAdminSignupCode(code)) {
    return res.status(403).json({ error: 'Incorrect administrator access code' });
  }

  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const phone = String(req.body?.phone || '').trim();

  const invalid = validateDetails({ name, email, password });
  if (invalid) return res.status(400).json({ error: invalid });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const user = createAccount({ name, email, password, phone, role: 'admin' });
  res.status(201).json(sessionFor(user));
});

router.get('/admin/signup-status', (_req, res) => {
  res.json({ enabled: adminSignupEnabled() });
});

router.post('/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  res.json(sessionFor(user));
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

router.patch('/me', requireAuth, (req, res) => {
  const name = req.body?.name !== undefined ? String(req.body.name).trim() : undefined;
  const phone = req.body?.phone !== undefined ? String(req.body.phone).trim() : undefined;
  const city = req.body?.city !== undefined ? String(req.body.city).trim() : undefined;
  const password = req.body?.password ? String(req.body.password) : undefined;

  if (name !== undefined && !name) return res.status(400).json({ error: 'Name is required' });
  if (password && password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!current) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET name = ?, phone = ?, city = ? WHERE id = ?').run(
    name ?? current.name,
    phone ?? current.phone,
    city ?? current.city,
    req.user.id,
  );
  if (password) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
      hashPassword(password),
      req.user.id,
    );
  }

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(updated) });
});

/* -------------------------- saved addresses ------------------------- */

router.get('/addresses', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC')
    .all(req.user.id);
  res.json({ addresses: rows });
});

router.post('/addresses', requireAuth, (req, res) => {
  const b = req.body || {};
  if (!b.recipient || !b.address || !b.city) {
    return res.status(400).json({ error: 'Recipient, address and city are required' });
  }
  const info = db
    .prepare(
      `INSERT INTO addresses (user_id, label, recipient, phone, address, city, state, zip, country, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      req.user.id,
      b.label || 'Home',
      b.recipient,
      b.phone || '',
      b.address,
      b.city,
      b.state || '',
      b.zip || '',
      b.country || 'US',
      b.isDefault ? 1 : 0,
    );
  const row = db.prepare('SELECT * FROM addresses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ address: row });
});

router.delete('/addresses/:id', requireAuth, (req, res) => {
  db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ ok: true });
});

export default router;
