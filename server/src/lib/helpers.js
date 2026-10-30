import { db } from '../db.js';

export const TAX_RATE = 0.16; // Kenya VAT
export const FREE_SHIPPING_THRESHOLD_CENTS = 750000; // KSh 7,500
export const FLAT_SHIPPING_CENTS = 40000; // KSh 400
export const STANDARD_DELIVERY = { min: 1, max: 2 };
export const EXPRESS_DELIVERY = { min: 0, max: 1 };

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

export const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function money(cents) {
  return Math.round(cents) / 100;
}

export function computeTotals(subtotalCents, coupon, shippingMethod = 'standard') {
  const shippingCents =
    shippingMethod === 'express'
      ? 80000
      : subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS || subtotalCents === 0
        ? 0
        : FLAT_SHIPPING_CENTS;

  let discountCents = 0;
  if (coupon) {
    if (coupon.kind === 'percent') {
      discountCents = Math.round((subtotalCents * coupon.value) / 100);
    } else {
      discountCents = Math.min(coupon.value, subtotalCents);
    }
  }

  const taxable = Math.max(0, subtotalCents - discountCents);
  const taxCents = Math.round(taxable * TAX_RATE);
  const totalCents = taxable + shippingCents + taxCents;

  return { subtotalCents, discountCents, shippingCents, taxCents, totalCents };
}

export function findCoupon(code) {
  if (!code) return null;
  const row = db
    .prepare('SELECT * FROM coupons WHERE code = ? COLLATE NOCASE')
    .get(String(code).trim());
  if (!row) return null;
  if (!row.active) return null;
  if (row.expires_at && new Date(row.expires_at + 'T23:59:59Z') < new Date()) return null;
  return row;
}

export function couponError(code, subtotalCents) {
  const coupon = findCoupon(code);
  if (!coupon) return 'That promo code is not valid.';
  if (subtotalCents < coupon.min_subtotal_cents) {
    return `This code requires a minimum order of KSh ${Math.round(money(coupon.min_subtotal_cents)).toLocaleString('en-KE')}.`;
  }
  return null;
}

export function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `HG-${stamp}-${rand}`;
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function uniqueSlug(base, ignoreId = null) {
  let slug = slugify(base) || 'product';
  let i = 1;
  for (;;) {
    const row = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
    if (!row || row.id === ignoreId) return slug;
    i += 1;
    slug = `${slugify(base)}-${i}`;
  }
}

export function uniqueCategorySlug(base, ignoreId = null) {
  let slug = slugify(base) || 'category';
  let i = 1;
  for (;;) {
    const row = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
    if (!row || row.id === ignoreId) return slug;
    i += 1;
    slug = `${slugify(base)}-${i}`;
  }
}

export function parseCategoryLinks(value) {
  let list = value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];

  return list
    .map((item) => {
      if (typeof item === 'string') {
        const [label, ...rest] = item.split('|');
        return { label: label.trim(), to: rest.join('|').trim() };
      }
      return {
        label: String(item?.label || '').trim(),
        to: String(item?.to || '').trim(),
      };
    })
    .filter((link) => link.label);
}

export function categoryLinks(value, slug) {
  const fallback = slug ? `/shop?category=${encodeURIComponent(slug)}` : '/shop';
  return parseCategoryLinks(value).map((link) => ({
    ...link,
    to: link.to || fallback,
  }));
}

export function categoryPayload(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    image: row.image || '',
    links: parseCategoryLinks(row.links),
    sortOrder: row.sort_order || 0,
    active: !!row.active,
    productCount: Number(row.product_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone || '',
    city: row.city || '',
    createdAt: row.created_at,
  };
}

export function productPayload(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    story: row.story || '',
    category: row.category,
    occasions: splitList(row.occasions),
    price: money(row.price_cents),
    priceCents: row.price_cents,
    compareAt: row.compare_at_cents ? money(row.compare_at_cents) : null,
    compareAtCents: row.compare_at_cents,
    discountPercent: row.compare_at_cents
      ? Math.round(((row.compare_at_cents - row.price_cents) / row.compare_at_cents) * 100)
      : 0,
    stock: row.stock,
    image: row.image,
    gallery: splitList(row.gallery),
    colors: splitList(row.colors),
    sizes: splitList(row.sizes) || ['Standard'],
    rating: Math.round((row.rating || 0) * 10) / 10,
    reviewCount: row.review_count || 0,
    soldCount: row.sold_count || 0,
    featured: !!row.featured,
    active: !!row.active,
    inStock: row.stock > 0,
    lowStock: row.stock > 0 && row.stock <= 5,
    createdAt: row.created_at,
  };
}

export function splitList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function orderPayload(row, items = []) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    subtotal: money(row.subtotal_cents),
    discount: money(row.discount_cents),
    shipping: money(row.shipping_cents),
    tax: money(row.tax_cents),
    total: money(row.total_cents),
    couponCode: row.coupon_code || null,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
    },
    shippingAddress: {
      address: row.ship_address,
      city: row.ship_city,
      state: row.ship_state,
      zip: row.ship_zip,
      country: row.ship_country,
    },
    notes: row.notes || '',
    trackingNumber: row.tracking_number || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.name,
      image: item.image,
      unitPrice: money(item.unit_price_cents),
      qty: item.qty,
      size: item.size,
      color: item.color,
      lineTotal: money(item.unit_price_cents * item.qty),
    })),
  };
}

/*
 * Coupon value units are polymorphic: a percent coupon stores a percentage,
 * a fixed coupon stores cents. The API always speaks dollars for fixed
 * amounts (and percent for percentages) so the admin form and the storefront
 * read the same number the user typed.
 */
export function couponPayload(row) {
  if (!row) return null;
  const fixed = row.kind === 'fixed';
  return {
    code: row.code,
    kind: row.kind,
    value: fixed ? money(row.value) : row.value,
    valueCents: fixed ? row.value : null,
    minSubtotal: money(row.min_subtotal_cents),
    minSubtotalCents: row.min_subtotal_cents,
    active: !!row.active,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

/* Normalise a coupon value from the API (dollars for fixed) into DB units. */
export function couponValueToCents(kind, value, valueCents) {
  if (valueCents !== undefined && valueCents !== null && valueCents !== '') {
    return Math.round(Number(valueCents));
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return kind === 'fixed' ? Math.round(numeric * 100) : Math.round(numeric);
}

export function serializeAddress(row) {
  return {
    id: row.id,
    label: row.label,
    recipient: row.recipient,
    phone: row.phone,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    country: row.country,
    isDefault: !!row.is_default,
  };
}
