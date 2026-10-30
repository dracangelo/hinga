import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

const GUEST_KEY = 'hinga.cart';
const COUPON_KEY = 'hinga.coupon';

const readGuestCart = () => {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items) => {
  localStorage.setItem(
    GUEST_KEY,
    JSON.stringify(
      items.map((item) => ({
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        image: item.image,
        priceCents: item.priceCents,
        qty: item.qty,
        size: item.size,
        color: item.color,
      })),
    ),
  );
};

const normalizeGuest = (items) =>
  items.map((item, index) => ({
    id: `guest-${index}`,
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    image: item.image,
    price: item.priceCents / 100,
    priceCents: item.priceCents,
    qty: item.qty,
    size: item.size,
    color: item.color,
    lineTotal: (item.priceCents * item.qty) / 100,
    stock: 99,
    available: true,
  }));

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [coupon, setCoupon] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(COUPON_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const mergedFor = useRef(null);

  const persistCoupon = useCallback((value) => {
    setCoupon(value);
    if (value) localStorage.setItem(COUPON_KEY, JSON.stringify(value));
    else localStorage.removeItem(COUPON_KEY);
  }, []);

  const load = useCallback(async () => {
    if (!user) {
      setItems(normalizeGuest(readGuestCart()));
      setLoading(false);
      return;
    }
    try {
      const cart = await api.cart();
      setItems(cart.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  /* On sign-in, fold anything the guest collected into their account cart. */
  useEffect(() => {
    if (!user) {
      mergedFor.current = null;
      return;
    }
    if (mergedFor.current === user.id) return;
    mergedFor.current = user.id;

    const guestItems = readGuestCart();
    if (!guestItems.length) return;

    api
      .mergeCart(
        guestItems.map((item) => ({
          productId: item.productId,
          qty: item.qty,
          size: item.size,
          color: item.color,
        })),
      )
      .then((cart) => {
        localStorage.removeItem(GUEST_KEY);
        setItems(cart.items || []);
      })
      .catch(() => {});
  }, [user]);

  const add = useCallback(
    async (product, { qty = 1, size = 'Standard', color = '' } = {}) => {
      if (user) {
        const cart = await api.addToCart({
          productId: product.id,
          qty,
          size,
          color,
        });
        setItems(cart.items || []);
        return cart;
      }

      const guest = readGuestCart();
      const existing = guest.find(
        (item) =>
          item.productId === product.id && item.size === size && item.color === color,
      );
      if (existing) existing.qty += qty;
      else {
        guest.unshift({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          priceCents: product.priceCents,
          qty,
          size,
          color,
        });
      }
      writeGuestCart(guest);
      setItems(normalizeGuest(guest));
      return { items: normalizeGuest(guest) };
    },
    [user],
  );

  const update = useCallback(
    async (id, qty) => {
      if (user) {
        const cart = await api.updateCartItem(id, { qty });
        setItems(cart.items || []);
        return;
      }
      const guest = readGuestCart();
      const index = guest.findIndex((_, i) => `guest-${i}` === id);
      if (index >= 0) guest[index].qty = qty;
      writeGuestCart(guest);
      setItems(normalizeGuest(guest));
    },
    [user],
  );

  const remove = useCallback(
    async (id) => {
      if (user) {
        const cart = await api.removeCartItem(id);
        setItems(cart.items || []);
        return;
      }
      const guest = readGuestCart();
      const index = guest.findIndex((_, i) => `guest-${i}` === id);
      if (index >= 0) guest.splice(index, 1);
      writeGuestCart(guest);
      setItems(normalizeGuest(guest));
    },
    [user],
  );

  const clear = useCallback(async () => {
    if (user) {
      const cart = await api.clearCart();
      setItems(cart.items || []);
      return;
    }
    localStorage.removeItem(GUEST_KEY);
    setItems([]);
  }, [user]);

  const applyCoupon = useCallback(
    async (code) => {
      const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
      const { coupon: validated, label } = await api.validateCoupon({
        code,
        subtotalCents,
      });
      persistCoupon({ ...validated, label });
      return label;
    },
    [items, persistCoupon],
  );

  const removeCoupon = useCallback(() => persistCoupon(null), [persistCoupon]);

  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
  const subtotal = subtotalCents / 100;

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      subtotalCents,
      coupon,
      loading,
      add,
      update,
      remove,
      clear,
      applyCoupon,
      removeCoupon,
      refresh: load,
    }),
    [
      items,
      count,
      subtotal,
      subtotalCents,
      coupon,
      loading,
      add,
      update,
      remove,
      clear,
      applyCoupon,
      removeCoupon,
      load,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
