import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { compactMoney, money } from '../../lib/format.js';
import { Blossom, ImageWithFallback, Sprig } from '../ui.jsx';

const pad = (value) => String(value).padStart(2, '0');

function msUntilMidnight() {
  const end = new Date();
  end.setHours(24, 0, 0, 0);
  return end.getTime() - Date.now();
}

function toParts(milliseconds) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    mins: Math.floor((total % 3600) / 60),
    secs: total % 60,
  };
}

export function DealOfTheDay({ product }) {
  const [remaining, setRemaining] = useState(() => toParts(msUntilMidnight()));

  useEffect(() => {
    const timer = setInterval(() => setRemaining(toParts(msUntilMidnight())), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!product) return null;

  const units = [
    ['Days', remaining.days],
    ['Hours', remaining.hours],
    ['Mins', remaining.mins],
    ['Secs', remaining.secs],
  ];

  return (
    <section className="relative overflow-hidden bg-mist py-20 md:py-24">
      <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-40" />
      <Sprig
        className="pointer-events-none absolute -left-10 bottom-0 hidden text-sage/25 lg:block"
        size={300}
      />

      <div className="container-page relative">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <div className="relative mx-auto flex w-full max-w-md items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 m-auto aspect-square w-[98%] rounded-full border border-sage/30"
            />
            <div aria-hidden="true" className="absolute inset-0 m-auto aspect-square w-[92%] rounded-full bg-cream/80" />
            <Link
              to={`/product/${product.slug}`}
              className="relative block w-[80%] overflow-hidden rounded-full ring-8 ring-cream/60"
              aria-label={`View ${product.name}`}
            >
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                seed={product.id}
                className="aspect-square w-full object-cover transition-transform duration-[900ms] hover:scale-105"
              />
            </Link>

            <div className="badge-burst absolute right-0 top-2 grid h-24 w-24 -rotate-6 place-items-center bg-gold-soft text-center text-forest shadow-xl shadow-forest/15 sm:right-4">
              <span className="block">
                <span className="block text-[0.52rem] font-bold uppercase tracking-[0.2em] text-clay">
                  Only
                </span>
                <span className="mt-0.5 block font-display text-[1.6rem] leading-tight">
                  {compactMoney(product.price)}
                </span>
              </span>
            </div>

            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-2 grid h-12 w-12 place-items-center rounded-full bg-cream text-clay shadow-md sm:left-6"
            >
              <Blossom size={22} strokeWidth={1.1} />
            </span>
          </div>

          <div className="text-center lg:text-left">
            <p className="eyebrow flex items-center justify-center gap-2.5 lg:justify-start">
              <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
              Highlight item
            </p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[1.04] text-forest">
              Deals of the <span className="accent">day</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[0.9375rem] leading-7 text-ink-soft lg:mx-0">
              Today only, save {product.discountPercent || 15}% on the {product.name}. Potted and
              watered this morning, then sent upright to your door.
            </p>

            <div className="mt-9 flex items-start justify-center gap-2.5 sm:gap-4 lg:justify-start">
              {units.map(([label, value], index) => (
                <Fragment key={label}>
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className="pt-5 font-display text-xl text-clay/50 sm:pt-6"
                    >
                      :
                    </span>
                  )}
                  <div className="text-center">
                    <div className="grid h-[4.25rem] w-[4.25rem] place-items-center rounded-full border border-sand/80 bg-cream font-display text-[1.65rem] tabular-nums text-forest sm:h-20 sm:w-20 sm:text-3xl">
                      {pad(value)}
                    </div>
                    <span className="mt-2 block text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-ink-faint sm:text-[0.6rem]">
                      {label}
                    </span>
                  </div>
                </Fragment>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 lg:justify-start">
              <Link to={`/product/${product.slug}`} className="btn btn-primary btn-lg">
                <ShoppingCart size={16} /> Only {compactMoney(product.price)}
              </Link>
              {product.compareAt > 0 && (
                <p className="text-sm text-ink-faint">
                  Usually <span className="line-through">{money(product.compareAt)}</span>
                </p>
              )}
            </div>

            <p className="mt-4 text-xs tracking-wide text-ink-faint">
              Ends at midnight · While stock lasts
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
