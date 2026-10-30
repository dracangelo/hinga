import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Tag, ArrowRight, X, Truck, Gift } from 'lucide-react';
import { api } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Blossom, ImageWithFallback, PageHeader, QuantityStepper } from '../components/ui.jsx';
import { money } from '../lib/format.js';

export function Cart() {
  const { items, count, subtotal, subtotalCents, coupon, applyCoupon, removeCoupon, update, remove } =
    useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [totals, setTotals] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!subtotalCents) {
      setTotals(null);
      return;
    }
    api
      .quote({
        items: items.map((item) => ({ priceCents: item.priceCents, qty: item.qty })),
        couponCode: coupon?.code || '',
        shippingMethod: 'standard',
      })
      .then(setTotals)
      .catch(() => setTotals(null));
  }, [items, subtotalCents, coupon]);

  const handleCoupon = async (event) => {
    event.preventDefault();
    setCouponError('');
    if (!code.trim()) return;
    setBusy(true);
    try {
      const label = await applyCoupon(code.trim());
      toast.success(`Promo applied — ${label}`);
      setCode('');
    } catch (error) {
      setCouponError(error.message);
    } finally {
      setBusy(false);
    }
  };

  const shipping = totals?.shipping ?? (subtotalCents >= 750000 ? 0 : 400);
  const discount = totals?.discount ?? 0;
  const tax = totals?.tax ?? 0;
  const total = totals?.total ?? subtotal;

  if (items.length === 0) {
    return (
      <div>
        <PageHeader
          eyebrow="The potting bench"
          title={
            <>
              Your <span className="accent">cart</span>
            </>
          }
          description="Everything here is potted, watered and ready to travel."
        />
        <div className="container-page py-12 md:py-16">
          <div className="relative isolate overflow-hidden rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-[0.9rem] rounded-bl-[0.9rem] border border-sand/70 bg-white px-6 py-16 text-center">
            <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-20" />
            <Blossom
              size={180}
              strokeWidth={0.5}
              className="pointer-events-none absolute -right-12 -top-10 text-forest/[0.05]"
            />
            <div className="relative">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sage-soft text-forest ring-1 ring-sage/40">
                <ShoppingBag size={25} />
              </span>
              <h2 className="mt-5 font-display text-2xl text-ink">Nothing potted yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                Nothing here yet. Have a look at what the growers sent us this morning.
              </p>
              <Link to="/shop" className="btn btn-primary mt-6">
                Browse the greenhouse <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div>
      <PageHeader
        eyebrow="The potting bench"
        title={
          <>
            Your <span className="accent">cart</span>
          </>
        }
        description="Everything here is potted, watered and ready to travel. We pack each plant upright so it reaches you the way it left the greenhouse."
        aside={
          <div className="flex items-center gap-4 rounded-full border border-sand/80 bg-cream/80 py-2 pl-4 pr-2">
            <span className="badge bg-sage-soft text-forest">
              {count} {count === 1 ? 'plant' : 'plants'}
            </span>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-forest transition-colors hover:bg-parchment hover:text-clay"
            >
              Keep browsing <ArrowRight size={13} />
            </Link>
          </div>
        }
      />

      <div className="container-page py-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          {/* items */}
          <div>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <p className="eyebrow">In your basket</p>
              <span className="text-xs text-ink-faint">{count} {count === 1 ? 'item' : 'items'}</span>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="card-petal flex gap-4 rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-[0.9rem] rounded-bl-[0.9rem] p-4 md:gap-5 md:p-5"
                >
                  <Link to={`/product/${item.slug}`} className="shrink-0">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="arch-soft h-32 w-24 object-cover ring-1 ring-sand/70 md:h-36 md:w-28"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/product/${item.slug}`}
                          className="font-display text-xl leading-tight text-ink transition-colors hover:text-forest"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                          {[item.size, item.color].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.id).catch((e) => toast.error(e.message))}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:bg-rose-soft hover:text-rose"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="mt-auto flex items-end justify-between gap-3 border-t border-sand/60 pt-3">
                      <QuantityStepper
                        size="sm"
                        value={item.qty}
                        max={item.stock}
                        onChange={(qty) => update(item.id, qty).catch((e) => toast.error(e.message))}
                      />
                      <div className="text-right">
                        <p className="font-display text-lg leading-none text-ink">
                          {money(item.lineTotal)}
                        </p>
                        {item.qty > 1 && (
                          <p className="mt-1 text-xs text-ink-faint">{money(item.price)} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <Link
              to="/shop"
              className="mt-5 inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-forest"
            >
              ← Continue shopping
            </Link>
          </div>

          {/* summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="card-petal p-5 md:p-6">
              <p className="eyebrow">Your basket</p>
              <h2 className="mt-2 font-display text-2xl text-forest">Order summary</h2>

              <div className="mt-5 space-y-2.5 text-sm">
                <div className="flex justify-between text-ink-soft">
                  <span>Subtotal</span>
                  <span className="text-ink">{money(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-rose">
                    <span>Discount {coupon ? `(${coupon.code})` : ''}</span>
                    <span>−{money(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-soft">
                  <span>Delivery</span>
                  <span className="text-ink">{shipping === 0 ? 'Free' : money(shipping)}</span>
                </div>
                <div className="flex justify-between text-ink-soft">
                  <span>VAT (16%)</span>
                  <span className="text-ink">{money(tax)}</span>
                </div>
              </div>

              <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-sand/70 pt-5">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-faint">
                  Total
                </span>
                <span className="font-display text-3xl text-forest">{money(total)}</span>
              </div>

              {/* coupon */}
              {coupon ? (
                <div className="mt-5 flex items-center justify-between rounded-xl bg-sage-soft px-3.5 py-2.5">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-forest">
                    <Tag size={14} /> {coupon.code} — {coupon.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      removeCoupon();
                      toast.info('Promo code removed');
                    }}
                    className="text-forest/60 transition-colors hover:text-forest"
                    aria-label="Remove promo code"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCoupon} className="mt-5">
                  <label className="label" htmlFor="promo">
                    Promo code
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="promo"
                      value={code}
                      onChange={(event) => setCode(event.target.value.toUpperCase())}
                      placeholder="BLOOM10"
                      className="field uppercase"
                    />
                    <button
                      type="submit"
                      disabled={busy}
                      className="btn btn-secondary btn-sm shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="mt-2 text-xs text-rose">{couponError}</p>}
                  <p className="mt-2 text-xs text-ink-faint">Try BLOOM10 for 10% off.</p>
                </form>
              )}

              <button
                type="button"
                onClick={() => navigate(user ? '/checkout' : '/login?redirect=/checkout')}
                className="btn btn-primary btn-lg mt-5 w-full"
              >
                Checkout <ArrowRight size={16} />
              </button>

              <ul className="mt-5 space-y-2 border-t border-sand/70 pt-4 text-xs text-ink-soft">
                <li className="flex items-center gap-2">
                  <Truck size={13} className="text-sage" />
                  {shipping === 0
                    ? 'Free delivery unlocked'
                    : `Add ${money(7500 - subtotalCents / 100)} more for free delivery`}
                </li>
                <li className="flex items-center gap-2">
                  <Gift size={13} className="text-sage" />
                  Handwritten card included, free
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
