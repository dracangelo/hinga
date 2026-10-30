import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Truck,
  RefreshCcw,
  Heart,
  ChevronRight,
  Check,
  Timer,
  Leaf,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ProductGrid } from '../components/ProductCard.jsx';
import { ImageWithFallback, QuantityStepper, SectionHeading, Spinner, Stars } from '../components/ui.jsx';
import { formatDate, money } from '../lib/format.js';

export function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);

  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' });
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .product(slug)
      .then((data) => {
        if (!active) return;
        setProduct(data.product);
        setRelated(data.related || []);
        setSize(data.product.sizes?.[0] || 'Standard');
        setColor(data.product.colors?.[0] || '');
        setActiveImage(0);
        api.reviews(data.product.id).then((r) => active && setReviews(r.reviews || []));
      })
      .catch(() => {
        if (active) setProduct(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const gallery = useMemo(() => {
    if (!product) return [];
    return product.gallery?.length ? product.gallery : [product.image];
  }, [product]);

  if (loading) return <Spinner label="Loading plant" />;

  if (!product) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl text-ink">We couldn't find that one</h1>
        <p className="mt-2 text-ink-soft">It may have been retired from the shop.</p>
        <Link to="/shop" className="btn btn-primary mt-6">
          Back to the shop
        </Link>
      </div>
    );
  }

  const addToCart = async () => {
    setBusy(true);
    try {
      await add(product, { qty, size, color });
      toast.success(`${product.name} added to your cart`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const buyNow = async () => {
    setBusy(true);
    try {
      await add(product, { qty, size, color });
      navigate('/cart');
    } catch (error) {
      toast.error(error.message);
      setBusy(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    setReviewError('');
    try {
      await api.addReview(product.id, reviewForm);
      setReviewForm({ rating: 5, title: '', body: '' });
      const fresh = await api.reviews(product.id);
      setReviews(fresh.reviews || []);
      const refreshed = await api.product(slug);
      setProduct(refreshed.product);
      toast.success('Thanks for the review');
    } catch (error) {
      setReviewError(error.message);
    }
  };

  return (
    <div className="container-page py-8 md:py-12">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-ink-faint">
        <Link to="/" className="hover:text-forest">
          Home
        </Link>
        <ChevronRight size={12} />
        <Link to="/shop" className="hover:text-forest">
          Shop
        </Link>
        <ChevronRight size={12} />
        <Link to={`/shop?category=${product.category}`} className="capitalize hover:text-forest">
          {product.category}
        </Link>
        <ChevronRight size={12} />
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* gallery */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="arch-soft overflow-hidden border border-sand/70 bg-white">
            <ImageWithFallback
              src={gallery[activeImage]}
              alt={product.name}
              seed={product.id}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-3">
              {gallery.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`arch-banner overflow-hidden border-2 transition ${
                    index === activeImage ? 'border-forest' : 'border-transparent opacity-70'
                  }`}
                >
                  <ImageWithFallback
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    seed={product.id + index}
                    className="h-20 w-20 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* details */}
        <div>
          <p className="eyebrow capitalize">{product.category}</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,2.9rem)] leading-[1.08] text-forest">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Stars value={product.rating} size={15} showValue count={product.reviewCount} />
            {product.soldCount > 0 && (
              <span className="text-xs text-ink-faint">· {product.soldCount} sold</span>
            )}
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-4xl text-ink">{money(product.price)}</span>
            {product.compareAt > 0 && (
              <>
                <span className="text-lg text-ink-faint line-through">{money(product.compareAt)}</span>
                <span className="badge bg-rose-soft text-rose">
                  Save {product.discountPercent}%
                </span>
              </>
            )}
          </div>

          <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-soft">
            {product.description}
          </p>

          {product.story && (
            <div className="mt-5 rounded-tl-[1.75rem] rounded-br-[1.75rem] rounded-tr-md rounded-bl-md border border-sage/35 bg-sage-soft/45 p-5">
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-forest">
                <Leaf size={15} className="mt-0.5 shrink-0 text-leaf" />
                {product.story}
              </p>
            </div>
          )}

          {/* options */}
          {product.sizes?.length > 1 && (
            <div className="mt-7">
              <h3 className="label">Size</h3>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      size === option
                        ? 'border-forest bg-forest text-white'
                        : 'border-sand text-ink-soft hover:border-sage'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div className="mt-6">
              <h3 className="label">Colour — {color}</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setColor(option)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      color === option
                        ? 'border-forest bg-forest text-white'
                        : 'border-sand text-ink-soft hover:border-sage'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
            <span className="text-sm text-ink-soft">
              {product.stock > 0 ? (
                product.lowStock ? (
                  <span className="text-clay">Only {product.stock} left today</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Check size={14} className="text-sage" /> In stock
                  </span>
                )
              ) : (
                <span className="text-rose">Currently out of stock</span>
              )}
            </span>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={addToCart}
              disabled={busy || !product.inStock}
              className="btn btn-primary btn-lg flex-1"
            >
              <Heart size={16} /> Add to cart
            </button>
            <button
              type="button"
              onClick={buyNow}
              disabled={busy || !product.inStock}
              className="btn btn-secondary btn-lg flex-1"
            >
              Buy now
            </button>
          </div>

          <ul className="mt-8 grid gap-3 border-t border-sand/70 pt-6 sm:grid-cols-2">
            {[
              { icon: Truck, text: 'Free delivery over KSh 7,500' },
              { icon: Timer, text: 'Nairobi same-day before 1pm' },
              { icon: RefreshCcw, text: 'Free replacement if unhappy' },
              { icon: Leaf, text: 'Recyclable, plastic-free wrap' },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-2.5 text-sm text-ink-soft">
                <item.icon size={15} className="text-sage" /> {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* reviews */}
      <section className="mt-16 border-t border-sand/70 pt-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <h2 className="font-display text-2xl text-ink">Reviews</h2>
            <div className="mt-3 flex items-center gap-4">
              <span className="font-display text-4xl text-ink">{product.rating.toFixed(1)}</span>
              <div>
                <Stars value={product.rating} size={16} />
                <p className="mt-1 text-xs text-ink-faint">
                  {product.reviewCount} verified reviews
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-5">
              {reviews.length === 0 ? (
                <p className="text-sm text-ink-soft">No reviews yet — be the first.</p>
              ) : (
                reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-xl border border-sand/70 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-blush text-xs font-medium text-rose">
                        {review.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{review.name}</p>
                        <p className="text-xs text-ink-faint">{formatDate(review.createdAt)}</p>
                      </div>
                      <span className="ml-auto">
                        <Stars value={review.rating} size={13} />
                      </span>
                    </div>
                    {review.title && (
                      <h3 className="mt-3 font-display text-[1.0625rem] text-ink">{review.title}</h3>
                    )}
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{review.body}</p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div>
            {user ? (
              <form onSubmit={submitReview} className="card p-5">
                <h3 className="font-display text-lg text-ink">Write a review</h3>
                <div className="mt-4">
                  <label className="label">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewForm((v) => ({ ...v, rating: value }))}
                        className="text-gold transition-transform hover:scale-110"
                        aria-label={`${value} stars`}
                      >
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.2 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <label className="label" htmlFor="review-title">
                    Title
                  </label>
                  <input
                    id="review-title"
                    className="field"
                    value={reviewForm.title}
                    onChange={(event) =>
                      setReviewForm((v) => ({ ...v, title: event.target.value }))
                    }
                    placeholder="Sum it up"
                  />
                </div>
                <div className="mt-4">
                  <label className="label" htmlFor="review-body">
                    Your review
                  </label>
                  <textarea
                    id="review-body"
                    rows={4}
                    required
                    className="field resize-none"
                    value={reviewForm.body}
                    onChange={(event) =>
                      setReviewForm((v) => ({ ...v, body: event.target.value }))
                    }
                    placeholder="How did it arrive?"
                  />
                </div>
                {reviewError && <p className="mt-3 text-sm text-rose">{reviewError}</p>}
                <button type="submit" className="btn btn-primary mt-4 w-full">
                  Post review
                </button>
              </form>
            ) : (
              <div className="card p-5 text-center">
                <p className="text-sm text-ink-soft">
                  Sign in to share your experience with this plant.
                </p>
                <Link to="/login" className="btn btn-secondary mt-4 w-full">
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading eyebrow="You might also like" title="Pairs well with" />
          <ProductGrid products={related} loading={false} />
        </section>
      )}
    </div>
  );
}
