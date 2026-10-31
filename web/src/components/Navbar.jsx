import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Search,
  ChevronDown,
  Package,
  Heart,
  Leaf,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { OCCASIONS, SHOP_LINKS } from '../lib/catalog.js';
import { useCategories } from '../lib/useCategories.js';
import { Blossom, ImageWithFallback } from './ui.jsx';

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', menu: 'shop' },
  { label: 'All Categories', menu: 'categories' },
  { label: 'Occasions', menu: 'occasions' },
  { label: 'Landscaping', to: '/landscaping' },
  { label: 'In bloom', to: '/shop?category=flowering-plants' },
  { label: 'Pots & care', to: '/shop?category=pots-care' },
];

const categoryLinks = (category) =>
  category.links?.length
    ? category.links
    : [{ label: `Shop all ${category.name}`, to: `/shop?category=${category.slug}` }];

function DropdownLink({ to, label, meta }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
    >
      <span>{label}</span>
      {meta && <span className="text-[0.7rem] text-ink-faint">{meta}</span>}
    </Link>
  );
}

function NavLinkItem({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`group relative flex items-center px-3.5 py-2 text-[0.9rem] font-medium transition-colors ${
        active ? 'text-forest' : 'text-ink-soft hover:text-forest'
      }`}
    >
      {label}
      <span
        className={`absolute bottom-0 left-1/2 h-px -translate-x-1/2 bg-leaf transition-all duration-300 ${
          active ? 'w-5' : 'w-0 group-hover:w-5'
        }`}
      />
    </Link>
  );
}

