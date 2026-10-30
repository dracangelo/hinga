import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Truck,
  CreditCard,
  MapPin,
  User,
  Package,
  XCircle,
  CheckCircle2,
  Phone,
  Mail,
  Tag,
  StickyNote,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ImageWithFallback, PaymentBadge, Spinner, StatusBadge } from '../../components/ui.jsx';
import {
  formatDateTime,
  money,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_META,
  titleCase,
} from '../../lib/format.js';

export function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [allowed, setAllowed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [tracking, setTracking] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminOrder(id);
      setOrder(data.order);
      setCustomer(data.customer);
      setAllowed(data.allowedTransitions || []);
      setNotes(data.order.notes || '');
      setTracking(data.order.trackingNumber || '');
      setPaymentStatus(data.order.paymentStatus);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (body, message) => {
    setSaving(true);
    try {
      const data = await api.updateAdminOrder(order.id, body);
      setOrder(data.order);
      setAllowed(data.allowedTransitions || []);
      if (message) toast.success(message);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status) => {
    const ok = await patch({ status }, `Order moved to ${ORDER_STATUS_META[status]?.label}`);
    if (ok) load();
  };

  const saveDetails = async () => {
    const ok = await patch(
      { notes, trackingNumber: tracking, paymentStatus },
      'Order details saved',
    );
    if (ok) load();
  };

  const remove = async () => {
    if (!window.confirm(`Permanently delete order ${order.orderNumber}? This cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteAdminOrder(order.id);
      toast.success('Order deleted');
      navigate('/admin/orders');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <Spinner label="Loading order" />;

  if (!order) {
    return (
      <div className="card p-10 text-center">
        <h2 className="font-display text-xl text-ink">Order not found</h2>
        <Link to="/admin/orders" className="btn btn-secondary btn-sm mt-4">
          Back to orders
        </Link>
      </div>
    );
  }

  const currentStep = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-forest"
        >
          <ArrowLeft size={15} /> All orders
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={remove}
            className="btn btn-ghost btn-sm text-rose"
            title="Delete order"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl text-ink">{order.orderNumber}</h2>
              <StatusBadge status={order.status} />
              <PaymentBadge status={order.paymentStatus} />
            </div>
            <p className="mt-1.5 text-sm text-ink-soft">
              Placed {formatDateTime(order.createdAt)} · Last updated{' '}
              {formatDateTime(order.updatedAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl text-ink">{money(order.total)}</p>
            <p className="text-xs text-ink-faint">
              {order.items.reduce((sum, item) => sum + item.qty, 0)} items ·{' '}
              {order.paymentMethod === 'mpesa' ? 'M-Pesa' : titleCase(order.paymentMethod)}
            </p>
          </div>
        </div>

        {/* progress */}
        {order.status !== 'cancelled' && (
          <ol className="mt-6 flex flex-wrap items-center gap-1.5">
            {ORDER_STATUS_FLOW.map((step, index) => {
              const done = index <= currentStep;
              const active = index === currentStep;
              return (
                <li key={step} className="flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      done ? 'bg-forest text-white' : 'bg-parchment text-ink-faint'
                    } ${active ? 'ring-2 ring-sage ring-offset-2 ring-offset-white' : ''}`}
                  >
                    {ORDER_STATUS_META[step].label}
                  </span>
                  {index < ORDER_STATUS_FLOW.length - 1 && (
                    <span className="h-px w-3 bg-sand sm:w-5" />
                  )}
                </li>
              );
            })}
          </ol>
        )}

        {/* transitions */}
        {allowed.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-sand/70 pt-5">
            {allowed.map((status) => (
              <button
                key={status}
                type="button"
                disabled={saving}
                onClick={() => changeStatus(status)}
                className={`btn btn-sm ${
                  status === 'cancelled' ? 'btn-ghost text-rose' : 'btn-primary'
                }`}
              >
                {status === 'cancelled' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                Move to {ORDER_STATUS_META[status]?.label || status}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          {/* items */}
          <section className="card overflow-hidden">
            <h3 className="flex items-center gap-2 border-b border-sand/70 px-5 py-4 font-display text-lg text-ink">
              <Package size={17} className="text-sage" /> Items
            </h3>
            <div className="divide-y divide-sand/40">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.name}
                    className="h-16 w-14 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-ink-faint">
                      {[item.size, item.color].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {money(item.unitPrice)} × {item.qty}
                    </p>
                  </div>
                  <p className="font-medium text-ink">{money(item.lineTotal)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-sand/70 bg-parchment/30 px-5 py-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span className="text-ink">{money(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-rose">
                  <span>
                    Discount {order.couponCode ? `(${order.couponCode})` : ''}
                  </span>
                  <span>−{money(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-soft">
                <span>Delivery</span>
                <span className="text-ink">
                  {order.shipping === 0 ? 'Free' : money(order.shipping)}
                </span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Tax</span>
                <span className="text-ink">{money(order.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-sand/70 pt-2 text-base font-medium text-ink">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>
          </section>

          {/* fulfilment */}
          <section className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-lg text-ink">
              <StickyNote size={17} className="text-sage" /> Fulfilment details
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="tracking">
                  Tracking number
                </label>
                <input
                  id="tracking"
                  className="field"
                  value={tracking}
                  onChange={(event) => setTracking(event.target.value)}
                  placeholder="1Z999AA10123456784"
                />
              </div>
              <div>
                <label className="label" htmlFor="payment-status">
                  Payment status
                </label>
                <select
                  id="payment-status"
                  className="field"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="notes">
                  Internal notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className="field resize-none"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Gift message, card wording, special handling…"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={saveDetails}
              disabled={saving}
              className="btn btn-primary btn-sm mt-4"
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save details'}
            </button>
          </section>
        </div>

        <div className="space-y-5">
          {/* customer */}
          <section className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-lg text-ink">
              <User size={17} className="text-sage" /> Customer
            </h3>
            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium text-ink">{order.customer.name}</p>
              <p className="flex items-center gap-2 text-ink-soft">
                <Mail size={13} className="text-ink-faint" /> {order.customer.email}
              </p>
              {order.customer.phone && (
                <p className="flex items-center gap-2 text-ink-soft">
                  <Phone size={13} className="text-ink-faint" /> {order.customer.phone}
                </p>
              )}
            </div>
            {customer && (
              <div className="mt-4 rounded-xl bg-parchment/60 p-3.5 text-xs text-ink-soft">
                <p className="font-medium text-ink">Registered customer</p>
                <p className="mt-0.5">Customer since {formatDateTime(customer.created_at)}</p>
                <Link
                  to="/admin/customers"
                  className="mt-1.5 inline-flex items-center gap-1 text-forest hover:underline"
                >
                  View customer <ExternalLink size={11} />
                </Link>
              </div>
            )}
            {!customer && (
              <p className="mt-4 rounded-xl bg-gold-soft/60 p-3 text-xs text-ink-soft">
                Guest checkout — no account attached to this order.
              </p>
            )}
          </section>

          {/* address */}
          <section className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-lg text-ink">
              <MapPin size={17} className="text-sage" /> Delivery address
            </h3>
            <div className="mt-4 space-y-1 text-sm text-ink-soft">
              <p className="font-medium text-ink">{order.customer.name}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}
                {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}{' '}
                {order.shippingAddress.zip}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
            {order.notes && (
              <div className="mt-4 rounded-xl bg-gold-soft/50 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-ink-faint">
                  <Tag size={12} /> Customer note
                </p>
                <p className="mt-1 text-sm text-ink-soft">{order.notes}</p>
              </div>
            )}
          </section>

          {/* payment */}
          <section className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-lg text-ink">
              <CreditCard size={17} className="text-sage" /> Payment
            </h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Method</span>
                <span className="font-medium text-ink">{order.paymentMethod === 'mpesa' ? 'M-Pesa' : titleCase(order.paymentMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Status</span>
                <PaymentBadge status={order.paymentStatus} />
              </div>
              {order.couponCode && (
                <div className="flex justify-between">
                  <span className="text-ink-soft">Coupon</span>
                  <span className="font-medium text-rose">{order.couponCode}</span>
                </div>
              )}
            </div>
          </section>

          {/* delivery */}
          <section className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-lg text-ink">
              <Truck size={17} className="text-sage" /> Delivery
            </h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Tracking</span>
                <span className="font-medium text-ink">
                  {order.trackingNumber || 'Not assigned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Cost</span>
                <span className="font-medium text-ink">
                  {order.shipping === 0 ? 'Free' : money(order.shipping)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
