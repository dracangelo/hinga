import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search as SearchIcon } from 'lucide-react';
import { api } from '../lib/api.js';
import { ProductGrid } from '../components/ProductCard.jsx';
import { EmptyState, SectionHeading } from '../components/ui.jsx';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Best selling' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
];

export function Shop() {
  const [params, setParams] = useSearchParams();
  const [facets, setFacets] = useState({ categories: [], occasions: [], priceRange: { min: 0, max: 200 } });
  const [data, setData] = useState({ products: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceInput, setPriceInput] = useState({ min: '', max: '' });

  const category = params.get('category') || '';
  const occasion = params.get('occasion') || '';
  const sort = params.get('sort') || 'featured';
  const q = params.get('q') || '';
  const page = Number(params.get('page') || 1);
  const min = params.get('min') || '';
  const max = params.get('max') || '';
  const inStock = params.get('inStock') === 'true';

  useEffect(() => {
    api.facets().then(setFacets).catch(() => {});
  }, []);

  useEffect(() => {
    setPriceInput({ min: params.get('min') || '', max: params.get('max') || '' });
  }, [params]);

  const load = useCallback(() => {
    setLoading(true);
    api
      .products({ category, occasion, sort, q, page, min, max, inStock: inStock ? 'true' : '' })
      .then(setData)
      .catch(() => setData({ products: [], total: 0, pages: 1 }))
      .finally(() => setLoading(false));
  }, [category, occasion, sort, q, page, min, max, inStock]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value === null || value === undefined) next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const toggle = (key, value) => {
    const next = new URLSearchParams(params);
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next, { replace: true });
  };

  const clearAll = () => {
    setParams(new URLSearchParams(), { replace: true });
    setPriceInput({ min: '', max: '' });
  };

  const activeCount =
    (category ? 1 : 0) +
    (occasion ? 1 : 0) +
    (min || max ? 1 : 0) +
    (inStock ? 1 : 0) +
    (q ? 1 : 0);

  const applyPrice = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (priceInput.min) next.set('min', priceInput.min);
    else next.delete('min');
    if (priceInput.max) next.set('max', priceInput.max);
    else next.delete('max');
    next.delete('page');
    setParams(next, { replace: true });
  };

  const title = useMemo(() => {
    if (q) return `Results for “${q}”`;
    if (occasion) return `For ${occasion.replace(/-/g, ' ')}`;
    if (category) return `${category.charAt(0).toUpperCase()}${category.slice(1)}`;
    return 'All plants & pots';
  }, [q, occasion, category]);

  const filterPanel = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Category</h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => update('category', '')}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              !category ? 'bg-forest text-white' : 'text-ink-soft hover:bg-parchment'
            }`}
          >
            Everything
          </button>
          {facets.categories.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => toggle('category', item.name)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                category === item.name
                  ? 'bg-forest text-white'
                  : 'text-ink-soft hover:bg-parchment'
              }`}
            >
              <span>{item.label || item.name}</span>
              <span className="text-xs opacity-60">{item.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Occasion</h3>
        <div className="flex flex-wrap gap-2">
          {facets.occasions.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => toggle('occasion', item.name)}
              className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
                occasion === item.name
                  ? 'border-forest bg-forest text-white'
                  : 'border-sand text-ink-soft hover:border-sage hover:bg-white'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Price</h3>
        <form onSubmit={applyPrice} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              value={priceInput.min}
              onChange={(event) => setPriceInput((v) => ({ ...v, min: event.target.value }))}
              placeholder={String(facets.priceRange.min)}
              className="field py-2"
              aria-label="Minimum price"
            />
            <span className="text-ink-faint">—</span>
            <input
              type="number"
              min="0"
              value={priceInput.max}
              onChange={(event) => setPriceInput((v) => ({ ...v, max: event.target.value }))}
              placeholder={String(facets.priceRange.max)}
              className="field py-2"
              aria-label="Maximum price"
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm w-full">
            Apply price
          </button>
        </form>
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(event) => update('inStock', event.target.checked ? 'true' : '')}
            className="h-4 w-4 rounded border-sand accent-[#1f3d33]"
          />
          In stock only
        </label>
      </div>

      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="btn btn-ghost btn-sm w-full">
          <X size={14} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div className="relative isolate overflow-hidden border-b border-sand/60 bg-parchment/60">
        <div aria-hidden="true" className="bg-fern pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-page relative py-10 md:py-14">
          <nav className="mb-5 flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-ink-faint">
            <Link to="/" className="transition-colors hover:text-clay">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-forest">The plant market</span>
          </nav>
          <SectionHeading
            eyebrow="Fresh from the studio"
            title={title}
            description={`${data.total} ${data.total === 1 ? 'item' : 'items'} available today`}
          />
        </div>
      </div>

      <div className="container-page grid gap-8 pb-16 pt-10 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-[1.25rem] border border-sand/70 bg-white p-5">
            {filterPanel}
          </div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="btn btn-secondary btn-sm lg:hidden"
            >
              <SlidersHorizontal size={14} /> Filters
              {activeCount > 0 && (
                <span className="ml-1 rounded-full bg-forest px-1.5 text-[0.65rem] text-white">
                  {activeCount}
                </span>
              )}
            </button>

            {q && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-parchment px-3 py-1.5 text-xs text-ink-soft">
                <SearchIcon size={12} /> {q}
                <button type="button" onClick={() => update('q', '')} aria-label="Clear search">
                  <X size={12} />
                </button>
              </span>
            )}

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="sort" className="text-xs uppercase tracking-wider text-ink-faint">
                Sort
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(event) => update('sort', event.target.value)}
                className="field w-auto py-2 text-sm"
              >
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {data.products.length === 0 && !loading ? (
            <EmptyState
              icon={SearchIcon}
              title="Nothing matches those filters"
              description="Try widening your price range or clearing a filter or two."
              action={
                <button type="button" onClick={clearAll} className="btn btn-primary btn-sm mt-2">
                  Clear filters
                </button>
              }
            />
          ) : (
            <ProductGrid products={data.products} loading={loading} skeletonCount={8} />
          )}

          {data.pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {Array.from({ length: data.pages }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => update('page', index + 1)}
                  className={`h-9 min-w-9 rounded-full px-3 text-sm transition-colors ${
                    page === index + 1
                      ? 'bg-forest text-cream'
                      : 'border border-sand bg-white/60 text-ink-soft hover:border-clay/50 hover:text-clay'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setFiltersOpen(false)}
            role="presentation"
          />
          <div className="animate-rise absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[1.5rem] bg-cream p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-parchment"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>
            {filterPanel}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="btn btn-primary mt-6 w-full"
            >
              Show {data.total} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
