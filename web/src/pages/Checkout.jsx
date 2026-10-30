import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Truck,
  Zap,
  Wallet,
  Smartphone,
  Lock,
  Check,
  MapPin,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Blossom, ImageWithFallback, PageHeader } from '../components/ui.jsx';
import { money } from '../lib/format.js';

const DELIVERY_METHODS = [
  {
    id: 'standard',
    label: 'Standard delivery',
    detail: 'Next-day in Nairobi, 9am – 1pm',
    note: 'Free over KSh 7,500',
    price: 0,
    icon: Truck,
  },
  {
    id: 'express',
    label: 'Express delivery',
    detail: 'Today, within 4 hours',
    note: '',
    price: 800,
    icon: Zap,
  },
];

const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', detail: 'Pay from your phone', icon: Smartphone },
  { id: 'card', label: 'Card', detail: 'Visa, Mastercard', icon: CreditCard },
  { id: 'cod', label: 'Pay on delivery', detail: 'Cash at the door', icon: Wallet },
];

export function Checkout() {
  const { items, subtotal, subtotalCents, coupon, clear, refresh } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    zip: '',
    country: 'KE',
    notes: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvc: '',
  });
  const [delivery, setDelivery] = useState('standard');
  const [payment, setPayment] = useState('mpesa');
  const [totals, setTotals] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const addressTouched = useRef(false);

  useEffect(() => {
    if (user) {
      setForm((current) => ({
        ...current,
        name: current.name || user.name || '',
        email: current.email || user.email || '',
        phone: current.phone || user.phone || '',
        city: current.city || user.city || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    api
      .quote({
        items: items.map((item) => ({ priceCents: item.priceCents, qty: item.qty })),
        couponCode: coupon?.code || '',
        shippingMethod: delivery,
      })
      .then(setTotals)
      .catch(() => setTotals(null));
  }, [items, coupon, delivery]);

  const applyAddress = (address) => {
    addressTouched.current = true;
    setSelectedAddressId(address.id);
    setForm((current) => ({
      ...current,
      name: address.recipient || current.name,
      phone: address.phone || current.phone,
      address: address.address || '',
      apartment: '',
      city: address.city || '',
      state: address.state || '',
      zip: address.zip || '',
      country: address.country || 'KE',
    }));
    setErrors((current) => ({
      ...current,
      name: undefined,
      address: undefined,
      city: undefined,
      zip: undefined,
    }));
  };

  const clearAddress = () => {
    addressTouched.current = true;
    setSelectedAddressId(null);
    setForm((current) => ({
      ...current,
      address: '',
      apartment: '',
      city: '',
      state: '',
      zip: '',
    }));
  };

  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    let cancelled = false;
    api
      .addresses()
      .then((data) => {
        if (cancelled) return;
        const list = data.addresses || [];
        setSavedAddresses(list);
        if (list.length && !addressTouched.current) applyAddress(list[0]);
      })
      .catch(() => {
        if (!cancelled) setSavedAddresses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (['address', 'apartment', 'city', 'state', 'zip', 'country'].includes(key)) {
      addressTouched.current = true;
      setSelectedAddressId(null);
    }
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Who is this for?';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!form.address.trim()) next.address = 'Street address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.zip.trim()) next.zip = 'Postal code is required';
    if (payment === 'card') {
      if (form.cardNumber.replace(/\s/g, '').length < 15) next.cardNumber = 'Enter a card number';
      if (!form.cardName.trim()) next.cardName = 'Name on card is required';
      if (form.cardExpiry.length < 4) next.cardExpiry = 'MM/YY';
      if (form.cardCvc.length < 3) next.cardCvc = 'CVC';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('Please complete the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      const { order } = await api.checkout({
        customer: { name: form.name, email: form.email, phone: form.phone },
        shipping: {
          address: [form.address, form.apartment].filter(Boolean).join(', '),
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
          method: delivery,
        },
        payment: { method: payment, status: payment === 'cod' ? 'unpaid' : 'paid' },
        couponCode: coupon?.code || '',
        notes: form.notes,
      });
      await clear();
      await refresh();
      toast.success('Order placed — thank you');
      navigate(`/order/${order.orderNumber}`);
    } catch (error) {
      toast.error(error.message);
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div>
        <PageHeader
          eyebrow="Checkout"
          title={
            <>
              Nothing to <span className="accent">check out</span>
            </>
          }
          description="Your basket is empty — choose a plant and it will be waiting here."
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
              <h2 className="font-display text-2xl text-ink">A quiet basket</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                Add a plant and come back — delivery and payment take two minutes.
              </p>
              <Link to="/shop" className="btn btn-primary mt-6">
                Browse the greenhouse
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const shippingCost = totals?.shipping ?? 0;
  const tax = totals?.tax ?? 0;
  const total = totals?.total ?? subtotal;

  return (
    <div>
      <PageHeader
        eyebrow="Almost home"
        backTo="/cart"
        backLabel="Back to cart"
        title={
          <>
            Check<span className="accent">out</span>
          </>
        }
        description="Delivery is next-day in Nairobi, with same-day express available. Pay by M-Pesa, card or cash at the door."
        aside={
          <span className="inline-flex items-center gap-2 rounded-full border border-sand/80 bg-cream/80 px-4 py-2 text-xs font-medium text-forest">
            <Lock size={13} className="text-sage" /> Secure checkout
          </span>
        }
      />

      <div className="container-page py-9 md:py-12">
      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          {/* contact */}
          <section className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-6">
            <h2 className="flex items-center gap-2.5 font-display text-xl text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-sage/60 bg-sage-soft/70 font-display text-sm text-forest">
                1
              </span>
              Contact details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="label" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  className="field"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Recipient name"
                />
                {errors.name && <p className="mt-1 text-xs text-rose">{errors.name}</p>}
              </div>
              <div>
                <label className="label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="field"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-rose">{errors.email}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="phone">
                  Phone (for delivery updates)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className="field"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+254 712 345 678"
                />
              </div>
            </div>
          </section>

          {/* address */}
          <section className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-6">
            <h2 className="flex items-center gap-2.5 font-display text-xl text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-sage/60 bg-sage-soft/70 font-display text-sm text-forest">
                2
              </span>
              Delivery address
            </h2>

            {savedAddresses.length > 0 && (
              <div className="mt-4 rounded-[1.1rem] border border-sand/80 bg-parchment/40 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    Saved addresses
                  </p>
                  {selectedAddressId !== null && (
                    <button
                      type="button"
                      onClick={clearAddress}
                      className="text-xs font-medium text-forest underline decoration-sage/70 underline-offset-2 transition-colors hover:decoration-forest"
                    >
                      Use a new address
                    </button>
                  )}
                </div>

                <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                  {savedAddresses.map((address) => {
                    const selected = selectedAddressId === address.id;
                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => applyAddress(address)}
                        aria-pressed={selected}
                        className={`min-w-0 rounded-[1rem] border p-3 text-left transition-colors ${
                          selected
                            ? 'border-forest bg-sage-soft/60 ring-1 ring-forest/10'
                            : 'border-sand bg-white hover:border-sage'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="badge bg-parchment text-ink-soft">{address.label}</span>
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                              selected
                                ? 'border-forest bg-forest text-cream'
                                : 'border-sand bg-white text-transparent'
                            }`}
                          >
                            <Check size={12} />
                          </span>
                        </span>
                        <span className="mt-2 block text-sm font-medium text-ink">
                          {address.recipient}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-faint">
                          {[address.address, address.city, address.zip].filter(Boolean).join(', ')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="address">
                  Street address
                </label>
                <input
                  id="address"
                  name="address"
                  autoComplete="address-line1"
                  className="field"
                  value={form.address}
                  onChange={set('address')}
                  placeholder="12 Riverside Drive, Westlands"
                />
                {errors.address && <p className="mt-1 text-xs text-rose">{errors.address}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="apartment">
                  Apartment, suite (optional)
                </label>
                <input
                  id="apartment"
                  name="apartment"
                  autoComplete="address-line2"
                  className="field"
                  value={form.apartment}
                  onChange={set('apartment')}
                />
              </div>
              <div>
                <label className="label" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  className="field"
                  value={form.city}
                  onChange={set('city')}
                />
                {errors.city && <p className="mt-1 text-xs text-rose">{errors.city}</p>}
              </div>
              <div>
                <label className="label" htmlFor="state">
                  County
                </label>
                <input
                  id="state"
                  name="state"
                  autoComplete="address-level1"
                  className="field"
                  value={form.state}
                  onChange={set('state')}
                />
              </div>
              <div>
                <label className="label" htmlFor="zip">
                  Postal code
                </label>
                <input
                  id="zip"
                  name="zip"
                  autoComplete="postal-code"
                  className="field"
                  value={form.zip}
                  onChange={set('zip')}
                />
                {errors.zip && <p className="mt-1 text-xs text-rose">{errors.zip}</p>}
              </div>
              <div>
                <label className="label" htmlFor="country">
                  Country
                </label>
                <select id="country" className="field" value={form.country} onChange={set('country')}>
                  <option value="KE">Kenya</option>
                  <option value="UG">Uganda</option>
                  <option value="TZ">Tanzania</option>
                  <option value="RW">Rwanda</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="notes">
                  Delivery notes
                </label>
                <textarea
                  id="notes"
                  rows={2}
                  className="field resize-none"
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Gate code, where to leave it…"
                />
              </div>
            </div>
          </section>

          {/* delivery method */}
          <section className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-6">
            <h2 className="flex items-center gap-2.5 font-display text-xl text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-sage/60 bg-sage-soft/70 font-display text-sm text-forest">
                3
              </span>
              Delivery speed
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {DELIVERY_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-[1.1rem] border p-4 transition-colors ${
                    delivery === method.id
                      ? 'border-forest bg-sage-soft/50 ring-1 ring-forest/10'
                      : 'border-sand hover:border-sage'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={method.id}
                    checked={delivery === method.id}
                    onChange={() => setDelivery(method.id)}
                    className="mt-1 h-4 w-4 accent-[#1f3d33]"
                  />
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <method.icon size={15} className="text-sage" /> {method.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-faint">{method.detail}</span>
                  </span>
                  <span
                    className={`text-right text-sm font-medium text-ink ${
                      method.note ? 'text-xs font-normal text-ink-faint' : ''
                    }`}
                  >
                    {method.note || money(method.price)}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* payment */}
          <section className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-6">
            <h2 className="flex items-center gap-2.5 font-display text-xl text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-sage/60 bg-sage-soft/70 font-display text-sm text-forest">
                4
              </span>
              Payment
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-[1.1rem] border p-3.5 transition-colors ${
                    payment === method.id ? 'border-forest bg-sage-soft/50 ring-1 ring-forest/10' : 'border-sand hover:border-sage'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={payment === method.id}
                    onChange={() => setPayment(method.id)}
                    className="h-4 w-4 accent-[#1f3d33]"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{method.label}</span>
                    <span className="block text-xs text-ink-faint">{method.detail}</span>
                  </span>
                </label>
              ))}
            </div>

            {payment === 'mpesa' && (
              <p className="mt-4 rounded-xl bg-sage-soft/60 px-3.5 py-3 text-xs leading-relaxed text-forest">
                We&apos;ll send an M-Pesa request to the phone number above when you place the order.
              </p>
            )}

            {payment === 'card' && (
              <div className="mt-5 grid gap-4 border-t border-sand/70 pt-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="cardNumber">
                    Card number
                  </label>
                  <input
                    id="cardNumber"
                    name="cardNumber"
                    autoComplete="cc-number"
                    className="field"
                    inputMode="numeric"
                    value={form.cardNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        cardNumber: event.target.value
                          .replace(/\D/g, '')
                          .slice(0, 16)
                          .replace(/(.{4})/g, '$1 ')
                          .trim(),
                      }))
                    }
                    placeholder="4242 4242 4242 4242"
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-xs text-rose">{errors.cardNumber}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="label" htmlFor="cardName">
                    Name on card
                  </label>
                  <input
                    id="cardName"
                    name="cc-name"
                    autoComplete="cc-name"
                    className="field"
                    value={form.cardName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, cardName: event.target.value }))
                    }
                  />
                  {errors.cardName && <p className="mt-1 text-xs text-rose">{errors.cardName}</p>}
                </div>
                <div>
                  <label className="label" htmlFor="cardExpiry">
                    Expiry
                  </label>
                  <input
                    id="cardExpiry"
                    name="cc-exp"
                    autoComplete="cc-exp"
                    className="field"
                    inputMode="numeric"
                    value={form.cardExpiry}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        cardExpiry: event.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    placeholder="MM/YY"
                  />
                  {errors.cardExpiry && (
                    <p className="mt-1 text-xs text-rose">{errors.cardExpiry}</p>
                  )}
                </div>
                <div>
                  <label className="label" htmlFor="cardCvc">
                    CVC
                  </label>
                  <input
                    id="cardCvc"
                    name="cc-csc"
                    autoComplete="cc-csc"
                    className="field"
                    inputMode="numeric"
                    value={form.cardCvc}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        cardCvc: event.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    placeholder="123"
                  />
                  {errors.cardCvc && <p className="mt-1 text-xs text-rose">{errors.cardCvc}</p>}
                </div>
                <p className="flex items-center gap-1.5 text-xs text-ink-faint sm:col-span-2">
                  <Lock size={12} /> This is a demo store — no real payment is processed.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-6">
            <p className="eyebrow">The basket</p>
            <h2 className="mt-2 font-display text-2xl text-forest">Your order</h2>

            <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="arch-soft h-16 w-13 object-cover ring-1 ring-sand/70"
                    />
                    <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[0.65rem] font-medium text-white">
                      {item.qty}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{item.name}</p>
                    <p className="text-xs text-ink-faint">
                      {[item.size, item.color].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="text-sm text-ink">{money(item.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2.5 border-t border-sand/70 pt-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span className="text-ink">{money(subtotal)}</span>
              </div>
              {totals?.discount > 0 && (
                <div className="flex justify-between text-rose">
                  <span>Discount {coupon ? `(${coupon.code})` : ''}</span>
                  <span>−{money(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-ink-soft">
                <span>Delivery</span>
                <span className="text-ink">{shippingCost === 0 ? 'Free' : money(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>VAT (16%)</span>
                <span className="text-ink">{money(tax)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-sand/70 pt-4">
              <span className="font-medium text-ink">Total</span>
              <span className="font-display text-3xl text-forest">{money(total)}</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-lg mt-5 w-full"
            >
              {submitting ? 'Placing order…' : <>Place order · {money(total)}</>}
            </button>

            <p className="mt-3 flex items-center gap-1.5 text-center text-xs text-ink-faint">
              <Check size={12} className="text-sage" /> Free replacement if the plant doesn't thrive
            </p>

            <div className="mt-4 flex items-start gap-2 border-t border-sand/70 pt-4 text-xs text-ink-faint">
              <MapPin size={13} className="mt-0.5 shrink-0 text-sage" />
              Delivering to {form.address ? `${form.address}, ` : ''}
              {form.city}
              {form.zip ? ` ${form.zip}` : ''}
            </div>
          </div>
        </aside>
      </form>
      </div>
    </div>
  );
}
