import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const redirect = new URLSearchParams(location.search).get('redirect') || '/account';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      navigate(user.role === 'admin' && redirect === '/account' ? '/admin' : redirect, {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const fill = (email, password) => setForm({ email, password });

  return (
    <div className="container-page py-14 md:py-20">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[1.5rem] border border-sand/70 bg-white md:grid-cols-2">
        <div className="p-7 md:p-10">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-2 font-display text-3xl text-ink">Sign in</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Track your orders, reorder favourites and save addresses.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  id="email"
                  type="email"
                  required
                  className="field pl-9"
                  value={form.email}
                  onChange={(event) => setForm((v) => ({ ...v, email: event.target.value }))}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  id="password"
                  type="password"
                  required
                  className="field pl-9"
                  value={form.password}
                  onChange={(event) => setForm((v) => ({ ...v, password: event.target.value }))}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-2 rounded-xl bg-rose-soft px-3.5 py-2.5 text-sm text-rose">
                <AlertCircle size={15} /> {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
              {busy ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            New to Hinga?{' '}
            <Link to="/register" className="link">
              Create an account
            </Link>
          </p>

          <div className="mt-6 rounded-xl border border-sand/70 bg-parchment/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
              Demo accounts
            </p>
            <div className="mt-2.5 space-y-2 text-sm">
              <button
                type="button"
                onClick={() => fill('admin@hinga.shop', 'admin1234')}
                className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left transition-colors hover:bg-sage-soft"
              >
                <span>
                  <span className="block font-medium text-ink">Admin</span>
                  <span className="block text-xs text-ink-faint">admin@hinga.shop · admin1234</span>
                </span>
                <ArrowRight size={14} className="text-sage" />
              </button>
              <button
                type="button"
                onClick={() => fill('amelia@example.com', 'customer123')}
                className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left transition-colors hover:bg-sage-soft"
              >
                <span>
                  <span className="block font-medium text-ink">Customer</span>
                  <span className="block text-xs text-ink-faint">
                    amelia@example.com · customer123
                  </span>
                </span>
                <ArrowRight size={14} className="text-sage" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative hidden overflow-hidden bg-forest md:block">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1469259943454-aa100abba749?auto=format&fit=crop&w=900&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="relative flex h-full flex-col justify-end p-10 text-white">
            <p className="font-display text-2xl leading-snug">
              “They sent the loveliest monstera I've ever received. Not a leaf bruised.”
            </p>
            <p className="mt-3 text-sm text-sage-soft">Amelia R. — verified buyer</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      toast.success(`Welcome to Hinga, ${user.name.split(' ')[0]}`);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const field = (key, props = {}) => ({
    id: key,
    className: 'field',
    value: form[key],
    onChange: (event) => setForm((v) => ({ ...v, [key]: event.target.value })),
    ...props,
  });

  return (
    <div className="container-page py-14 md:py-20">
      <div className="mx-auto max-w-lg rounded-[1.5rem] border border-sand/70 bg-white p-7 md:p-10">
        <p className="eyebrow">Join Hinga</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Create your account</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Save your details for faster checkout and keep every order in one place.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label className="label" htmlFor="name">
              Full name
            </label>
            <div className="relative">
              <User
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input {...field('name', { placeholder: 'Amelia Rhodes', required: true })} className="field pl-9" />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                {...field('email', { type: 'email', placeholder: 'you@example.com', required: true })}
                className="field pl-9"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="phone">
              Phone (optional)
            </label>
            <div className="relative">
              <Phone
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                {...field('phone', { placeholder: '555-0100' })}
                className="field pl-9"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <input
                {...field('password', {
                  type: 'password',
                  placeholder: 'At least 6 characters',
                  required: true,
                  minLength: 6,
                })}
                className="field pl-9"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="confirm">
              Confirm password
            </label>
            <input
              {...field('confirm', { type: 'password', placeholder: 'Again', required: true })}
              className="field"
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-xl bg-rose-soft px-3.5 py-2.5 text-sm text-rose">
              <AlertCircle size={15} /> {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
            {busy ? 'Creating account…' : <>Create account <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
