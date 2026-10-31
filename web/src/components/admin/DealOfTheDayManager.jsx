import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Tag, Search, Check, X, ExternalLink, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ImageWithFallback, Spinner } from '../ui.jsx';
import { money } from '../../lib/format.js';

export function DealOfTheDayManager() {
  const toast = useToast();
  const [dealInfo, setDealInfo] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal / selector state
  const [open, setOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [saving, setSaving] = useState(false);

  const loadDeal = () => {
    setLoading(true);
    api
      .adminGetDeal()
      .then((res) => {
        setDealInfo(res?.deal || null);
        setProduct(res?.product || null);
        if (res?.deal?.productId) {
          setSelectedProductId(res.deal.productId);
        }
        if (res?.deal?.discountPercent) {
          setDiscountPercent(res.deal.discountPercent);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeal();
  }, []);

  const openPicker = () => {
    setOpen(true);
    if (allProducts.length === 0) {
      setProductsLoading(true);
      api
        .adminProducts({ limit: 150 })
        .then((res) => {
          setAllProducts(res.products || []);
          if (!selectedProductId && res.products?.length > 0) {
            setSelectedProductId(res.products[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setProductsLoading(false));
    }
  };

  const selectedProduct = useMemo(() => {
    return allProducts.find((p) => p.id === selectedProductId) || product;
  }, [allProducts, selectedProductId, product]);

  const previewPricing = useMemo(() => {
    if (!selectedProduct) return null;
    const basePrice = selectedProduct.price;
    const disc = Math.max(1, Math.min(95, Number(discountPercent) || 20));
    const dealPrice = Math.round(basePrice * (1 - disc / 100));
    const savings = basePrice - dealPrice;
    return { basePrice, dealPrice, savings, disc };
  }, [selectedProduct, discountPercent]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return allProducts;
    const q = search.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)),
    );
  }, [allProducts, search]);

  const handleSave = async () => {
    if (!selectedProductId) {
      toast.error('Please choose a product');
      return;
    }
    setSaving(true);
    try {
      const res = await api.adminSetDeal({
        productId: selectedProductId,
        discountPercent: Number(discountPercent) || 20,
      });
      toast.success(res.message || 'Deal of the Day updated successfully!');
      setDealInfo(res.deal);
      setProduct(res.product);
      setOpen(false);
    } catch (err) {
      toast.error(err.message || 'Could not update deal of the day');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6 flex items-center justify-center">
        <Spinner label="Loading Deal of the Day..." />
      </div>
    );
  }

  const effectiveDiscount = dealInfo?.discountPercent || 20;
  const originalPrice = product ? product.price : 0;
  const discountedPrice = product ? Math.round(originalPrice * (1 - effectiveDiscount / 100)) : 0;

  return (
    <section className="card overflow-hidden border-sand/70 bg-gradient-to-br from-cream via-parchment/60 to-mist/40 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand/50 px-5 py-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-cream">
            <Sparkles size={15} />
          </span>
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-clay">
              Merchandising Spotlight
            </p>
            <h2 className="font-display text-lg leading-snug text-forest">
              Homepage Deal of the Day
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={openPicker}
          className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-sm"
        >
          <Tag size={13} />
          Change Deal of the Day
        </button>
      </div>

      <div className="p-5 md:p-6">
        {product ? (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl border-2 border-sage/30 bg-cream shadow-sm sm:h-32 sm:w-32">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
              <span className="absolute -bottom-2 -right-2 rounded-full bg-forest px-2.5 py-0.5 text-[0.7rem] font-bold text-cream shadow">
                {effectiveDiscount}% OFF
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2.5 py-0.5 text-[0.65rem] font-medium text-forest">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage animate-pulse" />
                  Active on Homepage
                </span>
                <span className="text-xs capitalize text-ink-faint">
                  Category: {product.category?.replace(/-/g, ' ')}
                </span>
              </div>

              <h3 className="font-display text-xl text-forest">{product.name}</h3>

              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl font-semibold text-forest">
                  {money(discountedPrice)}
                </span>
                <span className="text-sm text-ink-faint line-through">
                  {money(originalPrice)}
                </span>
                <span className="text-xs font-medium text-clay">
                  Save {money(originalPrice - discountedPrice)}
                </span>
              </div>

              <p className="line-clamp-1 text-xs text-ink-soft">
                {product.description || 'Featured live as the special daily highlight plant with countdown clock.'}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <a
                href={`/product/${product.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:text-clay"
              >
                View on website <ExternalLink size={12} />
              </a>
              <button
                type="button"
                onClick={openPicker}
                className="btn btn-secondary btn-sm"
              >
                Select different plant
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Tag size={32} className="text-sage" />
            <h3 className="mt-2 font-display text-base text-forest">No plant selected yet</h3>
            <p className="mt-1 max-w-sm text-xs text-ink-soft">
              Choose any plant from your inventory to spotlight as the Deal of the Day on your homepage.
            </p>
            <button
              type="button"
              onClick={openPicker}
              className="btn btn-primary btn-sm mt-4"
            >
              Choose a Plant
            </button>
          </div>
        )}
      </div>

      {/* ------------------------- Picker Modal ------------------------- */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-cream shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-sand/60 px-6 py-4">
              <div>
                <h3 className="font-display text-lg text-forest">Select Deal of the Day</h3>
                <p className="text-xs text-ink-soft">
                  Pick a plant and discount percentage to showcase on the homepage.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-ink-faint hover:bg-sand/40 hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Search */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by plant name or category..."
                  className="field pl-9 text-sm"
                />
              </div>

              {/* Product selection list */}
              <div>
                <label className="label">Choose Plant ({filteredProducts.length})</label>
                {productsLoading ? (
                  <div className="py-12 flex justify-center">
                    <Spinner label="Loading catalogue..." />
                  </div>
                ) : (
                  <div className="grid max-h-60 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {filteredProducts.map((p) => {
                      const isSelected = p.id === selectedProductId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProductId(p.id)}
                          className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                            isSelected
                              ? 'border-forest bg-sage-soft/70 shadow-sm ring-2 ring-forest'
                              : 'border-sand/60 bg-cream/70 hover:border-sage hover:bg-sand/20'
                          }`}
                        >
                          <ImageWithFallback
                            src={p.image}
                            alt={p.name}
                            className="h-12 w-12 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-forest">
                              {p.name}
                            </p>
                            <p className="text-[0.65rem] capitalize text-ink-faint">
                              {p.category?.replace(/-/g, ' ')}
                            </p>
                            <p className="text-xs font-medium text-ink">
                              {money(p.price)}
                            </p>
                          </div>
                          {isSelected && (
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-forest text-cream shrink-0">
                              <Check size={13} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <p className="col-span-2 py-8 text-center text-xs text-ink-faint">
                        No plants found matching &ldquo;{search}&rdquo;.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Discount Percentage */}
              <div className="rounded-2xl border border-sand/70 bg-parchment/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="discountInput" className="label mb-0">
                    Discount Percentage
                  </label>
                  <span className="rounded-full bg-forest px-2.5 py-0.5 text-xs font-bold text-cream">
                    {discountPercent}% OFF
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    id="discountRange"
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="flex-1 accent-[#22392f]"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      id="discountInput"
                      type="number"
                      min="1"
                      max="95"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="field w-20 text-center text-sm font-semibold py-1.5"
                    />
                    <span className="text-sm font-bold text-ink-soft">%</span>
                  </div>
                </div>

                {previewPricing && (
                  <div className="mt-3 flex items-center justify-between border-t border-sand/60 pt-3 text-xs">
                    <span className="text-ink-soft">
                      Original: <span className="line-through">{money(previewPricing.basePrice)}</span>
                    </span>
                    <span className="font-semibold text-forest">
                      Deal Price: {money(previewPricing.dealPrice)}
                    </span>
                    <span className="font-medium text-clay">
                      Customer saves {money(previewPricing.savings)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-sand/60 px-6 py-4 bg-sand/10">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !selectedProductId}
                className="btn btn-primary btn-sm min-w-[140px] flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Spinner size={14} /> Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} /> Save as Deal of the Day
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
