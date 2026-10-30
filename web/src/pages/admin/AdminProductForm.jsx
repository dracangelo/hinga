import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Image as ImageIcon } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner } from '../../components/ui.jsx';
import { CategoryEditor } from '../../components/admin/CategoryEditor.jsx';

const OCCASIONS = [
  'anniversary',
  'birthday',
  'romance',
  'sympathy',
  'thank-you',
  'get-well',
  'friendship',
  'housewarming',
  'wedding',
];

const toList = (value) =>
  (Array.isArray(value) ? value : String(value || '').split(','))
    .map((item) => String(item).trim())
    .filter(Boolean);

export function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    story: '',
    category: 'flowering-plants',
    occasions: [],
    price: '',
    compareAt: '',
    stock: '0',
    image: '',
    gallery: [],
    colors: [],
    sizes: ['Standard'],
    featured: false,
    active: true,
  });

  useEffect(() => {
    if (!isEdit) return;
    api
      .adminProducts({ includeInactive: 'true' })
      .then((data) => {
        const product = (data.products || []).find((item) => String(item.id) === String(id));
        if (!product) return;
        setForm({
          name: product.name,
          slug: product.slug,
          description: product.description || '',
          story: product.story || '',
          category: product.category,
          occasions: product.occasions || [],
          price: String(product.price),
          compareAt: product.compareAt ? String(product.compareAt) : '',
          stock: String(product.stock),
          image: product.image || '',
          gallery: product.gallery || [],
          colors: product.colors || [],
          sizes: product.sizes?.length ? product.sizes : ['Standard'],
          featured: product.featured,
          active: product.active,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  useEffect(() => {
    let mounted = true;
    api
      .adminCategories({ includeInactive: 'true' })
      .then((data) => {
        if (mounted) setCategories(data.categories || []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setCategoriesLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!categories.length) return;
    setForm((current) => {
      if (categories.some((category) => category.slug === current.category)) return current;
      const fallback = categories.find((category) => category.active) || categories[0];
      return { ...current, category: fallback.slug };
    });
  }, [categories]);

  const handleCategorySaved = (category) => {
    if (!category) return;
    setCategories((current) =>
      [...current.filter((item) => item.id !== category.id), category].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
    );
    setForm((current) => ({ ...current, category: category.slug }));
  };

  const set = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const toggleInList = (key, value) => {
    setForm((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });
  };

  const addTag = (key, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setForm((current) => ({ ...current, [key]: [...current[key], trimmed] }));
  };

  const removeTag = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].filter((item) => item !== value),
    }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (!form.price || Number(form.price) < 0) next.price = 'Enter a valid price';
    if (form.stock === '' || Number(form.stock) < 0) next.stock = 'Enter a valid stock level';
    if (!form.image.trim()) next.image = 'An image URL is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || form.name,
      description: form.description,
      story: form.story,
      category: form.category,
      occasions: form.occasions,
      priceCents: Math.round(Number(form.price) * 100),
      compareAtCents: form.compareAt ? Math.round(Number(form.compareAt) * 100) : null,
      stock: Number(form.stock),
      image: form.image,
      gallery: form.gallery,
      colors: form.colors,
      sizes: form.sizes,
      featured: form.featured,
      active: form.active,
    };

    try {
      if (isEdit) {
        await api.updateProduct(id, payload);
        toast.success('Product updated');
      } else {
        await api.createProduct(payload);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner label="Loading product" />;

  return (
    <>
      <form onSubmit={submit} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-forest"
        >
          <ArrowLeft size={15} /> Back to products
        </Link>
        <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
          <Save size={14} /> {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <section className="card p-5">
            <h3 className="font-display text-lg text-ink">Basics</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="name">
                  Product name
                </label>
                <input id="name" className="field" value={form.name} onChange={set('name')} />
                {errors.name && <p className="mt-1 text-xs text-rose">{errors.name}</p>}
              </div>

              <div>
                <label className="label" htmlFor="slug">
                  URL slug (optional)
                </label>
                <input
                  id="slug"
                  className="field"
                  value={form.slug}
                  onChange={set('slug')}
                  placeholder="generated-from-name"
                />
              </div>

              <div>
                <label className="label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="field resize-none"
                  value={form.description}
                  onChange={set('description')}
                  placeholder="What is in it, how it looks, how long it lasts…"
                />
              </div>

              <div>
                <label className="label" htmlFor="story">
                  The story (shown as a highlighted note)
                </label>
                <textarea
                  id="story"
                  rows={2}
                  className="field resize-none"
                  value={form.story}
                  onChange={set('story')}
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="label" htmlFor="category">
                    Category
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryEditorOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-forest transition-colors hover:text-leaf"
                  >
                    <Plus size={12} /> New category
                  </button>
                </div>
                <select
                  id="category"
                  className="field"
                  value={form.category}
                  onChange={set('category')}
                  disabled={categoriesLoading || categories.length === 0}
                >
                  {categoriesLoading && <option value="">Loading categories…</option>}
                  {!categoriesLoading && categories.length === 0 && (
                    <option value="">No categories yet</option>
                  )}
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                      {category.active ? '' : ' (hidden)'}
                    </option>
                  ))}
                </select>
                {!categoriesLoading && categories.length === 0 && (
                  <p className="mt-1 text-xs text-rose">
                    Create a category before saving this product.
                  </p>
                )}
              </div>

              <div>
                <span className="label">Occasions</span>
                <div className="flex flex-wrap gap-2">
                  {OCCASIONS.map((occasion) => (
                    <button
                      key={occasion}
                      type="button"
                      onClick={() => toggleInList('occasions', occasion)}
                      className={`rounded-full border px-3 py-1.5 text-xs capitalize transition-colors ${
                        form.occasions.includes(occasion)
                          ? 'border-forest bg-forest text-white'
                          : 'border-sand text-ink-soft hover:border-sage'
                      }`}
                    >
                      {occasion.replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="font-display text-lg text-ink">Options</h3>
            <div className="mt-4 space-y-5">
              <TagInput
                label="Sizes"
                values={form.sizes}
                onAdd={(value) => addTag('sizes', value)}
                onRemove={(value) => removeTag('sizes', value)}
                placeholder="e.g. Large"
              />
              <TagInput
                label="Colours"
                values={form.colors}
                onAdd={(value) => addTag('colors', value)}
                onRemove={(value) => removeTag('colors', value)}
                placeholder="e.g. Blush"
              />
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <h3 className="font-display text-lg text-ink">Pricing & stock</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="price">
                  Price (KSh)
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  className="field"
                  value={form.price}
                  onChange={set('price')}
                />
                {errors.price && <p className="mt-1 text-xs text-rose">{errors.price}</p>}
              </div>
              <div>
                <label className="label" htmlFor="compareAt">
                  Compare-at price (optional)
                </label>
                <input
                  id="compareAt"
                  type="number"
                  min="0"
                  step="0.01"
                  className="field"
                  value={form.compareAt}
                  onChange={set('compareAt')}
                />
              </div>
              <div>
                <label className="label" htmlFor="stock">
                  Stock on hand
                </label>
                <input
                  id="stock"
                  type="number"
                  min="0"
                  className="field"
                  value={form.stock}
                  onChange={set('stock')}
                />
                {errors.stock && <p className="mt-1 text-xs text-rose">{errors.stock}</p>}
              </div>
              <label className="flex items-center gap-2.5 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={set('featured')}
                  className="h-4 w-4 rounded border-sand accent-[#1f3d33]"
                />
                Feature on the homepage
              </label>
              <label className="flex items-center gap-2.5 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={set('active')}
                  className="h-4 w-4 rounded border-sand accent-[#1f3d33]"
                />
                Visible in the shop
              </label>
            </div>
          </section>

          <section className="card p-5">
            <h3 className="flex items-center gap-2 font-display text-lg text-ink">
              <ImageIcon size={17} className="text-sage" /> Images
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label" htmlFor="image">
                  Main image URL
                </label>
                <input
                  id="image"
                  className="field"
                  value={form.image}
                  onChange={set('image')}
                  placeholder="https://images.unsplash.com/photo-…"
                />
                {errors.image && <p className="mt-1 text-xs text-rose">{errors.image}</p>}
                {form.image && (
                  <img
                    src={form.image}
                    alt=""
                    className="mt-3 h-32 w-full rounded-lg object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>

              <TagInput
                label="Gallery"
                values={form.gallery}
                onAdd={(value) => addTag('gallery', value)}
                onRemove={(value) => removeTag('gallery', value)}
                placeholder="Paste an image URL"
              />
            </div>
          </section>
        </div>
      </div>
      </form>

      <CategoryEditor
        open={categoryEditorOpen}
        category={null}
        defaultSortOrder={
          categories.reduce(
            (max, category) => Math.max(max, category.sortOrder || 0),
            -1,
          ) + 1
        }
        onClose={() => setCategoryEditorOpen(false)}
        onSaved={handleCategorySaved}
      />
    </>
  );
}

function TagInput({ label, values, onAdd, onRemove, placeholder }) {
  const [value, setValue] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (!value.trim()) return;
    onAdd(value);
    setValue('');
  };

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit(event);
            }
          }}
          placeholder={placeholder}
          className="field"
        />
        <button type="button" onClick={submit} className="btn btn-secondary btn-sm shrink-0">
          <Plus size={14} /> Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {values.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full bg-parchment px-2.5 py-1 text-xs text-ink-soft"
            >
              {item.length > 34 ? `${item.slice(0, 32)}…` : item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="text-ink-faint transition-colors hover:text-rose"
                aria-label={`Remove ${item}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
