import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { COLLECTIONS } from '../../lib/catalog.js';
import { ImageWithFallback, SectionHeading } from '../ui.jsx';

export function CategoryMosaic() {
  return (
    <section className="border-y border-sand/60 bg-parchment/60 py-20 md:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Curated collections"
          title={
            <>
              A little of <span className="accent">everything</span>
            </>
          }
          description="Big leaves, soft petals and easy-care greenery — grouped the way people actually shop."
          action={
            <Link to="/shop" className="btn btn-secondary btn-sm">
              Browse all <ArrowRight size={14} />
            </Link>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:auto-rows-[14rem] lg:grid-cols-4">
          {COLLECTIONS.map((collection, index) => {
            const isFirst = index === 0;
            const isLast = index === COLLECTIONS.length - 1;
            return (
              <Link
                key={collection.label}
                to={collection.to}
                className={`group relative overflow-hidden bg-sand/50 ring-1 ring-sand/70 transition-shadow duration-500 hover:shadow-[0_30px_50px_-35px_rgba(34,57,47,0.6)] ${
                  isFirst || isLast ? 'arch-soft' : 'rounded-[1.05rem]'
                } ${
                  isFirst
                    ? 'h-[20rem] sm:col-span-2 lg:col-span-1 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:h-auto'
                    : isLast
                      ? 'h-[20rem] sm:col-span-2 lg:col-span-1 lg:col-start-4 lg:row-span-2 lg:row-start-1 lg:h-auto'
                      : 'h-[13.5rem] lg:h-auto'
                }`}
              >
                <ImageWithFallback
                  src={collection.image}
                  alt={collection.label}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/70 via-forest/10 to-transparent transition-opacity duration-300 group-hover:opacity-95" />

                <span
                  className={`absolute bottom-4 left-4 right-4 inline-flex w-fit items-center gap-3 rounded-full bg-cream/95 py-2.5 pl-4 pr-3 font-display text-ink shadow-lg shadow-forest/10 backdrop-blur transition-colors group-hover:bg-forest group-hover:text-cream ${
                    isFirst || isLast ? 'text-[0.85rem]' : 'text-[0.78rem]'
                  }`}
                >
                  {collection.label}
                  <ArrowRight
                    size={14}
                    className="text-clay transition-all group-hover:translate-x-0.5 group-hover:text-cream"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
