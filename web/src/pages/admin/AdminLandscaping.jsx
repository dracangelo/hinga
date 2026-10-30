import { useEffect, useState } from 'react';
import { Clock, Flower2, Mail, MapPin, Phone, Send, Sprout, Trash2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { EmptyState, Spinner } from '../../components/ui.jsx';
import { formatDate } from '../../lib/format.js';
import {
  BUDGETS,
  REQUEST_STATUSES,
  REQUEST_STATUS_META,
  SITE_TYPES,
  TIMELINES,
  labelFor,
} from '../../lib/landscaping.js';

export function AdminLandscaping() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [replying, setReplying] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .adminLandscapingRequests()
      .then((data) => {
        setRequests(data.requests || []);
        setCounts(data.counts || {});
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateStatus = async (request, status) => {
    setBusy(request.id);
    try {
      const { request: updated } = await api.updateLandscapingRequest(request.id, { status });
      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setCounts((current) => {
        const next = { ...current, [request.status]: Math.max(0, (current[request.status] || 1) - 1) };
        next[status] = (next[status] || 0) + 1;
        return next;
      });
      toast.success(`${request.reference} marked ${REQUEST_STATUS_META[status].label.toLowerCase()}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  };

  const sendReply = async (event, request) => {
    event.preventDefault();
    const body = (drafts[request.id] || '').trim();
    if (!body) return;
    setReplying(request.id);
    try {
      const { request: updated } = await api.addLandscapingMessage(request.id, body);
      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (updated.status !== request.status) {
        setCounts((current) => {
          const next = {
            ...current,
            [request.status]: Math.max(0, (current[request.status] || 1) - 1),
          };
          next[updated.status] = (next[updated.status] || 0) + 1;
          return next;
        });
      }
      setDrafts((current) => ({ ...current, [request.id]: '' }));
      toast.success(
        updated.status !== request.status
          ? `Reply sent · ${request.reference} moved to ${REQUEST_STATUS_META[updated.status].label}`
          : `Reply sent to ${request.name.split(' ')[0]}`,
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setReplying(null);
    }
  };

  const remove = async (request) => {
    if (!window.confirm(`Delete ${request.reference} from ${request.name}?`)) return;
    setBusy(request.id);
    try {
      await api.deleteLandscapingRequest(request.id);
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setCounts((current) => ({
        ...current,
        [request.status]: Math.max(0, (current[request.status] || 1) - 1),
      }));
      toast.success('Request deleted');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  };

  const visible = filter ? requests.filter((request) => request.status === filter) : requests;
  const newCount = counts.new || 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {loading
            ? 'Loading…'
            : `${requests.length} quotation request${requests.length === 1 ? '' : 's'}`}
          {!loading && newCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-gold-soft px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gold">
              {newCount} new
            </span>
          )}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {[{ value: '', label: 'All' }, ...REQUEST_STATUSES.map((status) => ({
            value: status,
            label: REQUEST_STATUS_META[status].label,
          }))].map((tab) => {
            const count = tab.value ? counts[tab.value] || 0 : requests.length;
            const active = filter === tab.value;
            return (
              <button
                key={tab.value || 'all'}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  active
                    ? 'border-forest bg-forest text-white'
                    : 'border-sand bg-white text-ink-soft hover:border-sage hover:text-forest'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 ${active ? 'text-cream/60' : 'text-ink-faint'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading quotation requests" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title={filter ? 'Nothing in this stage' : 'No quotation requests yet'}
          description={
            filter
              ? 'Try another stage — requests move here as you work through them.'
              : 'Requests submitted from the landscaping page will land here with the site details and planting brief.'
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((request) => {
            const meta = REQUEST_STATUS_META[request.status] || REQUEST_STATUS_META.new;
            return (
              <article key={request.id} className="card flex flex-col overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-sand/70 bg-parchment/40 px-5 py-4">
                  <div>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink-faint">
                      {request.reference}
                    </p>
                    <h2 className="mt-1 font-display text-xl leading-tight text-ink">
                      {request.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {formatDate(request.createdAt)} · {labelFor(SITE_TYPES, request.siteType)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${meta.className}`}>{meta.label}</span>
                    <button
                      type="button"
                      onClick={() => remove(request)}
                      disabled={busy === request.id}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-sand bg-white text-ink-soft transition-colors hover:border-rose hover:text-rose"
                      aria-label={`Delete request ${request.reference}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 space-y-4 p-5">
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                    <a
                      href={`mailto:${request.email}`}
                      className="inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-forest"
                    >
                      <Mail size={13} /> {request.email}
                    </a>
                    <a
                      href={`tel:${request.phone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 text-ink-soft transition-colors hover:text-forest"
                    >
                      <Phone size={13} /> {request.phone}
                    </a>
                  </div>

                  <dl className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
                    {[
                      { label: 'Site', value: request.location, icon: MapPin },
                      { label: 'Land size', value: request.landSize, icon: Sprout },
                      { label: 'Timeline', value: labelFor(TIMELINES, request.timeline), icon: Clock },
                      { label: 'Budget', value: labelFor(BUDGETS, request.budget), icon: null },
                    ].map((row) => (
                      <div key={row.label}>
                        <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-faint">
                          {row.label}
                        </dt>
                        <dd className="mt-0.5 flex items-start gap-1.5 text-sm text-ink">
                          {row.icon && (
                            <row.icon size={13} className="mt-1 shrink-0 text-leaf" strokeWidth={1.6} />
                          )}
                          {row.value || '—'}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-faint">
                      Preferred flowers
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {request.preferredFlowers.length ? (
                        request.preferredFlowers.map((flower) => (
                          <span
                            key={flower}
                            className="inline-flex items-center gap-1 rounded-full border border-sand bg-white px-2.5 py-1 text-[0.72rem] text-forest"
                          >
                            <Flower2 size={11} /> {flower}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-ink-soft">Open to suggestions</span>
                      )}
                    </div>
                  </div>

                  {request.notes && (
                    <div className="rounded-xl border border-sand/70 bg-parchment/60 px-3.5 py-3">
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-faint">
                        Site notes
                      </p>
                      <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-soft">
                        {request.notes}
                      </p>
                    </div>
                  )}

                  {request.messages?.length > 0 && (
                    <div>
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-faint">
                        Conversation
                      </p>
                      <ul className="mt-1.5 space-y-2">
                        {request.messages.map((message) => (
                          <li
                            key={message.id}
                            className={`rounded-xl border px-3.5 py-2.5 ${
                              message.author === 'studio'
                                ? 'border-sage/45 bg-sage-soft'
                                : 'border-sand/70 bg-white'
                            }`}
                          >
                            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                              {message.author === 'studio'
                                ? message.authorName || 'Garden team'
                                : request.name}{' '}
                              <span className="font-normal normal-case tracking-normal">
                                · {formatDate(message.createdAt)}
                              </span>
                            </p>
                            <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-soft">
                              {message.body}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <form
                    onSubmit={(event) => sendReply(event, request)}
                    className="border-t border-sand/70 pt-3.5"
                  >
                    <label
                      htmlFor={`reply-${request.id}`}
                      className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ink-faint"
                    >
                      Reply to {request.name.split(' ')[0]}
                    </label>
                    <textarea
                      id={`reply-${request.id}`}
                      rows={2}
                      maxLength={2000}
                      className="field mt-1.5 resize-y text-xs"
                      placeholder="Site visit times, measurement notes, the quotation as it firms up…"
                      value={drafts[request.id] || ''}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [request.id]: event.target.value }))
                      }
                      disabled={replying === request.id}
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[0.68rem] text-ink-faint">
                        {request.status === 'new'
                          ? 'Replying moves this request to Contacted.'
                          : 'Lands in the customer’s account thread.'}
                      </span>
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={replying === request.id || !(drafts[request.id] || '').trim()}
                      >
                        <Send size={13} />
                        {replying === request.id ? 'Sending…' : 'Send reply'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-sand/70 px-5 py-3.5">
                  <label
                    htmlFor={`status-${request.id}`}
                    className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-faint"
                  >
                    Stage
                  </label>
                  <select
                    id={`status-${request.id}`}
                    value={request.status}
                    disabled={busy === request.id}
                    onChange={(event) => updateStatus(request, event.target.value)}
                    className="field w-auto flex-1 py-1.5 text-xs sm:flex-none"
                  >
                    {REQUEST_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {REQUEST_STATUS_META[status].label}
                      </option>
                    ))}
                  </select>
                  <a
                    href={`mailto:${request.email}?subject=${encodeURIComponent(
                      `Your Hinga garden quotation (${request.reference})`,
                    )}`}
                    className="btn btn-secondary btn-sm ml-auto"
                  >
                    <Mail size={13} /> Reply
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
