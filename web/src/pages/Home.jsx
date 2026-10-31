import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Leaf, Heart, Quote, Clock, MapPin } from 'lucide-react';
import { api } from '../lib/api.js';
import { ProductGrid } from '../components/ProductCard.jsx';
import { Blossom, ImageWithFallback, SectionHeading, Sprig } from '../components/ui.jsx';
import { HeroSlider } from '../components/home/HeroSlider.jsx';
import { CategoryDirectory } from '../components/home/CategoryDirectory.jsx';
import { CategoryMosaic } from '../components/home/CategoryMosaic.jsx';
import { DealOfTheDay } from '../components/home/DealOfTheDay.jsx';

const PROMISES = [
  {
    icon: Truck,
    title: 'Packed upright',
    body: 'Every pot is cushioned, secured upright and watered the morning it leaves us.',
  },
  {
    icon: Leaf,
    title: 'Rooted, not cut',
    body: 'Nothing here is a cut stem. Your plant arrives in its pot, ready to keep growing.',
  },
  {
    icon: Heart,
    title: 'Potted by hand',
    body: 'Our team pots and dresses every plant — no drop-shipped boxes from a warehouse.',
  },
  {
    icon: Clock,
    title: '30-day care promise',
    body: 'If it sulks in its first month, send a photo and we replace it or refund you.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The hydrangea arrived in full bloom, not a bruised leaf on it. Three months later it is still flowering on my kitchen table.',
    name: 'Amelia R.',
    city: 'Nairobi',
  },
  {
    quote:
      'We send plants to every new client now. They arrive upright, properly potted, with a care card that people actually keep.',
    name: 'Marcus T.',
    city: 'Mombasa',
  },
  {
    quote:
      'The monstera was bigger than the photos and the terracotta pot was worth the price on its own. My third order this year.',
    name: 'Priya N.',
    city: 'Kisumu',
  },
];

const FALLBACK_DEAL = {
  id: 0,
  slug: 'blush-hydrangea',
  name: 'Blush Hydrangea',
  price: 5400,
  compareAt: 6200,
  discountPercent: 13,
  image:
    'https://images.pexels.com/photos/10102526/pexels-photo-10102526.jpeg?auto=compress&cs=tinysrgb&w=900',
};

/* Plants that photograph well in the circular deal slot. */
const DEAL_SLUGS = [
  'blush-hydrangea',
  'peace-lily',
  'phalaenopsis-orchid',
  'string-of-pearls',
];