function DesktopDropdown({ label, open, onToggle, children, active = false }) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="true"
        className={`group relative flex items-center gap-1.5 px-3.5 py-2 text-[0.9rem] font-medium transition-colors ${
          open || active ? 'text-forest' : 'text-ink-soft hover:text-forest'
        }`}
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
        <span
          className={`absolute bottom-0 left-1/2 h-px -translate-x-1/2 bg-leaf transition-all duration-300 ${
            open || active ? 'w-5' : 'w-0 group-hover:w-5'
          }`}
        />
      </button>

      {open && (
        <div className="animate-fade absolute left-1/2 top-full z-50 mt-4 w-64 -translate-x-1/2 rounded-[1.15rem] border border-sand/70 bg-cream p-2 shadow-[0_24px_50px_-30px_rgba(36,31,26,0.5)]">
          {children}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const categories = useCategories();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const accountRef = useRef(null);
  const navRef = useRef(null);
  const megaRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    setOpenMenu(null);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    function onClick(event) {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
      const inNav = navRef.current?.contains(event.target);
      const inMega = megaRef.current?.contains(event.target);
      if (!inNav && !inMega) setOpenMenu(null);
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpenMenu(null);
        setAccountOpen(false);
        setMobileOpen(false);
        setSearchOpen(false);
      }
    }
    function onScroll() {
      setScrolled(window.scrollY > 8);
      setOpenMenu(null);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/shop?q=${encodeURIComponent(value)}` : '/shop');
    setQuery('');
    setSearchOpen(false);
    setMobileOpen(false);
  };

  const toggleMenu = (menu) => {
    setOpenMenu((current) => (current === menu ? null : menu));
    setSearchOpen(false);
  };

  const isActive = (to) => {
    const [path, search = ''] = to.split('?');
    if (path === '/') return location.pathname === '/' && !location.search;
    if (path !== location.pathname) return false;
    if (!search) return true;
    return location.search === `?${search}`;
  };

  const shopActive = location.pathname === '/shop';
  const categoriesActive =
    location.pathname === '/shop' && new URLSearchParams(location.search).has('category');
  const occasionsActive =
    location.pathname === '/shop' && new URLSearchParams(location.search).has('occasion');

  return (
    <header
      className={`sticky top-0 z-50 border-b border-sand/70 bg-cream/92 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_18px_34px_-30px_rgba(36,31,26,0.8)]' : ''
      }`}
    >
      <div className="hidden bg-forest text-cream/75 md:block">
        <div className="container-page flex h-9 items-center justify-between text-[0.6rem] font-medium uppercase tracking-[0.2em]">
          <p className="inline-flex items-center gap-2">
            <Blossom size={10} className="text-sage/80" strokeWidth={0.9} />
            Potted by hand, delivered rooted
          </p>
          <p className="text-blush/90">Free delivery over KSh 7,500</p>
          <p>Nairobi studio · 8am – 6pm</p>
        </div>
      </div>

      <div className="container-page">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 md:h-[5.25rem]">
          <Link to="/" className="group flex shrink-0 items-center gap-3 justify-self-start">
            <img
              src="/logo.png"
              alt="SAMHIN logo"
              className="h-11 w-11 rounded-full object-cover ring-1 ring-forest/20 ring-offset-2 ring-offset-cream transition-transform duration-500 group-hover:scale-105"
            />
            <span className="leading-none">
              <span className="block font-display text-[1.6rem] font-medium leading-none tracking-tight text-forest">
                SAMHIN
              </span>
              <span className="mt-1 hidden text-[0.5rem] font-medium uppercase tracking-[0.3em] text-clay/80 sm:block">
                Your Nairobi Plant Haven
              </span>
            </span>
          </Link>

          <nav
            ref={navRef}
            className="hidden items-center justify-center gap-0.5 lg:flex"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => {
              if (!item.menu) {
                return (
                  <NavLinkItem
                    key={item.label}
                    to={item.to}
                    label={item.label}
                    active={isActive(item.to)}
                  />
                );
              }

              if (item.menu === 'shop') {
                return (
                  <DesktopDropdown
                    key={item.label}
                    label={item.label}
                    active={shopActive}
                    open={openMenu === 'shop'}
                    onToggle={() => toggleMenu('shop')}
                  >
                    {SHOP_LINKS.map((link) => (
                      <DropdownLink key={link.to} {...link} />
                    ))}
                  </DesktopDropdown>
                );
              }

              if (item.menu === 'categories') {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toggleMenu('categories')}
                    aria-expanded={openMenu === 'categories'}
                    aria-haspopup="true"
                    aria-controls="category-mega-menu"
                    className={`group relative flex items-center gap-1.5 px-3.5 py-2 text-[0.9rem] font-medium transition-colors ${
                      openMenu === 'categories' || categoriesActive
                        ? 'text-forest'
                        : 'text-ink-soft hover:text-forest'
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        openMenu === 'categories' ? 'rotate-180' : ''
                      }`}
                    />
                    <span
                      className={`absolute bottom-0 left-1/2 h-px -translate-x-1/2 bg-leaf transition-all duration-300 ${
                        openMenu === 'categories' || categoriesActive
                          ? 'w-5'
                          : 'w-0 group-hover:w-5'
                      }`}
                    />
                  </button>
                );
              }

              return (
                <DesktopDropdown
                  key={item.label}
                  label={item.label}
                  active={occasionsActive}
                  open={openMenu === 'occasions'}
                  onToggle={() => toggleMenu('occasions')}
                >
                  <div className="grid grid-cols-2 gap-0.5">
                    {OCCASIONS.map((occasion) => (
                      <DropdownLink key={occasion.to} {...occasion} />
                    ))}
                  </div>
                </DesktopDropdown>
              );
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-1">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => {
                setSearchOpen((value) => !value);
                setMobileOpen(false);
                setOpenMenu(null);
              }}
              className="grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
              aria-label="Search products"
              aria-expanded={searchOpen}
            >
              <Search size={19} />
            </button>

            <Link
              to="/cart"
              className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingBag size={19} />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-rose px-1 text-[0.65rem] font-semibold text-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>

            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
                aria-label="Account menu"
                aria-expanded={accountOpen}
              >
                <User size={19} />
              </button>
              {accountOpen && (
                <div className="animate-fade absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-sand bg-white py-1 shadow-xl shadow-black/5">
                  {user ? (
                    <>
                      <div className="border-b border-sand/70 px-4 py-3">
                        <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                        <p className="truncate text-xs text-ink-faint">{user.email}</p>
                      </div>
                      <Link
                        to="/account"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
                      >
                        <Package size={15} /> My orders
                      </Link>
                      <Link
                        to="/account"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
                      >
                        <Heart size={15} /> Profile
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
                        >
                          <LayoutDashboard size={15} /> Admin panel
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          navigate('/');
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-rose"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
                      >
                        Create an account
                      </Link>
                      <div className="my-1 border-t border-sand/70" />
                      <Link
                        to="/admin/login"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
                      >
                        <LayoutDashboard size={15} /> Admin sign in
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileOpen((value) => !value);
                setSearchOpen(false);
                setOpenMenu(null);
              }}
              className="grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-parchment hover:text-forest lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Full-width category mega-menu */}
      {openMenu === 'categories' && (
        <div
          ref={megaRef}
          id="category-mega-menu"
          className="animate-fade absolute inset-x-0 top-full hidden max-h-[calc(100vh-7.5rem)] overflow-y-auto border-t border-sand/60 bg-cream shadow-[0_30px_60px_-40px_rgba(36,31,26,0.55)] lg:block"
        >
          <div className="container-page py-8">
            <div className="mb-7 flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Browse by category</p>
                <h2 className="mt-1.5 font-display text-[1.7rem] leading-tight text-ink">
                  Everything in the <span className="accent">greenhouse</span>
                </h2>
              </div>
              <Link
                to="/shop"
                className="group inline-flex items-center gap-2 text-sm font-medium text-forest transition-colors hover:text-leaf"
              >
                Shop all plants
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {categories.map((category) => (
                <div key={category.slug} className="group">
                  <Link
                    to={`/shop?category=${category.slug}`}
                    className="block overflow-hidden arch-soft bg-parchment ring-1 ring-sand/60"
                  >
                    <ImageWithFallback
                      src={category.image}
                      alt={category.name}
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>
                  <Link
                    to={`/shop?category=${category.slug}`}
                    className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink transition-colors group-hover:text-leaf"
                  >
                    <Leaf size={15} strokeWidth={1.6} className="shrink-0 text-leaf" />
                    {category.name}
                  </Link>
                  <ul className="mt-2 space-y-1.5">
                    {categoryLinks(category)
                      .slice(0, 3)
                      .map((link) => (
                        <li key={`${link.label}-${link.to}`}>
                          <Link
                            to={link.to}
                            className="text-[0.75rem] text-ink-soft transition-colors hover:text-leaf"
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-center justify-between gap-4 border-t border-sand/60 pt-4">
              <p className="text-xs text-ink-faint">
                Nairobi same-day delivery · Free over KSh 7,500 · 30-day plant promise
              </p>
              <Link
                to="/shop?sort=newest"
                className="text-xs font-medium text-forest transition-colors hover:text-leaf"
              >
                See what&apos;s new →
              </Link>
            </div>
          </div>
        </div>
      )}

      {searchOpen && (
        <div className="border-t border-sand/60 bg-cream">
          <div className="container-page py-3">
            <form onSubmit={submitSearch} className="mx-auto flex max-w-xl items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search monstera, orchids, pots…"
                  className="field py-2.5 pl-9"
                  aria-label="Search products"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="animate-fade border-t border-sand/60 bg-cream lg:hidden">
          <div className="container-page max-h-[calc(100vh-4rem)] space-y-6 overflow-y-auto py-5">
            <form onSubmit={submitSearch}>
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products…"
                  className="field py-2 pl-9"
                  aria-label="Search products"
                />
              </div>
            </form>

            <div className="grid grid-cols-3 gap-2">
              {NAV_ITEMS.filter((item) => item.to).map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="rounded-xl border border-sand/70 bg-white/70 px-3 py-3 text-center text-sm font-medium text-ink transition-colors hover:border-sage/60 hover:bg-parchment hover:text-forest"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div>
              <p className="eyebrow px-3 pb-2 pt-1">Shop</p>
              <div className="grid grid-cols-2 gap-1">
                {SHOP_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow flex items-center gap-1.5 px-3 pb-2">
                <Leaf size={12} /> All categories
              </p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    to={`/shop?category=${category.slug}`}
                    className="group flex items-center gap-2.5 rounded-xl border border-sand/60 bg-white/70 p-2 transition-colors hover:border-sage/60 hover:bg-parchment"
                  >
                    <div className="block h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-parchment">
                      <ImageWithFallback
                        src={category.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <span className="text-sm font-medium text-ink transition-colors group-hover:text-forest">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow px-3 pb-2">Occasions</p>
              <div className="grid grid-cols-2 gap-1">
                {OCCASIONS.map((occasion) => (
                  <Link
                    key={occasion.to}
                    to={occasion.to}
                    className="rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-forest"
                  >
                    {occasion.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
