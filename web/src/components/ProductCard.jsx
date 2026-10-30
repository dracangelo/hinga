import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ImageWithFallback, Stars } from './ui.jsx';
import { money } from '../lib/format.js';

export function ProductCard({ product, onQuickAdd }) {
  const { add } = useCart();
  const toast = useToast();

  const quickAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const size = product.sizes?.[0] || 'Standard';
    const color = product.colors?.[0] || '';
    try {
      await add(product, { qty: 1, size, color });
      toast.success(`${product.name} added to your cart`);
    } catch (error) {
      toast.error(error.message);
    }
    onQuickAdd?.(product);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group flex flex-col rounded-[1.75rem] border border-sand/70 bg-white p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-sage/60 hover:shadow-[0_30px_55px_-40px_rgba(34,57,47,0.65)]"
    >
      <div className="relative arch overflow-hidden bg-parchment">
        <ImageWithFallback
          src={product.image}
          alt={product.name}
          seed={product.id}
          className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
        />
        {product.discountPercent > 0 && (
          <span className="badge absolute bottom-3 left-3 bg-cream/95 text-clay shadow-sm">
            −{product.discountPercent}%
          </span>
        )}
        {!product.inStock && (
          <span className="badge absolute bottom-3 left-3 bg-ink/85 text-white">Sold out</span>
        )}
        {product.lowStock && product.inStock && (
          <span className="badge absolute bottom-3 left-3 bg-clay-soft/95 text-clay shadow-sm">
            Only {product.stock} left
          </span>
        )}
        {product.inStock && (
          <button
            type="button"
            onClick={quickAdd}
            className="absolute bottom-3 right-3 grid h-10 w-10 translate-y-2 place-items-center rounded-full bg-forest text-cream opacity-0 shadow-lg transition-all duration-300 hover:bg-forest-soft group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100"
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-2 pb-1.5 pt-4">
        <h3 className="font-display text-[1.0625rem] leading-snug text-ink transition-colors group-hover:text-forest">
          {product.name}
        </h3>
        {product.rating > 0 && (
          <Stars value={product.rating} size={12} showValue count={product.reviewCount} />
        )}
        <div className="mt-auto flex items-baseline gap-2 border-t border-sand/55 pt-3">
          <span className="font-display text-[1.05rem] text-forest">{money(product.price)}</span>
          {product.compareAt > 0 && (
            <span className="text-sm text-ink-faint line-through">{money(product.compareAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, loading, skeletonCount = 8 }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className="rounded-[1.75rem] border border-sand/60 bg-white p-2.5">
            <div className="shimmer arch aspect-[4/5] w-full" />
            <div className="space-y-2 px-2 pb-2 pt-4">
              <div className="shimmer h-4 w-2/3 rounded" />
              <div className="shimmer h-3 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
