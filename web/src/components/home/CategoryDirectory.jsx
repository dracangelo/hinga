import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCategories } from '../../lib/useCategories.js';
import { Blossom, ImageWithFallback } from '../ui.jsx';

const categoryLinks = (category) =>
  category.links?.length
    ? category.links
    : [{ label: `Shop all ${category.name}`, to: `/shop?category=${category.slug}` }];

export function CategoryDirectory() {
  const categories = useCategories();

  return (
    <section className="bg-cream py-20 md:py-24">
      <div className="container-page">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow mb-3.5 flex items-center gap-2.5">
              <span aria-hidden="true" className="h-px w-7 bg-clay/45" />
              Browse the greenhouse
              <Blossom size={11} className="text-clay/60" strokeWidth={0.9} />
            </p>
            <h2 className="section-title">
              Shop by <span className="accent">category</span>
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
              Every way into the greenhouse, whether you are celebrating, comforting or just
              greening up a corner.
            </p>
          </div>
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 pb-1 text-sm font-medium text-forest transition-colors hover:text-clay"
          >
            Shop all plants
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 md:gap-x-7 xl:grid-cols-6">
          {categories.map((category) => (
            <div key={category.slug} className="group">
              <Link
                to={`/shop?category=${category.slug}`}
                className="relative block arch-soft overflow-hidden bg-parchment ring-1 ring-sand/70"
                aria-label={`Shop ${category.name}`}
              >
                <ImageWithFallback
                  src={category.image}
                  alt={category.name}
                  className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-forest/25 via-transparent to-forest/10 opacity-60 transition-opacity duration-500 group-hover:opacity-80" />
              </Link>

              <div className="mt-4 flex items-baseline justify-between gap-2 border-b border-sand/70 pb-2.5">
                <h3 className="font-display text-[1.1rem] leading-tight text-ink transition-colors group-hover:text-forest">
                  {category.name}
                </h3>
                <ArrowRight
                  size={14}
                  className="shrink-0 -translate-x-1 text-clay opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                />
              </div>

              <ul className="mt-3 space-y-2">
                {categoryLinks(category)
                  .slice(0, 4)
                  .map((link) => (
                    <li key={`${link.label}-${link.to}`}>
                      <Link
                        to={link.to}
                        className="inline-block text-[0.8125rem] leading-snug text-ink-soft transition-all hover:translate-x-0.5 hover:text-clay"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
