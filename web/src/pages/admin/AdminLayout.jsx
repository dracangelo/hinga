import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Flower2,
  FolderTree,
  Users,
  Ticket,
  Star,
  Sprout,
  SlidersHorizontal,
  ArrowLeft,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Blossom } from '../../components/ui.jsx';
import { ThemeToggle } from '../../components/ThemeToggle.jsx';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/products', label: 'Products', icon: Flower2 },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/landscaping', label: 'Landscaping', icon: Sprout },
  { to: '/admin/preferences', label: 'Preferences', icon: SlidersHorizontal },
];

export function AdminLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const current = LINKS.find((link) =>
    link.end ? location.pathname === link.to : location.pathname.startsWith(link.to),
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-cream">
          <Blossom size={19} strokeWidth={1.05} />
        </span>
        <div>
          <p className="font-display text-lg leading-none text-forest">Hinga</p>
          <p className="mt-0.5 text-[0.65rem] uppercase tracking-widest text-ink-faint">Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-forest font-medium text-white'
                  : 'text-ink-soft hover:bg-parchment hover:text-ink'
              }`
            }
          >
            <link.icon size={16} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sand/70 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-soft transition-colors hover:bg-parchment hover:text-ink"
        >
          <ArrowLeft size={16} /> View storefront
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-parchment/70 px-3.5 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-forest text-xs font-medium text-white">
            {user?.name?.charAt(0) || 'A'}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">{user?.name}</span>
            <span className="block truncate text-xs text-ink-faint">{user?.email}</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-parchment/40 md:grid md:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-sand/70 bg-cream md:sticky md:top-20 md:block md:h-[calc(100vh-5rem)]">
        {sidebar}
      </aside>

      <div className="min-w-0">
        <header className="sticky top-16 z-40 flex items-center gap-3 border-b border-sand/70 bg-cream/90 px-4 py-3 backdrop-blur md:top-20 md:px-8 md:py-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-parchment md:hidden"
            aria-label="Open admin menu"
          >
            <Menu size={19} />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl text-ink md:text-2xl">
              {current?.label || 'Admin'}
            </h1>
            <p className="truncate text-xs text-ink-faint">
              Hinga plant studio · order management
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle className="h-9 w-9" size={17} />
            <Link
              to="/shop"
              className="hidden items-center gap-1.5 rounded-full border border-sand bg-white px-3.5 py-2 text-xs text-ink-soft transition-colors hover:border-sage hover:text-forest sm:inline-flex"
            >
              <ExternalLink size={13} /> Storefront
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            role="presentation"
          />
          <div className="animate-rise absolute inset-y-0 left-0 w-64 bg-cream shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-parchment"
              aria-label="Close menu"
            >
              <X size={17} />
            </button>
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
