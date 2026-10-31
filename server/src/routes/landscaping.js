import { Router } from 'express';
import { db } from '../db.js';
import { requireAdmin, requireAuth } from '../auth.js';

const router = Router();

export const SITE_TYPES = [
  'home-garden',
  'courtyard',
  'rooftop',
  'office',
  'hospitality',
  'school',
];

export const TIMELINES = ['asap', 'within-a-month', 'one-to-three-months', 'planning'];

export const BUDGETS = ['under-50k', '50k-150k', '150k-400k', 'over-400k', 'unsure'];

export const REQUEST_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];

const oneOf = (value, allowed, fallback = '') => {
  const clean = String(value || '').trim();
  return allowed.includes(clean) ? clean : fallback;
};

function reference() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `LS-${stamp}-${rand}`;
}

function messagesFor(requestId) {
  return db
    .prepare('SELECT * FROM landscaping_messages WHERE request_id = ? ORDER BY id ASC')
    .all(requestId)
    .map((row) => ({
      id: row.id,
      author: row.author,
      authorName: row.author_name,
      body: row.body,
      createdAt: row.created_at,
    }));
}

export function requestPayload(row) {
  return {
    id: row.id,
    reference: row.reference,
    name: row.name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    landSize: row.land_size,
    siteType: row.site_type,
    preferredFlowers: row.preferred_flowers
      ? row.preferred_flowers.split(',').map((item) => item.trim()).filter(Boolean)
      : [],
    timeline: row.timeline,
    budget: row.budget,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages: messagesFor(row.id),
  };
}

/* ------------------------------------------------------------------ */
/* Public: request a quotation                                         */
/* ------------------------------------------------------------------ */

router.post('/', (req, res) => {
  const b = req.body || {};
  const errors = [];

  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const phone = String(b.phone || '').trim();
  const location = String(b.location || '').trim();
  const landSize = String(b.landSize || '').trim();
  const flowers = Array.isArray(b.preferredFlowers)
    ? b.preferredFlowers.map((item) => String(item).trim()).filter(Boolean)
    : String(b.preferredFlowers || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  if (!name) errors.push('Your name is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address');
  if (!phone) errors.push('A phone number is required');
  if (!location) errors.push('Tell us where the site is');
  if (!landSize) errors.push('Approximate land size is required');
  if (errors.length) return res.status(400).json({ error: errors[0], errors });

  const siteType = oneOf(b.siteType, SITE_TYPES, 'home-garden');
  const timeline = oneOf(b.timeline, TIMELINES);
  const budget = oneOf(b.budget, BUDGETS);
  const notes = String(b.notes || '').trim().slice(0, 2000);
  const ref = reference();

  const info = db
    .prepare(
      `INSERT INTO landscaping_requests (
         reference, user_id, name, email, phone, location, land_size,
         site_type, preferred_flowers, timeline, budget, notes
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      ref,
      req.user?.id ?? null,
      name,
      email,
      phone,
      location,
      landSize,
      siteType,
      flowers.slice(0, 12).join(', '),
      timeline,
      budget,
      notes,
    );

  const row = db.prepare('SELECT * FROM landscaping_requests WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({
    request: requestPayload(row),
    message: `Thank you, ${name.split(' ')[0]}. Your quotation request is with the garden team.`,
  });
});

/* ------------------------------------------------------------------ */
/* Customer: the requests they have sent                               */
/* ------------------------------------------------------------------ */

router.get('/mine', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM landscaping_requests WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  res.json({ requests: rows.map(requestPayload) });
});

/* ------------------------------------------------------------------ */
/* Thread: the customer writes, the studio answers                     */
/* ------------------------------------------------------------------ */

router.post('/:id/messages', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT * FROM landscaping_requests WHERE id = ?')
    .get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Request not found' });

  const fromStudio = req.user.role === 'admin';
  if (!fromStudio && row.user_id !== req.user.id) {
    return res.status(403).json({ error: 'This request belongs to another account' });
  }
  if (!fromStudio && row.status === 'lost') {
    return res.status(409).json({ error: 'This request is closed — start a new one and we will pick it up.' });
  }

  const body = String(req.body?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Write a message first' });
  if (body.length > 2000) return res.status(400).json({ error: 'Keep your message under 2000 characters' });

  db.prepare(
    `INSERT INTO landscaping_messages (request_id, author, author_name, body)
     VALUES (?, ?, ?, ?)`,
  ).run(row.id, fromStudio ? 'studio' : 'customer', req.user.name || row.name, body);

  /* Answering a fresh request means the studio has made contact. */
  const status = fromStudio && row.status === 'new' ? 'contacted' : row.status;
  db.prepare(
    "UPDATE landscaping_requests SET status = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(status, row.id);

  const updated = db.prepare('SELECT * FROM landscaping_requests WHERE id = ?').get(row.id);
  res.status(201).json({
    request: requestPayload(updated),
    message: fromStudio
      ? `Reply sent to ${row.name.split(' ')[0]}.`
      : 'Message sent to the garden team.',
  });
});

/* ------------------------------------------------------------------ */
/* Admin: review and update requests                                   */
/* ------------------------------------------------------------------ */

router.get('/', requireAdmin, (req, res) => {
  const status = oneOf(req.query.status, REQUEST_STATUSES, '');
  const rows = status
    ? db
        .prepare('SELECT * FROM landscaping_requests WHERE status = ? ORDER BY id DESC')
        .all(status)
    : db.prepare('SELECT * FROM landscaping_requests ORDER BY id DESC').all();

  const counts = db
    .prepare('SELECT status, COUNT(*) AS count FROM landscaping_requests GROUP BY status')
    .all()
    .reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {});

  res.json({ requests: rows.map(requestPayload), counts });
});

router.patch('/:id', requireAdmin, (req, res) => {
  const row = db
    .prepare('SELECT * FROM landscaping_requests WHERE id = ?')
    .get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Request not found' });

  const status = oneOf(req.body?.status, REQUEST_STATUSES, '');
  if (!status) return res.status(400).json({ error: 'Choose a valid status' });

  db.prepare(
    "UPDATE landscaping_requests SET status = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(status, row.id);

  const updated = db.prepare('SELECT * FROM landscaping_requests WHERE id = ?').get(row.id);
  res.json({ request: requestPayload(updated) });
});

router.delete('/:id', requireAdmin, (req, res) => {
  const row = db
    .prepare('SELECT * FROM landscaping_requests WHERE id = ?')
    .get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Request not found' });
  db.prepare('DELETE FROM landscaping_requests WHERE id = ?').run(row.id);
  res.status(204).end();
});

export default router;
