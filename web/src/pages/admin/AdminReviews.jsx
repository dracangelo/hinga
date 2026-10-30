import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { EmptyState, Spinner, Stars } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';

export function AdminReviews() {
  const toast = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .adminReviews()
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (review) => {
    if (!window.confirm('Delete this review?')) return;
    setBusy(review.id);
    try {
      await api.deleteReview(review.id);
      toast.success('Review deleted');
      load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-soft">
        {loading ? 'Loading…' : `${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
      </p>

      {loading ? (
        <Spinner label="Loading reviews" />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Customer reviews will appear here for moderation."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review) => (
            <article key={review.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{review.name}</p>
                  <p className="text-xs text-ink-faint">
                    {review.productName ? `on ${review.productName}` : 'Product removed'} ·{' '}
                    {formatDate(review.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(review)}
                  disabled={busy === review.id}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sand text-ink-soft transition-colors hover:border-rose hover:text-rose"
                  aria-label="Delete review"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-3">
                <Stars value={review.rating} size={13} />
              </div>

              {review.title && (
                <h3 className="mt-3 font-display text-[1.0625rem] text-ink">{review.title}</h3>
              )}
              <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">{review.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
