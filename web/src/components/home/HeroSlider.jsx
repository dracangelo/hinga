import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { PEX } from '../../lib/catalog.js';
import { Blossom } from '../ui.jsx';

const SLIDES = [
  {
    eyebrow: 'Welcome to SAMHIN',
    title: 'Plants that settle in and stay',
    accent: 'stay',
    body: 'Flowering plants, foliage and succulents, potted by hand in our Nairobi studio and delivered rooted, watered and ready for the windowsill.',
    cta: { label: 'Shop all plants', to: '/shop' },
    image: PEX(37397147, 1600),
    links: [
      { label: 'Flowering plants', to: '/shop?category=flowering-plants' },
      { label: 'Foliage plants', to: '/shop?category=foliage-plants' },
      { label: 'Succulents & cacti', to: '/shop?category=succulents-cacti' },
    ],
  },
  {
    eyebrow: 'In bloom now',
    title: 'Flowers that keep on flowering',
    accent: 'keep',
    body: 'Hydrangeas, kalanchoe and roses already in bud and bloom — a gift that is still going weeks after the day itself.',
    cta: { label: 'Shop flowering plants', to: '/shop?category=flowering-plants' },
    image: PEX(5362009, 1600),
    links: [
      { label: 'Hydrangeas', to: '/shop?category=flowering-plants&q=hydrangea' },
      { label: 'Kalanchoe', to: '/shop?category=flowering-plants&q=kalanchoe' },
      { label: 'Roses', to: '/shop?category=flowering-plants&q=rose' },
    ],
  },
  {
    eyebrow: 'Pots, kits & care',
    title: 'The pot matters as much as the plant',
    accent: 'pot',
    body: 'Unglazed terracotta, hand-thrown stoneware and the small tools that keep everything growing. Potting mix, feed and mister included.',
    cta: { label: 'Shop pots & care', to: '/shop?category=pots-care' },
    image: PEX(18864983, 1600),
    links: [
      { label: 'Terracotta pots', to: '/shop?category=pots-care&q=terracotta' },
      { label: 'Plant care kit', to: '/shop?category=pots-care&q=care' },
      { label: 'Potting mix', to: '/shop?category=pots-care&q=mix' },
    ],
  },
];

const pad = (value) => String(value).padStart(2, '0');

function SplitTitle({ title, accent }) {
  if (!accent || !title.includes(accent)) return title;
  const [before, after] = title.split(accent);
  return (
    <>
      {before}
      <span className="accent-clay">{accent}</span>
      {after}
    </>
  );
}

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = SLIDES[index];
  const total = SLIDES.length;

  const go = (direction) => setIndex((current) => (current + direction + total) % total);

  useEffect(() => {
    if (paused) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % total), 6500);
    return () => clearInterval(timer);
  }, [paused, index, total]);

  return (
    <section
      className="relative isolate overflow-hidden bg-parchment"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      {/* Full-bleed background images, cross-fading between slides */}
      <div className="absolute inset-0" aria-hidden="true">
        {SLIDES.map((item, slideIndex) => (
          <img
            key={item.eyebrow}
            src={item.image}
            alt=""
            loading={slideIndex === 0 ? 'eager' : 'lazy'}
            fetchPriority={slideIndex === 0 ? 'high' : 'low'}
            decoding="async"
            className={`absolute inset-0 h-full w-full scale-105 object-cover transition-[opacity,transform] duration-[1600ms] ease-out ${
              slideIndex === index ? 'scale-100 opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/92 to-cream/55 md:via-cream/78 md:to-cream/0" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream/85 via-transparent to-cream/15" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream to-transparent" />
      </div>

      <div className="container-page relative z-10 flex min-h-[36rem] flex-col justify-between pt-16 lg:min-h-[42rem] lg:pt-28">
        <div key={index} className="animate-rise max-w-[36rem] pb-12 lg:pb-16">
          <p className="flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-clay">
            <Blossom size={13} strokeWidth={0.95} className="text-clay/70" />
            <span className="h-px w-8 bg-clay/35" />
            {slide.eyebrow}
          </p>

          <h1 className="mt-7 font-display text-[clamp(2.75rem,6.2vw,5rem)] font-normal leading-[1.02] tracking-[-0.03em] text-forest">
            <SplitTitle title={slide.title} accent={slide.accent} />
          </h1>

          <p className="mt-7 max-w-[21rem] text-[0.9375rem] leading-7 text-ink-soft sm:max-w-md">
            {slide.body}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to={slide.cta.to} className="btn btn-primary btn-lg">
              {slide.cta.label}
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/shop"
              className="group inline-flex items-center gap-2 text-sm font-medium text-forest transition-colors hover:text-clay"
            >
              Browse the greenhouse
              <span className="h-px w-6 bg-forest/40 transition-all group-hover:w-9 group-hover:bg-clay" />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2">
            {slide.links.map((link, linkIndex) => (
              <Fragment key={link.to}>
                {linkIndex > 0 && <span aria-hidden="true" className="h-4 w-px bg-ink/15" />}
                <Link
                  to={link.to}
                  className="text-sm text-ink-soft underline-offset-4 transition-colors hover:text-forest hover:underline"
                >
                  {link.label}
                </Link>
              </Fragment>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-ink/10 py-5">
          <div className="flex items-center gap-2" role="tablist" aria-label="Choose a slide">
            {SLIDES.map((item, slideIndex) => (
              <button
                key={item.eyebrow}
                type="button"
                role="tab"
                aria-selected={slideIndex === index}
                aria-label={`Show slide ${slideIndex + 1}: ${item.eyebrow}`}
                onClick={() => setIndex(slideIndex)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slideIndex === index ? 'w-10 bg-forest' : 'w-3.5 bg-ink/20 hover:bg-clay/60'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <p className="font-display text-sm tabular-nums text-ink">
              {pad(index + 1)}
              <span className="text-ink-faint"> / {pad(total)}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous slide"
                className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-cream/70 text-ink-soft backdrop-blur transition-colors hover:border-clay/60 hover:text-clay"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next slide"
                className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-cream/70 text-ink-soft backdrop-blur transition-colors hover:border-clay/60 hover:text-clay"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
