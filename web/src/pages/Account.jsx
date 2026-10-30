import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  User,
  MapPin,
  Plus,
  Trash2,
  LayoutDashboard,
  XCircle,
  Check,
  Clock,
  Flower2,
  Sprout,
  Send,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  Blossom,
  EmptyState,
  ImageWithFallback,
  PageHeader,
  Spinner,
  StatusBadge,
} from '../components/ui.jsx';
import { formatDate, money } from '../lib/format.js';
import {
  BUDGETS,
  REQUEST_STATUS_META,
  REQUEST_STATUS_NOTE,
  SITE_TYPES,
  TIMELINES,
  labelFor,
} from '../lib/landscaping.js';
import { ThemeModePicker } from '../components/ThemeToggle.jsx';

export function Account() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [gardenRequests, setGardenRequests] = useState([]);
  const [loadingGardens, setLoadingGardens] = useState(true);
  const [gardenDrafts, setGardenDrafts] = useState({});
  const [sendingGarden, setSendingGarden] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', city: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    recipient: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'KE',
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
      });
    }
  }, [user]);

  const loadOrders = () => {
    setLoadingOrders(true);
    api
      .myOrders()
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  };

  const loadAddresses = () => {
    api
      .addresses()
      .then((data) => setAddresses(data.addresses || []))
      .catch(() => setAddresses([]));
  };

  const loadGardenRequests = () => {
    setLoadingGardens(true);
    api
      .myLandscapingRequests()
      .then((data) => setGardenRequests(data.requests || []))
      .catch(() => setGardenRequests([]))
      .finally(() => setLoadingGardens(false));
  };

  useEffect(() => {
    loadOrders();
    loadAddresses();
    loadGardenRequests();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profile);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const addAddress = async (event) => {
    event.preventDefault();
    try {
      await api.addAddress(addressForm);
      setAddressForm({
        label: 'Home',
        recipient: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'KE',
      });
      setShowAddressForm(false);
      loadAddresses();
      toast.success('Address saved');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeAddress = async (id) => {
    try {
      await api.deleteAddress(id);
      loadAddresses();
      toast.info('Address removed');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendGardenMessage = async (event, request) => {
    event.preventDefault();
    const body = (gardenDrafts[request.id] || '').trim();
    if (!body) return;
    setSendingGarden(request.id);
    try {
      const { request: updated } = await api.addLandscapingMessage(request.id, body);
      setGardenRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setGardenDrafts((current) => ({ ...current, [request.id]: '' }));
      toast.success('Message sent to the garden team');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSendingGarden(null);
    }
  };

  const cancelOrder = async (orderNumber) => {
    try {
      await api.cancelOrder(orderNumber);
      loadOrders();
      toast.success('Order cancelled');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const tabs = [
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'gardens', label: 'Gardens', icon: Sprout },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Your account"
        title={
          <>
            Hello, <span className="accent">{user?.name?.split(' ')[0] || 'there'}</span>
          </>
        }
        description={
          <>
            {user?.email} · Orders, delivery details and the plants you have sent.
          </>
        }
        aside={
          <div className="flex items-center gap-3">
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn btn-secondary btn-sm">
                <LayoutDashboard size={14} /> Admin panel
              </Link>
            )}
            <span className="hidden h-14 w-14 place-items-center rounded-full border border-sage/50 bg-sage-soft font-display text-2xl text-forest sm:grid">
              {(user?.name || 'H').charAt(0).toUpperCase()}
            </span>
          </div>
        }
      />

      <div className="container-page py-8 md:py-10">
        <div className="inline-flex flex-wrap gap-1 rounded-full border border-sand/80 bg-white/70 p-1 shadow-[0_10px_24px_-22px_rgba(34,57,47,0.6)]">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                tab === item.id
                  ? 'bg-forest font-medium text-cream'
                  : 'text-ink-soft hover:bg-parchment hover:text-ink'
              }`}
            >
              <item.icon size={15} /> {item.label}
            </button>
          ))}
        </div>

      {/* ------------------------------ orders ----------------------------- */}
      {tab === 'orders' && (
        <div className="mt-8">
          {loadingOrders ? (
            <Spinner label="Loading your orders" />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              description="When you order a plant, it will show up here with live delivery status."
              action={
                <Link to="/shop" className="btn btn-primary btn-sm mt-2">
                  Shop plants
                </Link>
              }
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-display text-xl text-ink">{order.orderNumber}</h3>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">
                        Placed {formatDate(order.createdAt)} · {order.items.length}{' '}
                        {order.items.length === 1 ? 'item' : 'items'} · {money(order.total)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {['pending', 'confirmed'].includes(order.status) && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(order.orderNumber)}
                          className="btn btn-ghost btn-sm text-rose"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                      <Link
                        to={`/order/${order.orderNumber}`}
                        className="btn btn-secondary btn-sm"
                      >
                        View order
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-sand/70 pt-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2.5 rounded-full bg-parchment/70 py-1 pl-1 pr-3"
                      >
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="arch-soft h-9 w-8 object-cover ring-1 ring-sand/60"
                        />
                        <span className="text-xs text-ink-soft">
                          {item.name} <span className="text-ink-faint">×{item.qty}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------ gardens ---------------------------- */}
      {tab === 'gardens' && (
        <div className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow flex items-center gap-2.5">
                <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
                Landscaping
                <Blossom size={11} className="text-clay/60" strokeWidth={0.9} />
              </p>
              <h2 className="mt-2 font-display text-2xl text-forest">Your garden requests</h2>
              <p className="mt-1.5 max-w-lg text-sm text-ink-soft">
                Every quotation request you have sent us, and where it has got to.
              </p>
            </div>
            <Link to="/landscaping#quote" className="btn btn-secondary btn-sm">
              <Sprout size={14} /> New request
            </Link>
          </div>

          {loadingGardens ? (
            <Spinner label="Loading your garden requests" />
          ) : gardenRequests.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={Sprout}
                title="No garden requests yet"
                description="Tell us the land size, where it is and the flowers you love — we come back with a written quotation."
                action={
                  <Link to="/landscaping#quote" className="btn btn-primary btn-sm mt-2">
                    Request a quotation
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {gardenRequests.map((request) => {
                const meta = REQUEST_STATUS_META[request.status] || REQUEST_STATUS_META.new;
                return (
                  <article
                    key={request.id}
                    className="card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink-faint">
                          {request.reference}
                        </p>
                        <h3 className="mt-1 font-display text-xl leading-snug text-ink">
                          {labelFor(SITE_TYPES, request.siteType)}
                          {request.location ? ` · ${request.location}` : ''}
                        </h3>
                        <p className="mt-0.5 text-sm text-ink-soft">
                          Sent {formatDate(request.createdAt)}
                          {request.timeline ? ` · ${labelFor(TIMELINES, request.timeline)}` : ''}
                        </p>
                      </div>
                      <span className={`badge ${meta.className}`}>{meta.label}</span>
                    </div>

                    <dl className="mt-4 grid gap-x-5 gap-y-3 border-t border-sand/70 pt-4 sm:grid-cols-2">
                      {[
                        { label: 'Land size', value: request.landSize, icon: Sprout },
                        { label: 'Budget guide', value: labelFor(BUDGETS, request.budget), icon: null },
                      ].map((row) => (
                        <div key={row.label}>
                          <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-faint">
                            {row.label}
                          </dt>
                          <dd className="mt-0.5 flex items-start gap-1.5 text-sm text-ink">
                            {row.icon && (
                              <row.icon
                                size={13}
                                className="mt-1 shrink-0 text-leaf"
                                strokeWidth={1.6}
                              />
                            )}
                            {row.value || '—'}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    {request.preferredFlowers.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-faint">
                          Preferred flowers
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {request.preferredFlowers.map((flower) => (
                            <span
                              key={flower}
                              className="inline-flex items-center gap-1 rounded-full border border-sand bg-white px-2.5 py-1 text-[0.72rem] text-forest"
                            >
                              <Flower2 size={11} /> {flower}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {request.notes && (
                      <p className="mt-4 rounded-xl border border-sand/70 bg-parchment/60 px-3.5 py-3 text-[0.82rem] leading-relaxed text-ink-soft">
                        {request.notes}
                      </p>
                    )}

                    {(request.messages || []).length > 0 && (
                      <div className="mt-4">
                        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-faint">
                          Conversation
                        </p>
                        <ul className="mt-2 space-y-2.5">
                          {(request.messages || []).map((message) => {
                            const fromStudio = message.author === 'studio';
                            return (
                              <li
                                key={message.id}
                                className={`rounded-xl border px-3.5 py-2.5 ${
                                  fromStudio
                                    ? 'border-sage/45 bg-sage-soft'
                                    : 'border-sand/70 bg-white'
                                }`}
                              >
                                <p className="flex flex-wrap items-baseline gap-x-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                                  <span className={fromStudio ? 'text-forest' : 'text-ink-soft'}>
                                    {fromStudio ? 'Hinga garden team' : 'You'}
                                  </span>
                                  <span className="font-normal normal-case tracking-normal">
                                    {formatDate(message.createdAt)}
                                  </span>
                                </p>
                                <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-soft">
                                  {message.body}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {request.status === 'lost' ? (
                      <p className="mt-4 border-t border-sand/70 pt-3.5 text-[0.78rem] text-ink-faint">
                        This request is closed, so messages are off. Start a new one whenever you are
                        ready and we will pick it up.
                      </p>
                    ) : (
                      <form
                        onSubmit={(event) => sendGardenMessage(event, request)}
                        className="mt-4 border-t border-sand/70 pt-3.5"
                      >
                        <label
                          htmlFor={`garden-message-${request.id}`}
                          className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-faint"
                        >
                          Message the garden team
                        </label>
                        <textarea
                          id={`garden-message-${request.id}`}
                          rows={2}
                          maxLength={2000}
                          className="field mt-1.5 resize-y text-sm"
                          placeholder="New measurements, a change of dates, or anything we should know…"
                          value={gardenDrafts[request.id] || ''}
                          onChange={(event) =>
                            setGardenDrafts((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          disabled={sendingGarden === request.id}
                        />
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[0.68rem] text-ink-faint">
                            We reply by email within two working days.
                          </span>
                          <button
                            type="submit"
                            className="btn btn-secondary btn-sm"
                            disabled={
                              sendingGarden === request.id ||
                              !(gardenDrafts[request.id] || '').trim()
                            }
                          >
                            <Send size={13} />
                            {sendingGarden === request.id ? 'Sending…' : 'Send message'}
                          </button>
                        </div>
                      </form>
                    )}

                    <p className="mt-4 flex items-start gap-2 border-t border-sand/70 pt-3.5 text-sm text-forest">
                      <Clock size={14} className="mt-0.5 shrink-0 text-leaf" strokeWidth={1.7} />
                      <span className="text-ink-soft">{REQUEST_STATUS_NOTE[request.status]}</span>
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------ profile ---------------------------- */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="mt-8 grid max-w-3xl gap-4 card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-7 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="eyebrow">Personal details</p>
            <h2 className="mt-2 font-display text-2xl text-forest">How we reach you</h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Used on receipts and delivery updates. Your email stays as the sign-in address.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="p-name">
              Full name
            </label>
            <input
              id="p-name"
              className="field"
              value={profile.name}
              onChange={(event) => setProfile((v) => ({ ...v, name: event.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="p-email">
              Email
            </label>
            <input id="p-email" className="field opacity-60" value={profile.email} disabled />
          </div>
          <div>
            <label className="label" htmlFor="p-phone">
              Phone
            </label>
            <input
              id="p-phone"
              className="field"
              value={profile.phone}
              onChange={(event) => setProfile((v) => ({ ...v, phone: event.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="p-city">
              City
            </label>
            <input
              id="p-city"
              className="field"
              value={profile.city}
              onChange={(event) => setProfile((v) => ({ ...v, city: event.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={savingProfile} className="btn btn-primary">
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {/* ---------------------------- appearance --------------------------- */}
      {tab === 'profile' && (
        <section className="mt-5 max-w-3xl card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 md:p-7">
          <p className="eyebrow">Appearance</p>
          <h2 className="mt-2 font-display text-2xl text-forest">How Hinga looks</h2>
          <p className="mt-1.5 max-w-lg text-sm text-ink-soft">
            Kept on this browser only. Choose system to follow your device's light or dark setting as
            it changes through the day.
          </p>
          <ThemeModePicker className="mt-5" />
        </section>
      )}

      {/* ----------------------------- addresses --------------------------- */}
      {tab === 'addresses' && (
        <div className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow flex items-center gap-2.5">
                <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
                Delivery details
                <Blossom size={11} className="text-clay/60" strokeWidth={0.9} />
              </p>
              <h2 className="mt-2 font-display text-2xl text-forest">Saved addresses</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddressForm((v) => !v)}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={14} /> Add address
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={addAddress} className="mt-5 grid gap-4 card-petal rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] p-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="a-label">
                  Label
                </label>
                <input
                  id="a-label"
                  className="field"
                  value={addressForm.label}
                  onChange={(event) =>
                    setAddressForm((v) => ({ ...v, label: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label" htmlFor="a-recipient">
                  Recipient
                </label>
                <input
                  id="a-recipient"
                  required
                  className="field"
                  value={addressForm.recipient}
                  onChange={(event) =>
                    setAddressForm((v) => ({ ...v, recipient: event.target.value }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="a-address">
                  Street address
                </label>
                <input
                  id="a-address"
                  required
                  className="field"
                  value={addressForm.address}
                  onChange={(event) =>
                    setAddressForm((v) => ({ ...v, address: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label" htmlFor="a-city">
                  City
                </label>
                <input
                  id="a-city"
                  required
                  className="field"
                  value={addressForm.city}
                  onChange={(event) => setAddressForm((v) => ({ ...v, city: event.target.value }))}
                />
              </div>
              <div>
                <label className="label" htmlFor="a-state">
                  County
                </label>
                <input
                  id="a-state"
                  className="field"
                  value={addressForm.state}
                  onChange={(event) => setAddressForm((v) => ({ ...v, state: event.target.value }))}
                />
              </div>
              <div>
                <label className="label" htmlFor="a-zip">
                  Postal code
                </label>
                <input
                  id="a-zip"
                  className="field"
                  value={addressForm.zip}
                  onChange={(event) => setAddressForm((v) => ({ ...v, zip: event.target.value }))}
                />
              </div>
              <div className="flex items-end justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Check size={14} /> Save
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {addresses.length === 0 ? (
              <div className="sm:col-span-2 flex flex-col items-center gap-2 rounded-tl-[2rem] rounded-br-[2rem] rounded-tr-[0.8rem] rounded-bl-[0.8rem] border border-dashed border-sand bg-white/60 px-6 py-12 text-center">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-sage-soft text-forest">
                  <MapPin size={19} />
                </span>
                <p className="mt-1 font-display text-lg text-ink">No saved addresses yet</p>
                <p className="max-w-xs text-sm text-ink-soft">
                  Save the gate, office or home address we deliver to most often.
                </p>
              </div>
            ) : (
              addresses.map((address) => (
                <div key={address.id} className="card-petal rounded-tl-[1.5rem] rounded-br-[1.5rem] rounded-tr-[0.7rem] rounded-bl-[0.7rem] p-4">
                  <div className="flex items-start justify-between">
                    <span className="badge bg-sage-soft text-forest">{address.label}</span>
                    <button
                      type="button"
                      onClick={() => removeAddress(address.id)}
                      className="text-ink-faint transition-colors hover:text-rose"
                      aria-label="Remove address"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <p className="mt-3 font-display text-lg text-ink">{address.recipient}</p>
                  <p className="text-sm text-ink-soft">{address.address}</p>
                  <p className="text-sm text-ink-soft">
                    {address.city}
                    {address.state ? `, ${address.state}` : ''} {address.zip}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
