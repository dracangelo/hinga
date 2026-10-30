/* Prices are Kenyan shillings. Whole amounts read best without trailing zeros. */
const KES_WHOLE = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 });
const KES_CENTS = new Intl.NumberFormat('en-KE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const money = (value) => {
  const amount = Number(value) || 0;
  const hasCents = Math.abs(amount % 1) > 0.004;
  return `KSh ${(hasCents ? KES_CENTS : KES_WHOLE).format(amount)}`;
};

export const compactMoney = (value) => {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 10000) {
    const thousands = amount / 1000;
    const digits = Math.abs(thousands) >= 100 ? 0 : 1;
    return `KSh ${thousands.toFixed(digits).replace(/\.0$/, '')}K`;
  }
  return money(amount);
};

export function formatDate(value, options = {}) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T') + (String(value).length <= 10 ? '' : 'Z'));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeTime(value) {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T') + 'Z');
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export const titleCase = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export const ORDER_STATUS_META = {
  pending: { label: 'Pending', className: 'bg-gold-soft text-gold', dot: 'bg-gold' },
  confirmed: { label: 'Confirmed', className: 'bg-sage-soft text-forest', dot: 'bg-sage' },
  preparing: { label: 'Preparing', className: 'bg-rose-soft text-rose', dot: 'bg-rose' },
  out_for_delivery: {
    label: 'Out for delivery',
    className: 'bg-blush text-rose',
    dot: 'bg-rose',
  },
  delivered: { label: 'Delivered', className: 'bg-forest text-white', dot: 'bg-forest' },
  cancelled: { label: 'Cancelled', className: 'bg-parchment text-ink-faint', dot: 'bg-ink-faint' },
};

export const PAYMENT_STATUS_META = {
  unpaid: { label: 'Unpaid', className: 'bg-gold-soft text-gold' },
  paid: { label: 'Paid', className: 'bg-sage-soft text-forest' },
  refunded: { label: 'Refunded', className: 'bg-parchment text-ink-soft' },
};

export const ORDER_STATUS_FLOW = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
];
