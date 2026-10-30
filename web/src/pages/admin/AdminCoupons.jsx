import { useEffect, useState } from 'react';
import { Plus, Ticket, Trash2, Copy, Check } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { EmptyState, Spinner } from '../../components/ui.jsx';
import { money } from '../../lib/format.js';

export function AdminCoupons() {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [copied, setCopied] = useState(null);
  const [form, setForm] = useState({
    code: '',
    kind: 'percent',
    value: '',
    minSubtotal: '0',
    expiresAt: '',
  });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api
      .adminCoupons()
      .then((data) => setCoupons(data.coupons || []))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const create = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.createCoupon({
        code: form.code,
        kind: form.kind,
        value: Number(form.value),
        minSubtotal: Number(form.minSubtotal) || 0,
        expiresAt: form.expiresAt || null,
      });
      toast.success(`Coupon ${form.code.toUpperCase()} created`);
      setForm({ code: '', kind: 'percent', value: '', minSubtotal: '0', expiresAt: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggle = async (coupon) => {
    setBusy(coupon.code);
    try {
      await api.updateCoupon(coupon.code, { active: !coupon.active });
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    setBusy(coupon.code);
    try {
      await api.deleteCoupon(coupon.code);
      toast.success('Coupon deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast.success('Code copied');
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
      <div className="card overflow-hidden">
        {loading ? (
          <Spinner label="Loading coupons" />
        ) : coupons.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Ticket}
              title="No coupons yet"
              description="Create a promo code to run a campaign."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand/70 bg-parchment/40 text-left text-xs uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Discount</th>
                  <th className="px-4 py-3 font-medium">Minimum</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.code} className="border-b border-sand/40">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => copy(coupon.code)}
                        className="inline-flex items-center gap-1.5 font-mono font-medium text-forest hover:underline"
                      >
                        {coupon.code}
                        {copied === coupon.code ? (
                          <Check size={13} className="text-sage" />
                        ) : (
                          <Copy size={12} className="text-ink-faint" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {coupon.kind === 'percent' ? `${coupon.value}%` : money(coupon.value)} off
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {coupon.minSubtotal > 0 ? money(coupon.minSubtotal) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          coupon.active ? 'bg-sage-soft text-forest' : 'bg-parchment text-ink-faint'
                        }`}
                      >
                        {coupon.active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggle(coupon)}
                          disabled={busy === coupon.code}
                          className="btn btn-ghost btn-sm"
                        >
                          {coupon.active ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(coupon)}
                          disabled={busy === coupon.code}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-sand text-ink-soft transition-colors hover:border-rose hover:text-rose"
                          aria-label={`Delete ${coupon.code}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={create} className="card h-fit p-5">
        <h2 className="flex items-center gap-2 font-display text-lg text-ink">
          <Plus size={17} className="text-sage" /> New coupon
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="code">
              Code
            </label>
            <input
              id="code"
              className="field uppercase"
              value={form.code}
              onChange={(event) =>
                setForm((v) => ({ ...v, code: event.target.value.toUpperCase() }))
              }
              placeholder="SPRING20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="kind">
                Type
              </label>
              <select
                id="kind"
                className="field"
                value={form.kind}
                onChange={(event) => setForm((v) => ({ ...v, kind: event.target.value }))}
              >
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="value">
                Value
              </label>
              <input
                id="value"
                type="number"
                min="1"
                className="field"
                value={form.value}
                onChange={(event) => setForm((v) => ({ ...v, value: event.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="minSubtotal">
              Minimum order (KSh)
            </label>
            <input
              id="minSubtotal"
              type="number"
              min="0"
              className="field"
              value={form.minSubtotal}
              onChange={(event) => setForm((v) => ({ ...v, minSubtotal: event.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="expiresAt">
              Expires (optional)
            </label>
            <input
              id="expiresAt"
              type="date"
              className="field"
              value={form.expiresAt}
              onChange={(event) => setForm((v) => ({ ...v, expiresAt: event.target.value }))}
            />
          </div>
          {error && <p className="text-sm text-rose">{error}</p>}
          <button type="submit" className="btn btn-primary w-full">
            Create coupon
          </button>
        </div>
      </form>
    </div>
  );
}
