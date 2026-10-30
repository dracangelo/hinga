import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Minus, Plus, Loader2, PackageOpen } from 'lucide-react';
import { ORDER_STATUS_META, PAYMENT_STATUS_META, titleCase } from '../lib/format.js';

/* ------------------------------------------------------------------ */
/* Botanical ornaments                                                 */
/* ------------------------------------------------------------------ */

export function Blossom({ size = 22, className = '', strokeWidth = 1.5, petals = 5 }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth * 2}
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: petals }).map((_, index) => (
        <ellipse
          key={index}
          cx="32"
          cy="15"
          rx="9"
          ry="12.5"
          transform={`rotate(${(360 / petals) * index} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="4.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** A loose, hand-drawn stem with leaves — used as decoration, never as content. */
export function Sprig({ className = '', size = 150, flip = false }) {
  return (
    <svg
      viewBox="0 0 160 90"
      width={size}
      height={(size * 90) / 160}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      className={className}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <path d="M4 86C30 80 66 64 104 40c14-9 26-19 36-31" />
      <ellipse cx="26" cy="72" rx="11" ry="4.5" transform="rotate(-32 26 72)" />
      <ellipse cx="42" cy="62" rx="11" ry="4.5" transform="rotate(6 42 62)" />
      <ellipse cx="58" cy="58" rx="11" ry="4.5" transform="rotate(-38 58 58)" />
      <ellipse cx="72" cy="47" rx="11" ry="4.5" transform="rotate(2 72 47)" />
      <ellipse cx="87" cy="42" rx="11" ry="4.5" transform="rotate(-42 87 42)" />
      <ellipse cx="99" cy="31" rx="10" ry="4" transform="rotate(-4 99 31)" />
      <ellipse cx="113" cy="25" rx="10" ry="4" transform="rotate(-46 113 25)" />
      <ellipse cx="126" cy="14" rx="9" ry="3.6" transform="rotate(-12 126 14)" />
      <circle cx="145" cy="6" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Image with graceful fallback                                        */
/* ------------------------------------------------------------------ */

const GRADIENTS = [
  'from-blush to-parchment',
  'from-sage-soft to-parchment',
  'from-gold-soft to-parchment',
  'from-rose-soft to-parchment',
];

export function ImageWithFallback({ src, alt, className = '', seed = 0 }) {
  const [failed, setFailed] = useState(false);
  const gradient = GRADIENTS[Math.abs(seed) % GRADIENTS.length];

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
        role="img"
        aria-label={alt}
      >
        <Blossom size={34} className="opacity-50" strokeWidth={1.1} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Stars                                                               */
/* ------------------------------------------------------------------ */

export function Stars({ value = 0, size = 13, showValue = false, count }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
        {[0, 1, 2, 3, 4].map((index) => {
          const filled = rounded >= index + 1;
          const half = !filled && rounded >= index + 0.5;
          return (
            <span key={index} className="relative inline-block" style={{ width: size, height: size }}>
              <Star size={size} className="absolute inset-0 text-sand" strokeWidth={1.6} />
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? size / 2 : size }}
                >
                  <Star size={size} className="text-gold" fill="currentColor" strokeWidth={1.2} />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && <span className="text-xs font-medium text-ink-soft">{value.toFixed(1)}</span>}
      {count !== undefined && (
        <span className="text-xs text-ink-faint">({count})</span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export function StatusBadge({ status }) {
  const meta = ORDER_STATUS_META[status] || {
    label: titleCase(status),
    className: 'bg-parchment text-ink-soft',
  };
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

export function PaymentBadge({ status }) {
  const meta = PAYMENT_STATUS_META[status] || {
    label: titleCase(status),
    className: 'bg-parchment text-ink-soft',
  };
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

/* ------------------------------------------------------------------ */
/* Quantity stepper                                                    */
/* ------------------------------------------------------------------ */

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md' }) {
  const dimensions = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = size === 'sm' ? 13 : 15;
  return (
    <div className="inline-flex items-center rounded-full border border-sand bg-white">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={`${dimensions} grid place-items-center rounded-full text-ink-soft transition hover:bg-parchment disabled:opacity-30`}
        aria-label="Decrease quantity"
      >
        <Minus size={iconSize} />
      </button>
      <span className="w-7 text-center text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={`${dimensions} grid place-items-center rounded-full text-ink-soft transition hover:bg-parchment disabled:opacity-30`}
        aria-label="Increase quantity"
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading / empty                                                     */
/* ------------------------------------------------------------------ */

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-faint">
      <Loader2 size={26} className="animate-spin" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-sand/70 bg-white">
      <div className="shimmer arch-soft m-2 mb-0 aspect-[4/5] w-[calc(100%-1rem)]" />
      <div className="space-y-2 p-4">
        <div className="shimmer h-4 w-2/3 rounded" />
        <div className="shimmer h-3 w-1/3 rounded" />
        <div className="shimmer h-5 w-1/4 rounded" />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = PackageOpen, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-sand bg-white/60 px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-sage-soft text-forest">
        <Icon size={22} />
      </span>
      <h3 className="text-lg text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-soft">{description}</p>}
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="eyebrow mb-3.5 flex items-center gap-2.5">
            <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
            {eyebrow}
            <Blossom size={11} className="text-clay/60" strokeWidth={0.9} />
          </p>
        )}
        <h2 className="section-title">{title}</h2>
        {description && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

export function PageHeader({ eyebrow, title, description, aside, backTo, backLabel }) {
  return (
    <header className="relative isolate overflow-hidden border-b border-sand/60 bg-parchment/60">
      <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-40" />
      <Blossom
        size={280}
        strokeWidth={0.5}
        className="pointer-events-none absolute -right-16 -top-20 text-forest/[0.05]"
      />
      <div className="container-page relative py-9 md:py-12">
        {backTo && (
          <Link
            to={backTo}
            className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-soft transition-colors hover:text-forest"
          >
            <span aria-hidden="true">←</span> {backLabel}
          </Link>
        )}
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="max-w-2xl">
            <p className="eyebrow flex items-center gap-2.5">
              <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
              {eyebrow}
              <Blossom size={11} className="text-clay/60" strokeWidth={0.9} />
            </p>
            <h1 className="mt-3.5 font-display text-[clamp(2rem,4.4vw,2.9rem)] leading-[1.05] text-forest">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{description}</p>
            )}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Price                                                               */
/* ------------------------------------------------------------------ */

export function Price({ value, compareAt, className = '' }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-medium text-ink">{value}</span>
      {compareAt > 0 && (
        <span className="text-sm text-ink-faint line-through">{compareAt}</span>
      )}
    </span>
  );
}

export function LinkButton({ to, children, className = 'btn btn-secondary', ...props }) {
  return (
    <Link to={to} className={className} {...props}>
      {children}
    </Link>
  );
}
