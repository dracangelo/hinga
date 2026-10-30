import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Flower2,
  Leaf,
  MapPin,
  Send,
  Sprout,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Blossom, ImageWithFallback, SectionHeading, Sprig } from '../components/ui.jsx';
import { IMG } from '../lib/catalog.js';
import {
  BUDGETS,
  FLOWER_OPTIONS,
  SITE_TYPES,
  TIMELINES,
  labelFor,
} from '../lib/landscaping.js';

const HERO_IMAGE = IMG('1585320806297-9794b3e4eeae', 1400);

const SERVICES = [
  {
    title: 'Gardens from bare ground',
    copy: 'Beds, borders and lawn edges planted in layers, so something is always in leaf or in bloom.',
    image: IMG('1598902108854-10e335adac99', 900),
    points: ['Soil preparation & drainage', 'Trees, shrubs and flowering beds', 'Drought-tolerant planting'],
  },
  {
    title: 'Courtyards, terraces & rooftops',
    copy: 'Container gardens for smaller ground — balconies, roof terraces and paved courtyards.',
    image: IMG('1580587771525-78b9dba3b914', 900),
    points: ['Statement planters & screening', 'Seasonal flower rotations', 'Watering plans that suit the site'],
  },
  {
    title: 'Offices, hotels & schools',
    copy: 'Entrances, atriums and shared grounds that stay presentable through the working week.',
    image: IMG('1558904541-efa843a96f01', 900),
    points: ['Entrance and reception planting', 'Indoor foliage for light levels', 'Optional monthly care visits'],
  },
];

const STEPS = [
  {
    label: 'Share the site',
    copy: 'Land size, location and the flowers you love. Photos help, but are not essential.',
  },
  {
    label: 'Site visit',
    copy: 'We walk the ground with you, measure properly and talk through light, soil and water.',
  },
  {
    label: 'Written quotation',
    copy: 'A clear, itemised quote — plants, pots, labour, soil and delivery — within three working days.',
  },
  {
    label: 'Planting & aftercare',
    copy: 'Our team plants, cleans up and leaves a simple care card for the first six weeks.',
  },
];

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  location: '',
  landSize: '',
  siteType: 'home-garden',
  timeline: 'within-a-month',
  budget: 'unsure',
  otherFlowers: '',
  notes: '',
};

