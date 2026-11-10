import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { db } from './db.js';

const SECRET = process.env.JWT_SECRET || 'hinga-dev-secret-change-me';

/*
 * 30 days: a shop session should survive a browser restart, and every request
 * still verifies the signature and expiry. Shortening this forces customers
 * back to the login page for no real gain, since nothing can revoke a token
 * early today.
 */
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

/*
 * Administrator self-sign-up is gated behind a shared access code. Set
 * ADMIN_SIGNUP_CODE to enable it; outside production a development fallback is
 * used so the feature works straight after `npm run dev`.
 */
const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

const DEV_ADMIN_SIGNUP_CODES = ['samhin-admin', 'hinga-admin'];

export function adminSignupCode() {
  const configured = String(process.env.ADMIN_SIGNUP_CODE || '').trim();
  if (configured) return configured;
  return IS_PRODUCTION ? '' : 'samhin-admin';
}

export function adminSignupEnabled() {
  return Boolean(adminSignupCode());
}

export function verifyAdminSignupCode(candidate) {
  const configured = String(process.env.ADMIN_SIGNUP_CODE || '').trim();
  const input = String(candidate || '').trim();
  if (!input) return false;

  const validCodes = configured ? [configured] : (IS_PRODUCTION ? [] : DEV_ADMIN_SIGNUP_CODES);
  return validCodes.some((code) => {
    const a = createHash('sha256').update(input).digest();
    const b = createHash('sha256').update(code).digest();
    return timingSafeEqual(a, b);
  });
}

/* ------------------------------------------------------------------ */
/* Password hashing                                                    */
/* ------------------------------------------------------------------ */

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, salt, hash] = String(stored).split(':');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Minimal HS256 JWT                                                   */
/* ------------------------------------------------------------------ */

const b64 = (input) => Buffer.from(input).toString('base64url');

function sign(data) {
  return createHmac('sha256', SECRET).update(data).digest('base64url');
}

export function signToken(payload, ttl = TOKEN_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttl };
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const claims = b64(JSON.stringify(body));
  return `${header}.${claims}.${sign(`${header}.${claims}`)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, claims, signature] = parts;
  const expected = sign(`${header}.${claims}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(claims, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Express middleware                                                  */
/* ------------------------------------------------------------------ */

export function attachUser(req, _res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return next();

  /*
   * Resolve the account from the database rather than trusting the token's
   * cached role. If an ephemeral deployment recreated the database, user ids
   * can shift, so fall back to the email claim when the id no longer matches
   * that email. This keeps a signed-in administrator signed in after a cold
   * start without ever conflating two different accounts.
   */
  const email = String(payload.email || '').toLowerCase();
  try {
    let user = db
      .prepare('SELECT id, role, name, email FROM users WHERE id = ?')
      .get(payload.sub);

    if (user && email && String(user.email).toLowerCase() !== email) user = null;
    if (!user && email) {
      user = db
        .prepare('SELECT id, role, name, email FROM users WHERE email = ?')
        .get(email);
    }

    if (user) {
      req.user = {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        tokenIssuedAt: Number(payload.iat) || 0,
        tokenExpiresAt: Number(payload.exp) || 0,
      };
    }
  } catch {
    /*
     * A transient database failure should not log everyone out. Trust the
     * verified token until the database is reachable again; endpoints that
     * touch data will surface their own error.
     */
    req.user = {
      id: payload.sub,
      role: payload.role,
      name: payload.name,
      email: payload.email,
      tokenIssuedAt: Number(payload.iat) || 0,
      tokenExpiresAt: Number(payload.exp) || 0,
    };
  }

  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}
