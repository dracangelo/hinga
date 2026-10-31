import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Check } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useCategories } from '../lib/useCategories.js';
import { Blossom, Sprig } from './ui.jsx';

/* lucide dropped brand glyphs in v1, so the social marks are inlined. */
const SOCIALS = [
  {
    label: 'Instagram',
    path: 'M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 1.8.25 2.2.42.6.22 1 .48 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.8.07-1.1.05-1.7.24-2.1.4-.5.2-.9.44-1.3.83-.4.4-.63.8-.83 1.3-.16.4-.35 1-.4 2.1C2.5 8.5 2.5 8.9 2.5 12s0 3.5.07 4.8c.05 1.1.24 1.7.4 2.1.2.5.44.9.83 1.3.4.4.8.63 1.3.83.4.16 1 .35 2.1.4 1.3.07 1.7.07 4.8.07s3.5 0 4.8-.07c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.44 1.3-.83.4-.4.63-.8.83-1.3.16-.4.35-1 .4-2.1.07-1.3.07-1.7.07-4.8s0-3.5-.07-4.8c-.05-1.1-.24-1.7-.4-2.1a3.5 3.5 0 0 0-.83-1.3 3.5 3.5 0 0 0-1.3-.83c-.4-.16-1-.35-2.1-.4C15.5 4 15.1 4 12 4Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm6.4-8.3a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z',
  },
  {
    label: 'Facebook',
    path: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94Z',
  },
  {
    label: 'X',
    path: 'M17.53 3h3.02l-6.6 7.54L21.75 21h-5.9l-4.62-6.04L5.94 21H2.92l7.06-8.07L2.5 3h6.05l4.18 5.52L17.53 3Zm-1.06 16.17h1.67L7.6 4.74H5.8l10.67 14.43Z',
  },
];

function SocialIcon({ path, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={path} />
    </svg>
  );
}

const COLUMNS = [
  {
    title: 'Occasions',
    links: [
      { label: 'Anniversary', to: '/shop?occasion=anniversary' },
      { label: 'Birthday', to: '/shop?occasion=birthday' },
      { label: 'Sympathy', to: '/shop?occasion=sympathy' },
      { label: 'Thank you', to: '/shop?occasion=thank-you' },
      { label: 'Romance', to: '/shop?occasion=romance' },
      { label: 'Housewarming', to: '/shop?occasion=housewarming' },
    ],
  },
  {
    title: 'The studio',
    links: [
      { label: 'Landscaping', to: '/landscaping' },
      { label: 'Request a quotation', to: '/landscaping#quote' },
      { label: 'Our story', to: '/#story' },
      { label: 'Account', to: '/account' },
      { label: 'Your orders', to: '/account' },
      { label: 'Delivery & care', to: '/#delivery' },
      { label: 'Contact', to: '/#contact' },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const categories = useCategories();

  const columns = [
    {
      title: 'Shop',
      links: [
        { label: 'All plants & pots', to: '/shop' },
        ...categories.map((category) => ({
          label: category.name,
          to: `/shop?category=${category.slug}`,
        })),
      ],
    },
    ...COLUMNS,
  ];

  const subscribe = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      const result = await api.newsletter(email.trim());
      setSubscribed(true);
      toast.success(result.message);
      setEmail('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="relative isolate mt-24 overflow-hidden bg-forest text-cream">
      <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-10" />
      <Sprig
        className="pointer-events-none absolute -right-6 top-10 hidden text-sage/15 lg:block"
        size={280}
        flip
      />

      <div className="container-page relative py-16">
        <div className="mb-14 flex items-center gap-4">
          <span className="h-px flex-1 bg-cream/15" />
          <Blossom size={22} strokeWidth={0.9} className="text-sage/70" />
          <span className="h-px flex-1 bg-cream/15" />
        </div>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="SAMHIN logo"
                className="h-11 w-11 rounded-full border border-cream/25 object-cover"
              />
              <span className="font-display text-[1.7rem] leading-none text-cream">SAMHIN</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/65">
              Your Nairobi Plant Haven. Every plant is potted by hand, watered the
              morning it travels and sent out rooted — never cut — across Kenya.
            </p>
            <div className="mt-6 flex gap-2">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  onClick={(event) => event.preventDefault()}
                  className="grid h-9 w-9 place-items-center rounded-full border border-cream/20 text-cream/70 transition-colors hover:border-cream/50 hover:bg-cream/10 hover:text-cream"
                  aria-label={social.label}
                >
                  <SocialIcon path={social.path} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-sage">
                {column.title}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-cream/65 transition-colors hover:text-cream"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-tl-[2.25rem] rounded-br-[2.25rem] rounded-tr-[0.9rem] rounded-bl-[0.9rem] bg-cream p-7 text-ink md:p-9">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="eyebrow">The bloom club</p>
              <h3 className="mt-2 font-display text-2xl text-forest">
                Seasonal notes, new <span className="accent">arrivals</span>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Join for grower stories and 10% off your first order.
              </p>
            </div>
            {subscribed ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-sage-soft px-4 py-2.5 text-sm font-medium text-forest">
                <Check size={16} /> You're on the list
              </span>
            ) : (
              <form onSubmit={subscribe} className="flex w-full max-w-md gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="field"
                  aria-label="Email address"
                />
                <button type="submit" disabled={busy} className="btn btn-primary shrink-0">
                  <Send size={14} /> {busy ? 'Joining…' : 'Join'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-cream/15 pt-6 text-xs text-cream/55 md:flex-row">
          <p>© {new Date().getFullYear()} SAMHIN — Your Nairobi Plant Haven. All rights reserved.</p>
          <p className="inline-flex items-center gap-2">
            <Blossom size={10} strokeWidth={0.9} className="text-cream/50" />
            Free delivery over KSh 7,500 · Nairobi same-day before 1pm
          </p>
        </div>
      </div>
    </footer>
  );
}
