import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Home,
  MapPin,
  Package,
  Smartphone,
  Sparkles,
  Sprout,
  Truck,
  Wallet,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  Blossom,
  ImageWithFallback,
  PageHeader,
  PaymentBadge,
  Spinner,
  StatusBadge,
} from '../components/ui.jsx';
import { formatDate, formatDateTime, money } from '../lib/format.js';

const TIMELINE = [
  { key: 'pending', label: 'Order received', note: 'Logged with the studio', icon: CheckCircle2 },
  { key: 'confirmed', label: 'Confirmed by the studio', note: 'Your plants are reserved', icon: Check },
  { key: 'preparing', label: 'Potting & packing', note: 'Wrapped by hand in Nairobi', icon: Sparkles },
  { key: 'out_for_delivery', label: 'On the van', note: 'On the way to your door', icon: Truck },
  { key: 'delivered', label: 'Delivered', note: 'Settled in its new home', icon: Home },
];

const PAYMENT_METHODS = {
  mpesa: { label: 'M-Pesa', icon: Smartphone },
  card: { label: 'Card', icon: CreditCard },
  cod: { label: 'Pay on delivery', icon: Wallet },
};

const COUNTRIES = {
  KE: 'Kenya',
  UG: 'Uganda',
  TZ: 'Tanzania',
  RW: 'Rwanda',
};

