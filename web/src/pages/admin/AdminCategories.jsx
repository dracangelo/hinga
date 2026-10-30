import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  FolderTree,
  Search,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { EmptyState, ImageWithFallback, Spinner } from '../../components/ui.jsx';
import { CategoryEditor } from '../../components/admin/CategoryEditor.jsx';
import { notifyCategoriesChanged } from '../../lib/useCategories.js';

export function AdminCategories() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState({ open: false, category: null });

  const load = useCallback(() => {
    setLoading(true);
    api
      .adminCategories({ includeInactive: 'true' })
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (params.get('new') !== '1') return;
    setEditor({ open: true, category: null });
    const next = new URLSearchParams(params);
    next.delete('new');
    setParams(next, { replace: true });
  }, [params, setParams]);

  const closeEditor = useCallback(() => {
    setEditor({ open: false, category: null });
  }, []);

  const openCreate = () => setEditor({ open: true, category: null });
  const openEdit = (category) => setEditor({ open: true, category });

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      `${category.name} ${category.slug} ${category.description}`
        .toLowerCase()
        .includes(term),
    );
  }, [categories, search]);

  const activeCount = categories.filter((category) => category.active).length;
  const productCount = categories.reduce(
    (sum, category) => sum + (category.productCount || 0),
    0,
  );
  const nextSortOrder =
    categories.reduce((max, category) => Math.max(max, category.sortOrder || 0), -1) + 1;

  const toggleActive = async (category) => {
    setBusy(category.id);
    try {
      await api.updateCategory(category.id, { active: !category.active });
      notifyCategoriesChanged();
      toast.success(
        category.active
          ? `${category.name} hidden from the storefront`
          : `${category.name} is now visible`,
      );
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (category) => {
    if (
      !window.confirm(
        `Delete the "${category.name}" category? This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusy(category.id);
    try {
      await api.deleteCategory(category.id);
      notifyCategoriesChanged();
      toast.success('Category deleted');
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Spinner label="Loading categories" />;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="eyebrow text-ink-faint">Categories</p>
          <p className="mt-1 font-display text-2xl text-ink">{categories.length}</p>
          <p className="text-xs text-ink-faint">In your storefront catalogue</p>
        </div>
        <div className="card p-4">
          <p className="eyebrow text-ink-faint">Visible</p>
          <p className="mt-1 font-display text-2xl text-forest">{activeCount}</p>
          <p className="text-xs text-ink-faint">Shown in menus and filters</p>
        </div>
        <div className="card p-4">
          <p className="eyebrow text-ink-faint">Products assigned</p>
          <p className="mt-1 font-display text-2xl text-ink">{productCount}</p>
          <p className="text-xs text-ink-faint">Across every category</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search categories…"
            className="field pl-9"
            aria-label="Search categories"
          />
        </div>
        <button type="button" onClick={openCreate} className="btn btn-primary btn-sm">
          <Plus size={14} /> New category
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="card p-6">
          <EmptyState
            icon={FolderTree}
            title={categories.length ? 'No categories match' : 'No categories yet'}
            description={
              categories.length
                ? 'Try a different search term.'
                : 'Create your first category to organise products and power the storefront menu.'
            }
            action={
              <button type="button" onClick={openCreate} className="btn btn-primary btn-sm mt-2">
                <Plus size={14} /> New category
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((category, index) => {
            const isBusy = busy === category.id;
            return (
              <article
                key={category.id}
                className={`card overflow-hidden transition-opacity ${
                  category.active ? '' : 'opacity-65'
                }`}
              >
                <div className="flex gap-4 p-4">
                  <ImageWithFallback
                    src={category.image}
                    alt={category.name}
                    seed={index}
                    className="h-24 w-[4.5rem] shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate font-display text-lg text-ink">
                          {category.name}
                        </h2>
                        <p className="truncate text-xs text-ink-faint">/{category.slug}</p>
                      </div>
                      <span
                        className={`badge shrink-0 ${
                          category.active
                            ? 'bg-sage-soft text-forest'
                            : 'bg-parchment text-ink-faint'
                        }`}
                      >
                        {category.active ? 'Visible' : 'Hidden'}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                      {category.description || 'No description yet.'}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-ink-faint">
                      <span>
                        {category.productCount} product
                        {category.productCount === 1 ? '' : 's'}
                      </span>
                      <span>
                        {category.links.length
                          ? `${category.links.length} menu links`
                          : 'Default menu link'}
                      </span>
                      <span>Order {category.sortOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-sand/70 bg-parchment/30 px-4 py-2.5">
                  <Link
                    to={`/shop?category=${category.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-forest transition-colors hover:text-leaf"
                  >
                    <ExternalLink size={12} /> View category
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      disabled={isBusy}
                      className="grid h-8 w-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-white hover:text-forest disabled:opacity-40"
                      aria-label={`Edit ${category.name}`}
                      title="Edit category"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(category)}
                      disabled={isBusy}
                      className="grid h-8 w-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-white hover:text-forest disabled:opacity-40"
                      aria-label={
                        category.active
                          ? `Hide ${category.name}`
                          : `Show ${category.name}`
                      }
                      title={category.active ? 'Hide category' : 'Show category'}
                    >
                      {category.active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(category)}
                      disabled={isBusy || category.productCount > 0}
                      className="grid h-8 w-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-rose-soft hover:text-rose disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-soft"
                      aria-label={`Delete ${category.name}`}
                      title={
                        category.productCount > 0
                          ? `Move or delete ${category.productCount} product${
                              category.productCount === 1 ? '' : 's'
                            } first`
                          : 'Delete category'
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <CategoryEditor
        open={editor.open}
        category={editor.category}
        defaultSortOrder={nextSortOrder}
        onClose={closeEditor}
        onSaved={load}
      />
    </div>
  );
}
