import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowRight,
  Plus,
  FolderTree,
  ClipboardList,
  Flower2,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import {
  Blossom,
  ImageWithFallback,
  PaymentBadge,
  Spinner,
  StatusBadge,
} from '../../components/ui.jsx';
import { compactMoney, formatDate, money, ORDER_STATUS_META } from '../../lib/format.js';

/* Aggregates read better in whole shillings; order rows keep their cents. */
const wholeShillings = (value) => money(Math.round(Number(value) || 0));

/* Status colours as hex values — ORDER_STATUS_META.dot holds class names,
   which cannot be used for SVG strokes or inline styles. */
const STATUS_HEX = {
  pending: '#b3893c',
  confirmed: '#6f8f79',
  preparing: '#b25f6b',
  out_for_delivery: '#c07a52',
  delivered: '#22392f',
  cancelled: '#a49a8b',
};

const AVATARS = [
  'bg-blush text-rose',
  'bg-sage-soft text-forest',
  'bg-clay-soft text-clay',
  'bg-gold-soft text-gold',
];

const shortDay = (value) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

function Panel({ eyebrow, title, action, children, bodyClassName = '', className = '' }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-sand/60 px-5 py-4 md:px-6">
        <div>
          {eyebrow && (
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-clay">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-0.5 font-display text-lg leading-snug text-forest">{title}</h2>
        </div>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({ icon: Icon, label, value, meta, tone = 'sage', hero = false }) {
  const tones = {
    sage: 'bg-sage-soft text-forest',
    rose: 'bg-rose-soft text-rose',
    gold: 'bg-clay-soft text-clay',
    forest: 'bg-forest text-cream',
  };

  if (hero) {
    return (
      <div className="relative isolate overflow-hidden rounded-[1.5rem] bg-forest p-5 text-cream shadow-[0_18px_40px_-30px_rgba(34,57,47,0.9)]">
        <Blossom
          size={150}
          strokeWidth={0.5}
          className="pointer-events-none absolute -bottom-8 -right-6 text-cream/10"
        />
        <div className="relative flex items-start justify-between gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-cream/10 text-cream">
            <Icon size={18} />
          </span>
          <span className="text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-cream/60 sm:text-[0.6rem] sm:tracking-[0.2em]">
            {label}
          </span>
        </div>
        <p className="relative mt-5 font-display text-[1.7rem] leading-none text-cream sm:text-[2.1rem]">
          {value}
        </p>
        {meta && <p className="relative mt-2 text-xs text-cream/70">{meta}</p>}
      </div>
    );
  }

  return (
    <div className="card-petal flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-full ${tones[tone]}`}>
          <Icon size={18} />
        </span>
        <span className="text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-ink-faint sm:text-[0.6rem] sm:tracking-[0.2em]">
          {label}
        </span>
      </div>
      <p className="mt-5 font-display text-[1.7rem] leading-none text-ink sm:text-[2.1rem]">
        {value}
      </p>
      {meta && <p className="mt-2 text-xs text-ink-soft">{meta}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Revenue chart                                                       */
/* ------------------------------------------------------------------ */

function RevenueChart({ series }) {
  if (!series.length) {
    return <p className="py-16 text-center text-sm text-ink-faint">No revenue recorded yet.</p>;
  }

  const width = 760;
  const height = 300;
  const padding = { top: 22, right: 16, bottom: 34, left: 96 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const rawMax = Math.max(...series.map((point) => point.revenue), 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawMax));
  const step = magnitude / 2;
  const max = Math.ceil(rawMax / step) * step;
  const pointStep = series.length > 1 ? innerW / (series.length - 1) : innerW;

  const points = series.map((point, index) => ({
    ...point,
    x: padding.left + index * pointStep,
    y: padding.top + innerH - (point.revenue / max) * innerH,
  }));

  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${padding.left},${padding.top + innerH} ${line} ${padding.left + innerW},${
    padding.top + innerH
  }`;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    y: padding.top + innerH - fraction * innerH,
    value: max * fraction,
  }));

  const last = points[points.length - 1];
  const labelEvery = Math.max(1, Math.ceil(series.length / 5));
  const lastIndex = points.length - 1;
  const labelIndices = [];
  for (let index = 0; index <= lastIndex; index += labelEvery) labelIndices.push(index);
  const previousLabel = labelIndices[labelIndices.length - 1];
  if (previousLabel !== lastIndex && lastIndex - previousLabel >= Math.ceil(labelEvery / 2)) {
    labelIndices.push(lastIndex);
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Revenue across the last ${series.length} days with orders, totalling ${money(
        series.reduce((sum, point) => sum + point.revenue, 0),
      )}`}
    >
      <defs>
        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8aa48d" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#8aa48d" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((tick) => (
        <g key={tick.y}>
          <line
            x1={padding.left}
            y1={tick.y}
            x2={padding.left + innerW}
            y2={tick.y}
            stroke="#e4d8c3"
            strokeWidth="1"
            strokeDasharray="2 5"
          />
          <text
            x={padding.left - 12}
            y={tick.y + 4}
            textAnchor="end"
            className="fill-ink-faint text-[18px] md:text-[13px]"
          >
            {compactMoney(tick.value)}
          </text>
        </g>
      ))}

      <polygon points={area} fill="url(#revenueFill)" />
      <polyline
        points={line}
        fill="none"
        stroke="#22392f"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((point) => (
        <circle
          key={point.day}
          cx={point.x}
          cy={point.y}
          r="3.2"
          fill="#fcf8f1"
          stroke="#22392f"
          strokeWidth="1.8"
        >
          <title>{`${formatDate(point.day)}: ${money(point.revenue)} from ${point.orders} orders`}</title>
        </circle>
      ))}

      <circle cx={last.x} cy={last.y} r="5.5" fill="#22392f" stroke="#fcf8f1" strokeWidth="2.5" />

      {points.map((point, index) => {
        if (!labelIndices.includes(index)) return null;
        const anchor = index === 0 ? 'start' : index === lastIndex ? 'end' : 'middle';
        return (
          <text
            key={`label-${point.day}`}
            x={point.x}
            y={height - 10}
            textAnchor={anchor}
            className="fill-ink-faint text-[17px] md:text-[12.5px]"
          >
            {shortDay(point.day)}
          </text>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Status donut                                                        */
/* ------------------------------------------------------------------ */

function StatusDonut({ statusCounts, total }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const gap = 3;
  const segments = statusCounts.filter((entry) => entry.count > 0);
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative shrink-0" style={{ width: 152, height: 152 }}>
        <svg viewBox="0 0 168 168" className="h-full w-full -rotate-90">
          <circle cx="84" cy="84" r={radius} fill="none" stroke="#f0e9db" strokeWidth="17" />
          {segments.map((segment) => {
            const length = (segment.count / Math.max(total, 1)) * circumference;
            const dash = `${Math.max(length - gap, 1)} ${circumference - Math.max(length - gap, 1)}`;
            const color = STATUS_HEX[segment.status] || '#b3893c';
            const circle = (
              <circle
                key={segment.status}
                cx="84"
                cy="84"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="17"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              >
                <title>{`${segment.status}: ${segment.count}`}</title>
              </circle>
            );
            offset += length;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-[1.75rem] leading-none text-forest">{total}</p>
            <p className="mt-1 text-[0.6rem] uppercase tracking-[0.18em] text-ink-faint">orders</p>
          </div>
        </div>
      </div>

      <ul className="w-full space-y-0.5">
        {statusCounts.map((entry) => {
          const share = Math.round((entry.count / Math.max(total, 1)) * 100);
          return (
            <li key={entry.status}>
              <Link
                to={`/admin/orders?status=${entry.status}`}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-parchment/70"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_HEX[entry.status] || '#b3893c' }}
                />
                <span className="flex-1 text-ink-soft">
                  {ORDER_STATUS_META[entry.status]?.label || entry.status}
                </span>
                <span className="text-xs tabular-nums text-ink-faint">{share}%</span>
                <span className="w-5 text-right font-medium tabular-nums text-ink">
                  {entry.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.adminStats(), api.adminOrders({ limit: 6 })])
      .then(([statsData, ordersData]) => {
        setStats(statsData);
        setOrders(ordersData.orders || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [],
  );

  if (loading) return <Spinner label="Loading dashboard" />;
  if (!stats) return <p className="text-sm text-ink-soft">Could not load dashboard data.</p>;

  const { totals } = stats;
  const restockCount = totals.lowStock + totals.outOfStock;

  return (
    <div className="space-y-5">
      {/* ---------------------------- greeting ---------------------------- */}
      <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-sand/70 bg-gradient-to-br from-parchment via-cream to-mist">
        <div
          aria-hidden="true"
          className="bg-fern pointer-events-none absolute inset-0 opacity-30"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6 px-6 py-6 md:px-8 md:py-7">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Sparkles size={12} className="text-clay/70" />
              {today}
            </p>
            <h2 className="mt-2 font-display text-[clamp(1.5rem,2.6vw,2rem)] leading-tight text-forest">
              {greeting}.
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-soft">
              {totals.todayOrders > 0
                ? `${totals.todayOrders} ${totals.todayOrders === 1 ? 'order' : 'orders'} in today, worth ${wholeShillings(
                    totals.todayRevenue,
                  )}. Here is how the studio is doing.`
                : 'No orders in yet today — a good moment to refresh the shop.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/products/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> Add product
            </Link>
            <Link to="/admin/categories?new=1" className="btn btn-secondary btn-sm">
              <FolderTree size={14} /> Add category
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------- metrics ----------------------------- */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          hero
          icon={DollarSign}
          label="Total revenue"
          value={wholeShillings(totals.revenue)}
          meta={`Today ${wholeShillings(totals.todayRevenue)} · Avg order ${wholeShillings(totals.avgOrder)}`}
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders"
          value={totals.orders}
          meta={`${totals.todayOrders} placed today`}
          tone="sage"
        />
        <StatCard
          icon={TrendingUp}
          label="Units sold"
          value={totals.unitsSold.toLocaleString('en-US')}
          meta={`${totals.products} products in the catalogue`}
          tone="gold"
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={totals.customers}
          meta="Registered customers"
          tone="rose"
        />
      </div>

      {restockCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-[1.15rem] border border-clay/25 bg-clay-soft/60 px-4 py-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream/80 text-clay">
            <AlertTriangle size={15} />
          </span>
          <p className="text-sm text-ink">
            <span className="font-medium">
              {restockCount} {restockCount === 1 ? 'product' : 'products'}
            </span>{' '}
            {restockCount === 1 ? 'needs' : 'need'} restocking
            {totals.outOfStock > 0 && ` — ${totals.outOfStock} already sold out`}.
          </p>
          <Link
            to="/admin/products?stock=low"
            className="btn btn-secondary btn-sm ml-auto shrink-0"
          >
            Review inventory <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* ----------------------------- charts ----------------------------- */}
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          eyebrow="Sales"
          title="Revenue over time"
          action={
            <div className="text-right">
              <p className="font-display text-xl leading-none text-forest">
                {compactMoney(
                  seriesTotal(stats.revenueSeries) / Math.max(stats.revenueSeries.length, 1),
                )}
              </p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.16em] text-ink-faint">
                avg / trading day
              </p>
            </div>
          }
          bodyClassName="pb-4"
        >
          <div className="px-2 pt-4 md:px-3">
            <RevenueChart series={stats.revenueSeries} />
          </div>
          <div className="mx-5 mt-2 grid grid-cols-3 gap-4 border-t border-sand/60 pt-4 md:mx-6">
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Best day
              </p>
              <p className="mt-1 font-display text-base text-forest">
                {compactMoney(stats.revenueSeries.reduce((best, p) => Math.max(best, p.revenue), 0))}
              </p>
            </div>
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                In period
              </p>
              <p className="mt-1 font-display text-base text-forest">
                {compactMoney(seriesTotal(stats.revenueSeries))}
              </p>
            </div>
            <div>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                Orders
              </p>
              <p className="mt-1 font-display text-base text-forest">
                {stats.revenueSeries.reduce((sum, p) => sum + p.orders, 0)}
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          eyebrow="Fulfilment"
          title="Orders by status"
          action={
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-forest transition-colors hover:text-clay"
            >
              All orders <ArrowUpRight size={13} />
            </Link>
          }
          bodyClassName="px-5 py-5 md:px-6"
        >
          <StatusDonut statusCounts={stats.statusCounts} total={totals.orders} />
        </Panel>
      </div>

      {/* --------------------------- orders ------------------------------- */}
      <Panel
        eyebrow="Operations"
        title="Recent orders"
        action={
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-forest transition-colors hover:text-clay"
          >
            View all <ArrowRight size={13} />
          </Link>
        }
        bodyClassName=""
      >
        <div className="divide-y divide-sand/40 md:hidden">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/admin/orders/${order.id}`}
              className="block px-5 py-3.5 transition-colors hover:bg-parchment/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-forest">{order.orderNumber}</p>
                  <p className="text-xs text-ink-faint">{formatDate(order.createdAt)}</p>
                </div>
                <p className="shrink-0 font-medium tabular-nums text-ink">{money(order.total)}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusBadge status={order.status} />
                <PaymentBadge status={order.paymentStatus} />
                <span className="ml-auto max-w-[10rem] truncate text-xs text-ink-soft">
                  {order.customer.name}
                </span>
              </div>
            </Link>
          ))}
          {orders.length === 0 && (
            <p className="px-5 py-12 text-center text-ink-faint">No orders yet</p>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand/70 bg-cream/50 text-left text-[0.6rem] uppercase tracking-[0.16em] text-ink-faint">
              <th className="px-5 py-2.5 font-semibold md:px-6">Order</th>
              <th className="px-5 py-2.5 font-semibold">Customer</th>
              <th className="px-5 py-2.5 font-semibold">Status</th>
              <th className="px-5 py-2.5 font-semibold">Payment</th>
              <th className="px-5 py-2.5 text-right font-semibold md:px-6">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-sand/40 transition-colors last:border-0 hover:bg-parchment/40"
              >
                <td className="px-5 py-3 md:px-6">
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="font-medium text-forest hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <span className="mt-0.5 block text-xs text-ink-faint">
                    {formatDate(order.createdAt)}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold ${
                        AVATARS[order.customer.name.length % AVATARS.length]
                      }`}
                    >
                      {initials(order.customer.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-ink">{order.customer.name}</span>
                      <span className="block truncate text-xs text-ink-faint">
                        {order.customer.email}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3">
                  <PaymentBadge status={order.paymentStatus} />
                </td>
                <td className="px-5 py-3 text-right font-medium tabular-nums text-ink md:px-6">
                  {money(order.total)}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-ink-faint">
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </Panel>

      {/* --------------------------- lists -------------------------------- */}
      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Panel eyebrow="Merchandising" title="Top products" bodyClassName="px-5 py-4 md:px-6">
          <ul className="space-y-3.5">
            {stats.topProducts.map((product, index) => {
              const share =
                stats.topProducts[0]?.revenue > 0
                  ? (product.revenue / stats.topProducts[0].revenue) * 100
                  : 0;
              return (
                <li key={product.name}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-sm tabular-nums text-clay">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{product.name}</span>
                      <span className="block text-xs text-ink-faint">{product.units} units</span>
                    </span>
                    <span className="text-sm font-medium tabular-nums text-ink">
                      {money(product.revenue)}
                    </span>
                  </div>
                  <div className="ml-7 mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-sand/50">
                    <div
                      className="h-full rounded-full bg-sage"
                      style={{ width: `${Math.max(6, share)}%` }}
                    />
                  </div>
                </li>
              );
            })}
            {stats.topProducts.length === 0 && (
              <li className="text-sm text-ink-faint">No sales recorded yet.</li>
            )}
          </ul>
        </Panel>

        <Panel eyebrow="Customers" title="Top spenders" bodyClassName="px-5 py-4 md:px-6">
          <ul className="space-y-3">
            {stats.topCustomers.map((customer, index) => (
              <li key={customer.email} className="flex items-center gap-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold ${
                    AVATARS[index % AVATARS.length]
                  }`}
                >
                  {initials(customer.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{customer.name}</span>
                  <span className="block text-xs text-ink-faint">
                    {customer.orders} {customer.orders === 1 ? 'order' : 'orders'}
                  </span>
                </span>
                <span className="text-sm font-medium tabular-nums text-ink">
                  {money(customer.spend)}
                </span>
              </li>
            ))}
            {stats.topCustomers.length === 0 && (
              <li className="text-sm text-ink-faint">No customers yet.</li>
            )}
          </ul>
        </Panel>

        <Panel
          eyebrow="Inventory"
          title="Low stock"
          action={<span className="badge bg-clay-soft text-clay">{stats.lowStock.length}</span>}
          bodyClassName="px-5 py-4 md:px-6"
        >
          <ul className="space-y-3">
            {stats.lowStock.map((product) => (
              <li key={product.id} className="flex items-center gap-3">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="arch-banner h-11 w-10 shrink-0 object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{product.name}</span>
                  <span className="block text-xs text-ink-faint">SKU #{product.id}</span>
                </span>
                <span
                  className={`badge shrink-0 ${
                    product.stock === 0 ? 'bg-rose-soft text-rose' : 'bg-clay-soft text-clay'
                  }`}
                >
                  {product.stock === 0 ? 'Out' : `${product.stock} left`}
                </span>
              </li>
            ))}
            {stats.lowStock.length === 0 && (
              <li className="text-sm text-ink-faint">Everything is well stocked.</li>
            )}
          </ul>
          <Link
            to="/admin/products"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-forest transition-colors hover:text-clay"
          >
            Manage inventory <ArrowRight size={13} />
          </Link>
        </Panel>
      </div>

      {/* --------------------------- quick links --------------------------- */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { to: '/admin/orders', label: 'Fulfil today’s orders', icon: ClipboardList, meta: `${totals.todayOrders} placed today` },
          { to: '/admin/products', label: 'Tend the catalogue', icon: Flower2, meta: `${totals.products} products live` },
          { to: '/admin/customers', label: 'Know your customers', icon: Users, meta: `${totals.customers} registered` },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="card-petal group flex items-center gap-4 p-4 transition-colors hover:border-sage/60"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-sage-soft text-forest transition-colors group-hover:bg-forest group-hover:text-cream">
              <item.icon size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{item.label}</span>
              <span className="block text-xs text-ink-faint">{item.meta}</span>
            </span>
            <ArrowRight
              size={15}
              className="shrink-0 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-forest"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

function seriesTotal(series = []) {
  return series.reduce((sum, point) => sum + point.revenue, 0);
}
