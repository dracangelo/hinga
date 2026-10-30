import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  ClipboardList,
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { EmptyState, PaymentBadge, Spinner, StatusBadge } from '../../components/ui.jsx';
import { formatDate, money, ORDER_STATUS_META, titleCase } from '../../lib/format.js';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AdminOrders() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();

  const status = params.get('status') || 'all';
  const payment = params.get('payment') || 'all';
  const q = params.get('q') || '';
  const page = Number(params.get('page') || 1);
  const from = params.get('from') || '';
  const to = params.get('to') || '';

  const [data, setData] = useState({ orders: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .adminOrders({ status, payment, q, page, from, to, limit: 25 })
      .then(setData)
      .catch(() => setData({ orders: [], total: 0, pages: 1 }))
      .finally(() => setLoading(false));
  }, [status, payment, q, page, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === 'all' || value === null) next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const changeStatus = async (order, nextStatus) => {
    setUpdating(order.id);
    try {
      await api.updateAdminOrder(order.id, { status: nextStatus });
      toast.success(`${order.orderNumber} → ${ORDER_STATUS_META[nextStatus]?.label || nextStatus}`);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUpdating(null);
    }
  };

  const exportCsv = () => {
    const header = ['Order', 'Date', 'Customer', 'Email', 'Status', 'Payment', 'Total'];
    const rows = data.orders.map((order) => [
      order.orderNumber,
      order.createdAt,
      order.customer.name,
      order.customer.email,
      order.status,
      order.paymentStatus,
      order.total.toFixed(2),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hinga-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Orders exported');
  };

  const nextStatuses = (current) => {
    const flow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };
    return flow[current] || [];
  };

  return (
    <div className="space-y-5">
      {/* status tabs */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => update('status', tab.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              status === tab.value
                ? 'bg-forest font-medium text-white'
                : 'border border-sand bg-white text-ink-soft hover:border-sage'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* filters */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            update('q', search.trim());
          }}
          className="relative min-w-[14rem] flex-1"
        >
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order number, name, email or phone…"
            className="field pl-9"
            aria-label="Search orders"
          />
        </form>

        <div>
          <label className="label" htmlFor="payment-filter">
            Payment
          </label>
          <select
            id="payment-filter"
            value={payment}
            onChange={(event) => update('payment', event.target.value)}
            className="field w-auto py-2 text-sm"
          >
            <option value="all">Any</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="from">
            From
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(event) => update('from', event.target.value)}
            className="field w-auto py-2 text-sm"
          />
        </div>

        <div>
          <label className="label" htmlFor="to">
            To
          </label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(event) => update('to', event.target.value)}
            className="field w-auto py-2 text-sm"
          />
        </div>

        <button type="button" onClick={exportCsv} className="btn btn-secondary btn-sm">
          <Download size={14} /> Export
        </button>

        {(q || payment !== 'all' || from || to) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setParams(new URLSearchParams(), { replace: true });
            }}
            className="btn btn-ghost btn-sm"
          >
            <Filter size={14} /> Clear
          </button>
        )}
      </div>

      <p className="text-sm text-ink-soft">
        {loading ? 'Loading…' : `${data.total} order${data.total === 1 ? '' : 's'}`}
      </p>

      {/* table */}
      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading orders" />
        ) : data.orders.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ClipboardList}
              title="No orders match"
              description="Try a different status or clear the search to see everything."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand/70 bg-parchment/40 text-left text-xs uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id} className="border-b border-sand/40 transition-colors hover:bg-parchment/30">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-medium text-forest hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="block text-xs text-ink-faint">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block text-ink">{order.customer.name}</span>
                      <span className="block text-xs text-ink-faint">{order.customer.email}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {order.items.reduce((sum, item) => sum + item.qty, 0)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ink">
                      {money(order.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {nextStatuses(order.status).length > 0 && (
                          <select
                            value=""
                            disabled={updating === order.id}
                            onChange={(event) =>
                              event.target.value && changeStatus(order, event.target.value)
                            }
                            className="rounded-lg border border-sand bg-white px-2 py-1.5 text-xs text-ink-soft"
                            aria-label={`Update status of ${order.orderNumber}`}
                          >
                            <option value="">Move to…</option>
                            {nextStatuses(order.status).map((option) => (
                              <option key={option} value={option}>
                                {ORDER_STATUS_META[option]?.label || titleCase(option)}
                              </option>
                            ))}
                          </select>
                        )}
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-sand text-ink-soft transition-colors hover:border-sage hover:text-forest"
                          aria-label={`View ${order.orderNumber}`}
                        >
                          <Eye size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => update('page', page - 1)}
            disabled={page <= 1}
            className="grid h-9 w-9 place-items-center rounded-full border border-sand text-ink-soft transition-colors hover:bg-parchment disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 text-sm text-ink-soft">
            Page {data.page} of {data.pages}
          </span>
          <button
            type="button"
            onClick={() => update('page', page + 1)}
            disabled={page >= data.pages}
            className="grid h-9 w-9 place-items-center rounded-full border border-sand text-ink-soft transition-colors hover:bg-parchment disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
