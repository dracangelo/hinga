import { useEffect, useState } from 'react';
import { Search, Users, Mail, Phone, MapPin } from 'lucide-react';
import { api } from '../../lib/api.js';
import { EmptyState, Spinner } from '../../components/ui.jsx';
import { formatDate, money } from '../../lib/format.js';

export function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .adminCustomers({ q: query })
      .then((data) => setCustomers(data.customers || []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email…"
          className="field pl-9"
          aria-label="Search customers"
        />
      </div>

      <p className="text-sm text-ink-soft">
        {loading ? 'Loading…' : `${customers.length} customer${customers.length === 1 ? '' : 's'}`}
      </p>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading customers" />
        ) : customers.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Try a different search term."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand/70 bg-parchment/40 text-left text-xs uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Orders</th>
                  <th className="px-4 py-3 font-medium">Lifetime spend</th>
                  <th className="px-4 py-3 font-medium">Last order</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-sand/40 transition-colors hover:bg-parchment/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush text-xs font-medium text-rose">
                          {customer.name.charAt(0)}
                        </span>
                        <div>
                          <p className="font-medium text-ink">{customer.name}</p>
                          {customer.city && (
                            <p className="flex items-center gap-1 text-xs text-ink-faint">
                              <MapPin size={11} /> {customer.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1.5 text-ink-soft">
                        <Mail size={12} className="text-ink-faint" /> {customer.email}
                      </p>
                      {customer.phone && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-faint">
                          <Phone size={12} /> {customer.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{customer.orderCount}</td>
                    <td className="px-4 py-3 font-medium text-ink">{money(customer.spend)}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{formatDate(customer.createdAt)}</td>
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