export function OrderConfirmation() {
  const { orderNumber } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .myOrder(orderNumber)
      .then((data) => setOrder(data.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) return <Spinner label="Loading your order" />;

  if (!order) {
    return (
      <div>
        <PageHeader
          eyebrow="Order lookup"
          title={
            <>
              Not in the <span className="accent">greenhouse</span>
            </>
          }
          description="That order number doesn't match anything on file. Check the link in your email, or sign in to see your orders."
        />
        <div className="container-page py-12 md:py-16">
          <div className="relative isolate mx-auto max-w-xl overflow-hidden rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-[0.9rem] rounded-bl-[0.9rem] border border-sand/70 bg-white px-6 py-14 text-center">
            <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-20" />
            <Blossom
              size={170}
              strokeWidth={0.5}
              className="pointer-events-none absolute -right-10 -top-10 text-forest/[0.05]"
            />
            <div className="relative">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-sage-soft text-forest">
                <Package size={22} />
              </span>
              <h2 className="mt-4 font-display text-2xl text-ink">We couldn't find {orderNumber}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                If you placed the order as a guest, use the link from your confirmation email.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/account" className="btn btn-primary">
                  My orders
                </Link>
                <Link to="/shop" className="btn btn-secondary">
                  Browse plants
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = TIMELINE.findIndex((step) => step.key === order.status);
  const cancelled = order.status === 'cancelled';
  const firstName = order.customer.name.trim().split(' ')[0] || 'there';
  const payment = PAYMENT_METHODS[order.paymentMethod] || PAYMENT_METHODS.card;
  const PaymentIcon = payment.icon;
  const country = COUNTRIES[order.shippingAddress.country] || order.shippingAddress.country;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      toast.success('Order number copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — select the number manually');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={cancelled ? 'Order cancelled' : 'Order placed'}
        title={
          cancelled ? (
            <>
              This order was <span className="accent">cancelled</span>
            </>
          ) : (
            <>
              Thank you, <span className="accent">{firstName}</span>
            </>
          )
        }
        description={
          cancelled
            ? 'Nothing is on its way. The plants went back to the greenhouse, and you can start a fresh basket whenever you like.'
            : `We've emailed a receipt to ${order.customer.email}. Your order is with the studio now — we'll write again the moment it leaves the bench.`
        }
        aside={
          <button
            type="button"
            onClick={copyNumber}
            className="inline-flex items-center gap-2 rounded-full border border-sand/80 bg-cream/80 px-4 py-2 text-xs font-medium text-forest transition-colors hover:border-sage"
          >
            {copied ? <Check size={13} className="text-sage" /> : <Copy size={13} />}
            {order.orderNumber}
          </button>
        }
      />

      <div className="container-page py-9 md:py-12">
        <div className="grid gap-7 lg:grid-cols-[1fr_23rem]">
          <div className="space-y-6">
            {/* ------------------------------ status ----------------------------- */}
            {cancelled ? (
              <section className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">Delivery status</p>
                    <h2 className="mt-1.5 font-display text-xl text-forest">What happens now</h2>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  The plants are back in the greenhouse and their stock is restored. If you paid by
                  M-Pesa or card, the studio will return the amount to that method. Changed your
                  mind? Everything below is still in season.
                </p>
                <Link to="/shop" className="btn btn-secondary btn-sm mt-4">
                  Shop again
                </Link>
              </section>
            ) : (
              <section className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow flex items-center gap-2.5">
                      <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
                      Delivery status
                      <Blossom size={11} className="text-clay/60" strokeWidth={0.9} />
                    </p>
                    <h2 className="mt-2 font-display text-xl text-forest">
                      From our bench to your door
                    </h2>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <ol className="mt-6">
                  {TIMELINE.map((step, index) => {
                    const done = currentIndex >= index;
                    const active = currentIndex === index;
                    const last = index === TIMELINE.length - 1;
                    return (
                      <li key={step.key} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <span
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors ${
                              done
                                ? 'border-forest bg-forest text-cream'
                                : 'border-sand bg-white text-ink-faint'
                            } ${active ? 'ring-4 ring-sage-soft' : ''}`}
                          >
                            <step.icon size={15} />
                          </span>
                          {!last && (
                            <span
                              aria-hidden="true"
                              className={`w-px flex-1 ${
                                currentIndex > index ? 'bg-forest/45' : 'bg-sand'
                              }`}
                              style={{ minHeight: '1.9rem' }}
                            />
                          )}
                        </div>
                        <div className={last ? 'pb-0' : 'pb-6'}>
                          <p
                            className={`text-sm ${
                              active
                                ? 'font-display text-base font-medium text-forest'
                                : done
                                  ? 'font-medium text-ink'
                                  : 'text-ink-faint'
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-ink-faint">
                            {active ? `Updated ${formatDateTime(order.updatedAt)}` : step.note}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {/* ------------------------------ items ------------------------------ */}
            <section className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="eyebrow">In this order</p>
                  <h2 className="mt-1.5 font-display text-xl text-forest">
                    {cancelled ? 'What was in this order' : 'Potted and packed by hand'}
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-faint">
                  <Package size={13} className="text-sage" /> {order.items.length}{' '}
                  {order.items.length === 1 ? 'line' : 'lines'}
                </span>
              </div>

              <ul className="mt-5 divide-y divide-sand/60">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3.5 py-4 first:pt-0 last:pb-0">
                    <div className="relative shrink-0">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="arch-soft h-16 w-14 object-cover ring-1 ring-sand/70"
                      />
                      <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.65rem] font-medium text-white">
                        {item.qty}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{item.name}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {[item.size, item.color].filter(Boolean).join(' · ') || 'One size'}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-lg text-forest">
                      {money(item.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* ----------------------------- delivery ---------------------------- */}
            <div className="grid items-start gap-6 sm:grid-cols-2">
              <section className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-6">
                <p className="eyebrow">Delivery details</p>
                <h2 className="mt-1.5 flex items-center gap-2 font-display text-xl text-forest">
                  <MapPin size={17} className="text-sage" /> Going to
                </h2>
                <div className="mt-4 space-y-1 text-sm leading-relaxed text-ink-soft">
                  <p className="font-medium text-ink">{order.customer.name}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>
                    {order.shippingAddress.city}
                    {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}{' '}
                    {order.shippingAddress.zip}
                  </p>
                  <p>{country}</p>
                  <div className="space-y-1 pt-2 text-xs text-ink-faint">
                    <p>{order.customer.email}</p>
                    {order.customer.phone && <p>{order.customer.phone}</p>}
                  </div>
                </div>
              </section>

              <section className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-6">
                <p className="eyebrow">Good to know</p>
                <h2 className="mt-1.5 flex items-center gap-2 font-display text-xl text-forest">
                  <Truck size={17} className="text-sage" /> Getting it home
                </h2>

                <div className="mt-4 rounded-[1.1rem] bg-parchment/70 p-3.5 text-sm leading-relaxed text-ink-soft">
                  <span className="block text-xs uppercase tracking-wider text-ink-faint">
                    Studio notes
                  </span>
                  {order.notes || 'No notes — we’ll leave your plants with a neighbour if you’re out.'}
                </div>

                {order.trackingNumber && (
                  <div className="mt-3 rounded-[1.1rem] border border-sand bg-white p-3.5 text-sm">
                    <span className="block text-xs uppercase tracking-wider text-ink-faint">
                      Tracking number
                    </span>
                    <span className="font-medium text-ink">{order.trackingNumber}</span>
                  </div>
                )}

                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-faint">
                  <Sprout size={14} className="mt-0.5 shrink-0 text-sage" />
                  Every plant travels in a breathable sleeve. Free replacement if it arrives damaged.
                </p>
              </section>
            </div>
          </div>

          {/* ------------------------------ receipt ----------------------------- */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="card-petal overflow-hidden rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem]">
              <div className="relative isolate overflow-hidden border-b border-sand/60 bg-parchment/60 px-5 py-4">
                <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-25" />
                <div className="relative">
                  <p className="eyebrow">Receipt</p>
                  <h2 className="mt-1 font-display text-xl text-forest">Order total</h2>
                </div>
              </div>

              <div className="p-5">
                <dl className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-ink-soft">
                    <dt>Subtotal</dt>
                    <dd className="text-ink">{money(order.subtotal)}</dd>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-rose">
                      <dt>Discount {order.couponCode ? `(${order.couponCode})` : ''}</dt>
                      <dd>−{money(order.discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-ink-soft">
                    <dt>Delivery</dt>
                    <dd className="text-ink">
                      {order.shipping === 0 ? 'Free' : money(order.shipping)}
                    </dd>
                  </div>
                  <div className="flex justify-between text-ink-soft">
                    <dt>VAT (16%)</dt>
                    <dd className="text-ink">{money(order.tax)}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-baseline justify-between border-t border-sand/70 pt-4">
                  <span className="font-medium text-ink">Total</span>
                  <span className="font-display text-3xl text-forest">{money(order.total)}</span>
                </div>

                <div className="mt-4 space-y-2 border-t border-sand/70 pt-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-ink-soft">
                      <PaymentIcon size={14} className="text-sage" /> {payment.label}
                    </span>
                    <PaymentBadge status={order.paymentStatus} />
                  </div>
                  <div className="flex items-center justify-between text-ink-faint">
                    <span>Placed</span>
                    <span className="text-ink-soft">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5">
                  <Link to="/account" className="btn btn-primary w-full">
                    View all orders
                  </Link>
                  <Link to="/shop" className="btn btn-secondary w-full">
                    Keep shopping
                  </Link>
                </div>

                <p className="mt-3.5 flex items-center justify-center gap-1.5 text-center text-xs text-ink-faint">
                  <Check size={12} className="text-sage" /> Free replacement if the plant doesn't thrive
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