export function Home() {
  const [deal, setDeal] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .products({ featured: 'true', limit: 8 })
      .then((data) => {
        if (active) setFeatured(data.products || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    api
      .dealOfTheDay()
      .then((res) => {
        if (active && res?.product) {
          setDeal(res.product);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const activeDeal = useMemo(() => {
    if (deal) return deal;
    const onSale = featured.filter((product) => product.compareAt > 0);
    const preferred = onSale.filter((product) => DEAL_SLUGS.includes(product.slug));
    const pool = preferred.length > 0 ? preferred : onSale;
    if (pool.length === 0) return featured[0] || FALLBACK_DEAL;
    return [...pool].sort((a, b) => b.discountPercent - a.discountPercent)[0];
  }, [deal, featured]);

  return (
    <div>
      {/* ------------------------------ hero ------------------------------ */}
      <HeroSlider />

      {/* --------------------------- categories --------------------------- */}
      <CategoryDirectory />

      {/* ------------------------ collection mosaic ----------------------- */}
      <CategoryMosaic />

      {/* -------------------------- deal of day --------------------------- */}
      <DealOfTheDay product={activeDeal} />

      {/* --------------------------- featured ----------------------------- */}
      <section className="bg-cream py-20 md:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Best sellers"
            title={
              <>
                What everyone is <span className="accent">ordering</span>
              </>
            }
            description="The plants our customers keep coming back for, updated as each crop comes into its own."
            action={
              <Link to="/shop" className="btn btn-secondary btn-sm">
                Browse all <ArrowRight size={14} />
              </Link>
            }
          />
          <ProductGrid products={featured} loading={loading} skeletonCount={8} />
        </div>
      </section>

      {/* ----------------------------- story ------------------------------ */}
      <section id="story" className="relative isolate overflow-hidden bg-forest py-20 text-cream md:py-24">
        <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-15" />
        <Sprig
          className="pointer-events-none absolute -right-8 top-8 hidden text-sage/20 lg:block"
          size={340}
          flip
        />
        <Blossom
          size={220}
          strokeWidth={0.5}
          className="pointer-events-none absolute -bottom-16 -left-16 text-cream/[0.06]"
        />

        <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
          <div className="relative">
            <ImageWithFallback
              src="https://images.pexels.com/photos/37397147/pexels-photo-37397147.jpeg?auto=compress&cs=tinysrgb&w=1000"
              alt="Terracotta pots stacked in our greenhouse"
              className="arch-soft aspect-[4/3] w-full object-cover ring-1 ring-cream/15"
            />
            <div className="absolute -bottom-6 -right-3 hidden rounded-tl-[2rem] rounded-br-[1.5rem] border border-cream/15 bg-forest-soft/95 px-5 py-4 backdrop-blur sm:block">
              <p className="font-display text-3xl text-blush">9 years</p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.2em] text-cream/60">
                of growing our own
              </p>
            </div>
          </div>

          <div>
            <p className="eyebrow text-blush/90">Our story</p>
            <h2 className="mt-4 font-display text-[clamp(1.9rem,3.6vw,2.8rem)] leading-[1.1] text-cream">
              We take the <span className="accent text-blush">whole tray</span>, so every
              plant arrives rooted
            </h2>
            <div className="mt-6 space-y-4 text-[0.9375rem] leading-relaxed text-cream/70">
              <p>
                Most shops buy plants a few at a time through a wholesaler who has already marked
                them up and held them in the dark. We go the other way: we take entire trays
                straight from growers in Limuru and Kiambu, pot them on in our own Nairobi
                greenhouse, and only send out the plants we would keep ourselves.
              </p>
              <p>
                It means stronger roots, honest prices, and a plant that looks like the
                photograph — because every one of them has been watered, turned and checked by
                hand before it is boxed.
              </p>
            </div>

            <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-cream/15 pt-6">
              {[
                ['12', 'grower partners'],
                ['Same day', 'potted & delivered'],
                ['4.9/5', 'from 2,300 reviews'],
                ['30 days', 'plant guarantee'],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-display text-2xl text-cream">{value}</p>
                  <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.18em] text-cream/50">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- promises ----------------------------- */}
      <section id="delivery" className="container-page py-20 md:py-24">
        <div className="mb-12 flex flex-col items-center text-center">
          <p className="eyebrow flex items-center gap-2.5">
            <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
            The SAMHIN promise
            <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
          </p>
          <h2 className="section-title mt-3.5">
            Plants, handled like <span className="accent">living things</span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((promise) => (
            <div
              key={promise.title}
              className="card-petal group rounded-tl-[2.25rem] rounded-br-[2.25rem] p-6 transition-shadow hover:shadow-[0_30px_50px_-40px_rgba(34,57,47,0.6)]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-clay-soft text-clay transition-colors group-hover:bg-clay group-hover:text-cream">
                <promise.icon size={19} />
              </span>
              <h3 className="mt-4 font-display text-lg text-ink">{promise.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{promise.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------- testimonials -------------------------- */}
      <section className="border-y border-sand/60 bg-parchment/60 py-20 md:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Kind words"
            title={
              <>
                What people <span className="accent">say</span>
              </>
            }
            description="Over 2,300 verified reviews from people who sent a plant with SAMHIN."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <figure
                key={testimonial.name}
                className="flex flex-col rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-[0.75rem] rounded-bl-[0.75rem] border border-sand/70 bg-white p-7"
              >
                <Quote size={22} className="text-clay/70" />
                <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-ink-soft">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-sand/70 pt-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-blush text-rose">
                    <Blossom size={19} strokeWidth={1.1} />
                  </span>
                  <span className="text-sm">
                    <span className="block font-medium text-ink">{testimonial.name}</span>
                    <span className="block text-xs text-ink-faint">{testimonial.city}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- cta -------------------------------- */}
      <section id="contact" className="container-page py-20 md:py-24">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-sand/70 bg-gradient-to-br from-blush/70 via-cream to-sage-soft/60">
          <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-25" />
          <Blossom
            size={280}
            strokeWidth={0.5}
            className="pointer-events-none absolute -right-16 -top-16 text-forest/[0.07]"
          />
          <div className="relative grid items-center gap-8 p-8 md:grid-cols-[1.25fr_auto] md:p-12">
            <div>
              <p className="eyebrow">Visit the studio</p>
              <h2 className="mt-3 font-display text-[clamp(1.7rem,3vw,2.4rem)] leading-[1.1] text-forest">
                Come see what is <span className="accent">in bloom</span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
                We're open seven days a week. Bring a pot and we'll plant it up while you wait, or
                order online and we'll deliver it upright to your door anywhere in Nairobi.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
                <span className="inline-flex items-center gap-2">
                  <MapPin size={15} className="text-clay" /> Riverside Drive, Westlands, Nairobi
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock size={15} className="text-clay" /> 8am – 6pm, seven days
                </span>
              </div>
            </div>
            <Link
              to="/shop"
              className="btn btn-primary btn-lg justify-self-start md:justify-self-end"
            >
              Shop the greenhouse <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
