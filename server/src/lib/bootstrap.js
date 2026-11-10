import { db } from '../db.js';
import { hashPassword } from '../auth.js';

/**
 * Make sure there is always at least one usable administrator account.
 *
 * Ephemeral hosts (Vercel's per-instance /tmp) start from an empty database
 * whenever the instance recycles. Without this, the administrator created via
 * /admin/register vanished and had to sign up with the access code again after
 * every restart. The account is only created when no admin exists, so a durable
 * database is never touched and a changed password is preserved.
 *
 * Configure it with ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME. The defaults are
 * the demo credentials documented in the README and should be changed in
 * production.
 */
export function ensureBootstrapAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (existing) return false;

  const name = String(process.env.ADMIN_NAME || 'Hinga Admin').trim() || 'Hinga Admin';
  const email = String(process.env.ADMIN_EMAIL || 'admin@hinga.shop').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || 'admin1234');

  // If the configured email already belongs to a customer, promote that row
  // instead of failing on the unique email constraint.
  const byEmail = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (byEmail) {
    db.prepare("UPDATE users SET role = 'admin', name = ? WHERE id = ?").run(name, byEmail.id);
    return true;
  }

  db.prepare(
    'INSERT INTO users (name, email, password_hash, role, phone, city) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(name, email, hashPassword(password), 'admin', '', 'Nairobi');

  return true;
}