export function Landscaping() {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const formRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [flowers, setFlowers] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: current.name || user.name || '',
      email: current.email || user.email || '',
      phone: current.phone || user.phone || '',
    }));
  }, [user]);

  useEffect(() => {
    if (location.hash !== '#quote') return;
    const timer = setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => clearTimeout(timer);
  }, [location.hash]);

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError('');
  };

  const toggleFlower = (flower) => {
    setFlowers((current) =>
      current.includes(flower) ? current.filter((item) => item !== flower) : [...current, flower],
    );
    setError('');
  };

  const goToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => formRef.current?.querySelector('input')?.focus({ preventScroll: true }), 500);
  };

  const reset = () => {
    setForm({
      ...EMPTY_FORM,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setFlowers([]);
    setError('');
    setSent(null);
    setTimeout(goToForm, 80);
  };

  const submit = async (event) => {
    event.preventDefault();
    const chosen = [...flowers];
    const other = form.otherFlowers.trim();
    if (other) chosen.push(other);

    if (!chosen.length) {
      setError('Pick at least one flower you would like planted, or tell us in the notes.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const result = await api.requestQuotation({
        name: form.name,
        email: form.email,
        phone: form.phone,
        location: form.location,
        landSize: form.landSize,
        siteType: form.siteType,
        preferredFlowers: chosen,
        timeline: form.timeline,
        budget: form.budget,
        notes: form.notes,
      });
      setSent(result.request);
      toast.success(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                             */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden border-b border-sand/60 bg-parchment/50">
        <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-page relative grid gap-10 py-11 md:py-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow flex items-center gap-2.5">
              <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
              Landscaping · Nairobi &amp; beyond
              <Blossom size={11} className="text-clay/60" strokeWidth={0.9} />
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.35rem,5.2vw,3.85rem)] leading-[0.99] text-forest">
              We plant whole <span className="accent">gardens</span>, not just pots.
            </h1>
            <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
              From a bare courtyard in Kilimani to a half-acre garden in Karen, we design, plant and
              tend outdoor rooms — working with the light, soil and water your site already has.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={goToForm} className="btn btn-primary btn-lg">
                Request a quotation
                <ArrowRight size={16} />
              </button>
              <Link to="/shop" className="btn btn-secondary btn-lg">
                <Leaf size={16} /> Browse the plant studio
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-ink-soft">
              <li className="inline-flex items-center gap-2">
                <Check size={13} className="text-leaf" /> Site visit included
              </li>
              <li className="inline-flex items-center gap-2">
                <Check size={13} className="text-leaf" /> Written quote in 3 days
              </li>
              <li className="inline-flex items-center gap-2">
                <Check size={13} className="text-leaf" /> Six weeks of aftercare
              </li>
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="arch overflow-hidden border border-sand/70 bg-parchment p-2">
              <ImageWithFallback
                src={HERO_IMAGE}
                alt="A rose-lined garden path planted by the studio"
                className="arch aspect-[4/5] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-2 max-w-[15rem] rounded-[1.15rem] border border-sand/80 bg-cream/95 p-4 shadow-[0_24px_50px_-32px_rgba(36,31,26,0.6)] backdrop-blur sm:-left-6">
              <p className="eyebrow text-[0.6rem]">Recent ground</p>
              <p className="mt-1.5 font-display text-lg leading-tight text-forest">
                Courtyard replant
              </p>
              <p className="mt-1 text-xs text-ink-soft">Karen · 240 m² · roses &amp; jasmine</p>
            </div>
            <Blossom
              size={64}
              strokeWidth={0.65}
              className="pointer-events-none absolute -right-4 -top-5 text-clay/25 sm:-right-7"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Services                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section className="container-page py-14 md:py-20">
        <SectionHeading
          eyebrow="What we plant"
          title={
            <>
              Outdoor rooms, planted <span className="accent">properly</span>
            </>
          }
          description="Every commission starts with the ground itself — how much sun it gets, where water sits, and how you actually want to use it."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {SERVICES.map((service, index) => (
            <article key={service.title} className="group flex flex-col">
              <div className="overflow-hidden rounded-[1.5rem] border border-sand/70 bg-parchment">
                <ImageWithFallback
                  src={service.image}
                  alt={service.title}
                  className="aspect-[5/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-display text-sm text-clay/70">0{index + 1}</span>
                <h3 className="font-display text-[1.35rem] leading-tight text-forest">
                  {service.title}
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{service.copy}</p>
              <ul className="mt-4 space-y-1.5 border-t border-sand/70 pt-4">
                {service.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[0.8rem] text-ink-soft">
                    <Leaf size={12} strokeWidth={1.6} className="mt-0.5 shrink-0 text-leaf" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Process                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden bg-forest py-14 text-cream md:py-18">
        <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-10" />
        <Sprig
          size={240}
          flip
          className="pointer-events-none absolute -right-8 -top-6 hidden text-sage/15 lg:block"
        />
        <div className="container-page relative">
          <div className="max-w-2xl">
            <p className="eyebrow flex items-center gap-2.5 text-sage">
              <span aria-hidden="true" className="h-px w-7 bg-sage/50" />
              From first message to planting day
            </p>
            <h2 className="mt-3.5 font-display text-[clamp(1.8rem,3.3vw,2.5rem)] leading-[1.08] text-cream">
              Four unhurried <span className="italic text-blush">steps</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-cream/65">
              Most gardens go from first message to planting day in three to six weeks, depending on
              how the rains fall.
            </p>
          </div>

          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.label} className="relative border-t border-cream/20 pt-5">
                <span className="font-display text-[2.1rem] leading-none text-sage/60">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-base font-medium text-cream">{step.label}</h3>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-cream/60">{step.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Quotation                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="quote"
        ref={formRef}
        className="relative isolate scroll-mt-24 overflow-hidden border-b border-sand/60 bg-parchment/55 py-14 md:py-20"
      >
        <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-35" />
        <div className="container-page relative grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow flex items-center gap-2.5">
              <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
              Request a quotation
              <Blossom size={11} className="text-clay/60" strokeWidth={0.9} />
            </p>
            <h2 className="mt-3.5 font-display text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.05] text-forest">
              Tell us about the <span className="accent">ground</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              Three things are enough to start: how big the ground is, where it is, and the flowers
              you would love to see in it. We will take it from there.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                {
                  icon: Sprout,
                  title: 'Land size',
                  copy: 'Roughly, in square metres or acres. Nobody measures before we visit.',
                },
                {
                  icon: MapPin,
                  title: 'Site location',
                  copy: 'The estate, town or county — it tells us about rainfall and soil.',
                },
                {
                  icon: Flower2,
                  title: 'Preferred flowers',
                  copy: 'Pick from our palette or describe your own. Colour notes are welcome.',
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-sage/40 bg-cream text-forest">
                    <item.icon size={16} strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{item.copy}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-[1.15rem] border border-sand/80 bg-cream/80 p-5">
              <p className="eyebrow text-[0.6rem]">Good to know</p>
              <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                Site visits are free within Nairobi. Upcountry projects start with photos and a
                video call. Quotations are itemised and valid for 30 days.
              </p>
            </div>
          </div>

          {sent ? (
            <div className="animate-rise overflow-hidden rounded-[1.5rem] border border-sand/80 bg-white shadow-[0_30px_60px_-45px_rgba(36,31,26,0.6)]">
              <div className="relative isolate overflow-hidden bg-forest p-7 text-cream md:p-8">
                <div aria-hidden="true" className="bg-fern absolute inset-0 opacity-10" />
                <div className="relative">
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-cream/25 text-sage">
                    <CheckCircle2 size={21} strokeWidth={1.5} />
                  </span>
                  <p className="mt-5 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-sage">
                    Reference {sent.reference}
                  </p>
                  <h3 className="mt-2 font-display text-[1.9rem] leading-tight text-cream">
                    Request <span className="italic text-blush">received</span>
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-cream/70">
                    Thank you, {sent.name.split(' ')[0]}. The garden team has your brief and will
                    reply by phone or email within one working day.
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                  {[
                    { label: 'Site', value: sent.location },
                    { label: 'Land size', value: sent.landSize },
                    { label: 'Type of ground', value: labelFor(SITE_TYPES, sent.siteType) },
                    { label: 'Timeline', value: labelFor(TIMELINES, sent.timeline) },
                  ].map((row) => (
                    <div key={row.label}>
                      <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                        {row.label}
                      </dt>
                      <dd className="mt-1 text-sm text-ink">{row.value || '—'}</dd>
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
                      Preferred flowers
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-1.5">
                      {sent.preferredFlowers.length ? (
                        sent.preferredFlowers.map((flower) => (
                          <span
                            key={flower}
                            className="inline-flex items-center gap-1.5 rounded-full border border-sand bg-parchment/70 px-2.5 py-1 text-[0.72rem] text-forest"
                          >
                            <Flower2 size={11} /> {flower}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-ink-soft">Open to suggestions</span>
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 rounded-[1.15rem] border border-sand/80 bg-parchment/60 p-5">
                  <p className="eyebrow flex items-center gap-2 text-[0.6rem]">
                    <Clock size={12} /> What happens next
                  </p>
                  <ol className="mt-3 space-y-2 text-xs leading-relaxed text-ink-soft">
                    <li>
                      <span className="font-medium text-ink">1.</span> A short call to confirm the
                      brief and arrange a site visit.
                    </li>
                    <li>
                      <span className="font-medium text-ink">2.</span> A walk around the ground, with
                      measurements and photos.
                    </li>
                    <li>
                      <span className="font-medium text-ink">3.</span> An itemised written quotation
                      within three working days of the visit.
                    </li>
                  </ol>
                </div>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <button type="button" onClick={reset} className="btn btn-primary">
                    Plan another garden
                  </button>
                  <Link to="/shop" className="btn btn-secondary">
                    Browse plants &amp; pots
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={submit}
              noValidate
              className="rounded-[1.5rem] border border-sand/80 bg-white p-6 shadow-[0_30px_60px_-45px_rgba(36,31,26,0.55)] md:p-8"
            >
              <fieldset className="space-y-4">
                <legend className="mb-4 flex w-full items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink-faint">
                  <span className="h-px flex-1 bg-sand" />
                  Your details
                  <span className="h-px flex-1 bg-sand" />
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="ls-name">
                      Full name
                    </label>
                    <input
                      id="ls-name"
                      className="field"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={set('name')}
                      placeholder="Wanjiru Kamau"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="ls-email">
                      Email
                    </label>
                    <input
                      id="ls-email"
                      type="email"
                      className="field"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={set('email')}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="ls-phone">
                      Phone
                    </label>
                    <input
                      id="ls-phone"
                      type="tel"
                      className="field"
                      required
                      autoComplete="tel"
                      value={form.phone}
                      onChange={set('phone')}
                      placeholder="+254 7…"
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="mt-7 space-y-4">
                <legend className="mb-4 flex w-full items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink-faint">
                  <span className="h-px flex-1 bg-sand" />
                  The site
                  <span className="h-px flex-1 bg-sand" />
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="ls-location">
                      Location
                    </label>
                    <input
                      id="ls-location"
                      className="field"
                      required
                      value={form.location}
                      onChange={set('location')}
                      placeholder="Estate or area, town — e.g. Karen, Nairobi"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="ls-size">
                      Approximate land size
                    </label>
                    <input
                      id="ls-size"
                      className="field"
                      required
                      value={form.landSize}
                      onChange={set('landSize')}
                      placeholder="e.g. 240 m² or half an acre"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="ls-type">
                      Type of ground
                    </label>
                    <select
                      id="ls-type"
                      className="field"
                      value={form.siteType}
                      onChange={set('siteType')}
                    >
                      {SITE_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>

              <fieldset className="mt-7">
                <legend className="mb-4 flex w-full items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-ink-faint">
                  <span className="h-px flex-1 bg-sand" />
                  Planting brief
                  <span className="h-px flex-1 bg-sand" />
                </legend>

                <p className="label">Preferred flowers</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Preferred flowers">
                  {FLOWER_OPTIONS.map((flower) => {
                    const active = flowers.includes(flower);
                    return (
                      <button
                        key={flower}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleFlower(flower)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] transition-colors ${
                          active
                            ? 'border-forest bg-forest text-cream'
                            : 'border-sand bg-white text-ink-soft hover:border-sage hover:text-forest'
                        }`}
                      >
                        {active ? <Check size={12} /> : <Flower2 size={12} strokeWidth={1.7} />}
                        {flower}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <label className="label" htmlFor="ls-other">
                    Other flowers or colours
                  </label>
                  <input
                    id="ls-other"
                    className="field"
                    value={form.otherFlowers}
                    onChange={set('otherFlowers')}
                    placeholder="e.g. white frangipani, soft pinks, something fragrant"
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="ls-timeline">
                      When would you like it planted?
                    </label>
                    <select
                      id="ls-timeline"
                      className="field"
                      value={form.timeline}
                      onChange={set('timeline')}
                    >
                      {TIMELINES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="ls-budget">
                      Budget guide <span className="normal-case text-ink-faint">(optional)</span>
                    </label>
                    <select
                      id="ls-budget"
                      className="field"
                      value={form.budget}
                      onChange={set('budget')}
                    >
                      {BUDGETS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="label" htmlFor="ls-notes">
                    Anything else about the site
                  </label>
                  <textarea
                    id="ls-notes"
                    rows={3}
                    className="field resize-y"
                    value={form.notes}
                    onChange={set('notes')}
                    placeholder="Shade, borehole or tap, existing plants, how you want to use the space…"
                  />
                </div>
              </fieldset>

              {error && (
                <p
                  role="alert"
                  className="mt-5 flex items-start gap-2 rounded-xl border border-rose/30 bg-rose-soft px-3.5 py-2.5 text-xs leading-relaxed text-rose"
                >
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-sand/70 pt-5">
                <button type="submit" disabled={busy} className="btn btn-primary btn-lg">
                  <Send size={15} /> {busy ? 'Sending…' : 'Request my quotation'}
                </button>
                <p className="max-w-[16rem] text-[0.7rem] leading-relaxed text-ink-faint">
                  No obligation. We only use your details to prepare the quote.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
