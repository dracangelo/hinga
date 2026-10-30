import { useEffect, useState } from 'react';
import { X, Save, Image as ImageIcon, Link2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { notifyCategoriesChanged } from '../../lib/useCategories.js';
import { ImageWithFallback } from '../ui.jsx';

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  image: '',
  links: '',
  sortOrder: 0,
  active: true,
};

const linksToText = (links) =>
  (Array.isArray(links) ? links : [])
    .map((link) => `${link.label} | ${link.to}`)
    .join('\n');

const textToLinks = (text) =>
  String(text || '')
    .split('\n')
    .map((line) => {
      const [label, ...rest] = line.split('|');
      return { label: label.trim(), to: rest.join('|').trim() };
    })
    .filter((link) => link.label);

export function CategoryEditor({ open, category, onClose, onSaved, defaultSortOrder = 0 }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      category
        ? {
            name: category.name || '',
            slug: category.slug || '',
            description: category.description || '',
            image: category.image || '',
            links: linksToText(category.links),
            sortOrder: category.sortOrder ?? 0,
            active: category.active !== false,
          }
        : { ...EMPTY, sortOrder: defaultSortOrder },
    );
  }, [open, category, defaultSortOrder]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Give the category a name.');
      return;
    }

    setSaving(true);
    setError('');
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description,
      image: form.image.trim(),
      links: textToLinks(form.links),
      sortOrder: Number(form.sortOrder) || 0,
      active: form.active,
    };

    try {
      const data = category
        ? await api.updateCategory(category.id, payload)
        : await api.createCategory(payload);
      notifyCategoriesChanged();
      toast.success(category ? 'Category updated' : 'Category created');
      onSaved?.(data.category);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />

      <div className="animate-rise relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-sand/70 px-5 py-4">
          <div>
            <p className="eyebrow text-leaf">Storefront categories</p>
            <h2 className="mt-1 font-display text-xl text-ink">
              {category ? 'Edit category' : 'New category'}
            </h2>
            <p className="mt-1 text-xs text-ink-faint">
              Categories power the menu, homepage directory and product filters.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-soft transition-colors hover:bg-parchment hover:text-ink"
            aria-label="Close category editor"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="category-name">
                  Name
                </label>
                <input
                  id="category-name"
                  className="field"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. Monstera"
                  autoFocus
                />
              </div>
              <div>
                <label className="label" htmlFor="category-slug">
                  URL slug (optional)
                </label>
                <input
                  id="category-slug"
                  className="field"
                  value={form.slug}
                  onChange={set('slug')}
                  placeholder="generated-from-name"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="category-description">
                Short description
              </label>
              <textarea
                id="category-description"
                rows={2}
                className="field resize-none"
                value={form.description}
                onChange={set('description')}
                placeholder="A line that sums up this collection…"
              />
            </div>

            <div>
              <label className="label" htmlFor="category-image">
                Image URL
              </label>
              <div className="relative">
                <ImageIcon
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  id="category-image"
                  className="field pl-9"
                  value={form.image}
                  onChange={set('image')}
                  placeholder="https://images.unsplash.com/…"
                />
              </div>
              {form.image && (
                <ImageWithFallback
                  key={form.image}
                  src={form.image}
                  alt="Category preview"
                  className="mt-3 h-32 w-full rounded-xl object-cover"
                />
              )}
            </div>

            <div>
              <label className="label" htmlFor="category-links">
                Menu links
              </label>
              <div className="relative">
                <Link2
                  size={15}
                  className="pointer-events-none absolute left-3 top-3 text-ink-faint"
                />
                <textarea
                  id="category-links"
                  rows={4}
                  className="field resize-y pl-9"
                  value={form.links}
                  onChange={set('links')}
                  placeholder={'Monstera | /shop?category=foliage-plants&q=monstera\nBest sellers | /shop?category=foliage-plants&sort=popular'}
                />
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">
                One link per line, formatted as <span className="font-medium">Label | /shop…</span>.
                Leave blank for a single “Shop all” link.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="category-order">
                  Sort order
                </label>
                <input
                  id="category-order"
                  type="number"
                  className="field"
                  value={form.sortOrder}
                  onChange={set('sortOrder')}
                />
                <p className="mt-1 text-xs text-ink-faint">Lower numbers appear first.</p>
              </div>
              <label className="flex items-center gap-2.5 self-start rounded-xl border border-sand/70 bg-parchment/40 px-3.5 py-3 text-sm text-ink-soft sm:mt-6">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={set('active')}
                  className="h-4 w-4 rounded border-sand accent-[#1f3d33]"
                />
                Show in storefront menus and filters
              </label>
            </div>

            {error && (
              <p className="rounded-xl border border-rose/30 bg-rose-soft/50 px-3 py-2 text-sm text-rose">
                {error}
              </p>
            )}
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-sand/70 bg-parchment/30 px-5 py-3">
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="btn btn-primary btn-sm"
          >
            <Save size={14} /> {saving ? 'Saving…' : category ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </div>
    </div>
  );
}
