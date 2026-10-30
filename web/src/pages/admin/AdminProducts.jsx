import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Pencil,
  Archive,
  RotateCcw,
  Flower2,
  Star,
  Eye,
  EyeOff,
  FolderTree,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { EmptyState, ImageWithFallback, Spinner } from '../../components/ui.jsx';
import { money, titleCase } from '../../lib/format.js';

export function AdminProducts() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const stock = params.get('stock') || '';
  const showInactive = params.get('inactive') !== 'false';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(q);
  const [busy, setBusy] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);

  useEffect(() => {
    api
      .adminCategories()
      .then((data) => setCategoryOptions(data.categories || []))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    api
      .adminProducts({ q, category, stock, includeInactive: showInactive ? 'true' : 'false' })
      .then((data) => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q, category, stock, showInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value) next.delete(key);
    else next.set(key, String(value));
    setParams(next, { replace: true });
  };

  const toggleActive = async (product) => {
    setBusy(product.id);
    try {
      await api.updateProduct(product.id, { active: !product.active });
      toast.success(product.active ? `${product.name} archived` : `${product.name} restored`);
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  };

  const toggleFeatured = async (product) => {
    setBusy(product.id);
    try {
      await api.updateProduct(product.id, { featured: !product.featured });
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  };

  const categories = categoryOptions.length
    ? categoryOptions.map((item) => ({
        value: item.slug,
        label: item.name,
        active: item.active,
      }))
    : [...new Set(products.map((product) => product.category))].map((slug) => ({
        value: slug,
        label: titleCase(slug),
        active: true,
      }));

  const categoryLabel = (slug) =>
    categoryOptions.find((item) => item.slug === slug)?.name || titleCase(slug);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            update('q', search.trim());
          }}
          className="relative min-w-[14rem] flex-1"
        >
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products…"
            className="field pl-9"
            aria-label="Search products"
          />
        </form>

        <select
          value={category}
          onChange={(event) => update('category', event.target.value)}
          className="field w-auto py-2 text-sm"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
              {item.active ? '' : ' (hidden)'}
            </option>
          ))}
        </select>

        <select
          value={stock}
          onChange={(event) => update('stock', event.target.value)}
          className="field w-auto py-2 text-sm"
          aria-label="Filter by stock"
        >
          <option value="">Any stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) => update('inactive', event.target.checked ? '' : 'false')}
            className="h-4 w-4 rounded border-sand accent-[#1f3d33]"
          />
          Show archived
        </label>

        <Link to="/admin/products/new" className="btn btn-primary btn-sm">
          <Plus size={14} /> New product
        </Link>
        <Link to="/admin/categories" className="btn btn-secondary btn-sm">
          <FolderTree size={14} /> Categories
        </Link>
      </div>

      <p className="text-sm text-ink-soft">
        {loading ? 'Loading…' : `${products.length} product${products.length === 1 ? '' : 's'}`}
      </p>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading products" />
        ) : products.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Flower2}
              title="No products found"
              description="Try a different search, or add a new plant to the catalogue."
              action={
                <Link to="/admin/products/new" className="btn btn-primary btn-sm mt-2">
                  <Plus size={14} /> New product
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand/70 bg-parchment/40 text-left text-xs uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Sold</th>
                  <th className="px-4 py-3 font-medium">Flags</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className={`border-b border-sand/40 transition-colors hover:bg-parchment/30 ${
                      product.active ? '' : 'opacity-55'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="h-11 w-10 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{product.name}</p>
                          <p className="text-xs text-ink-faint">/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{categoryLabel(product.category)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink">{money(product.price)}</span>
                      {product.compareAt > 0 && (
                        <span className="block text-xs text-ink-faint line-through">
                          {money(product.compareAt)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          product.stock === 0
                            ? 'bg-rose-soft text-rose'
                            : product.stock <= 5
                              ? 'bg-gold-soft text-gold'
                              : 'bg-sage-soft text-forest'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{product.soldCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {product.featured && (
                          <span className="badge bg-gold-soft text-gold">
                            <Star size={10} /> Featured
                          </span>
                        )}
                        {!product.active && (
                          <span className="badge bg-parchment text-ink-faint">Archived</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleFeatured(product)}
                          disabled={busy === product.id}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-sand text-ink-soft transition-colors hover:border-gold hover:text-gold"
                          title={product.featured ? 'Remove from featured' : 'Mark as featured'}
                        >
                          <Star size={14} />
                        </button>
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-sand text-ink-soft transition-colors hover:border-sage hover:text-forest"
                          title="Edit product"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleActive(product)}
                          disabled={busy === product.id}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-sand text-ink-soft transition-colors hover:border-rose hover:text-rose"
                          title={product.active ? 'Archive' : 'Restore'}
                        >
                          {product.active ? <Archive size={14} /> : <RotateCcw size={14} />}
                        </button>
                        {product.active ? (
                          <Eye size={14} className="text-ink-faint" aria-hidden />
                        ) : (
                          <EyeOff size={14} className="text-ink-faint" aria-hidden />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
