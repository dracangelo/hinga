import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Only allow same-origin paths as post-login destinations. */
function safeRedirect(value, fallback) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : fallback;
}

function FormError({ children }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-rose-soft px-3.5 py-2.5 text-sm text-rose">
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

function AuthAside({ quote, author, icon: Icon }) {
  return (
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
        {Icon && (
          <span className="mb-4 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10">
            <Icon size={20} />
          </span>
        )}
        <p className="font-display text-2xl leading-snug">“{quote}”</p>
        <p className="mt-3 text-sm text-sage-soft">{author}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sign in                                                             */
/* ------------------------------------------------------------------ */

export function Login({ adminMode = false }) {
  const { login, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const params = new URLSearchParams(location.search);
  const fallback = adminMode ? '/admin' : '/account';
  const redirect = safeRedirect(
    params.get('redirect') || location.state?.from,
    fallback,
  );

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form);

      if (adminMode && user.role !== 'admin') {
        logout();
        setError('That account is not an administrator. Use the customer sign-in instead.');
        return;
      }

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

  return (
    <div className="container-page py-14 md:py-20">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[1.5rem] border border-sand/70 bg-white md:grid-cols-2">
        <div className="p-7 md:p-10">
          <Link to="/" className="mb-6 inline-flex items-center gap-3">
            <img
              src="/logo.png"
              alt="SAMHIN logo"
              className="h-10 w-10 rounded-full object-cover ring-1 ring-forest/20"
            />
            <span className="font-display text-xl text-forest">SAMHIN</span>
          </Link>

          <div className="mb-6 flex rounded-xl border border-sand/80 bg-parchment/60 p-1">
            <Link
              to="/login"
              className={`flex-1 rounded-lg py-2 text-center text-xs font-medium transition-all ${
                !adminMode
                  ? 'bg-white text-forest shadow-sm'
                  : 'text-ink-soft hover:text-forest'
              }`}
            >
              Customer sign in
            </Link>
            <Link
              to="/admin/login"
              className={`flex-1 rounded-lg py-2 text-center text-xs font-medium transition-all ${
                adminMode
                  ? 'bg-forest text-cream shadow-sm'
                  : 'text-ink-soft hover:text-forest'
              }`}
            >
              Store administrator
            </Link>
          </div>

          <p className="eyebrow flex items-center gap-2">
            {adminMode ? (
              <>
                <ShieldCheck size={13} /> Store administration
              </>
            ) : (
              'Welcome back'
            )}
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink">
            {adminMode ? 'Administrator sign in' : 'Sign in'}
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            {adminMode
              ? 'Sign in with your administrator account to manage orders, products and customers.'
              : 'Track your orders, reorder favourites and save addresses.'}
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
                  autoComplete="email"
                  className="field pl-9"
                  value={form.email}
                  onChange={(event) => setForm((v) => ({ ...v, email: event.target.value }))}
                  placeholder={adminMode ? 'admin@samhin.shop' : 'you@example.com'}
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
                  autoComplete="current-password"
                  className="field pl-9"
                  value={form.password}
                  onChange={(event) => setForm((v) => ({ ...v, password: event.target.value }))}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <FormError>{error}</FormError>}

            <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
              {busy ? 'Signing in…' : <>{adminMode ? 'Sign in to admin' : 'Sign in'} <ArrowRight size={16} /></>}
            </button>
          </form>

          {adminMode ? (
            <p className="mt-6 text-center text-sm text-ink-soft">
              Need an administrator account?{' '}
              <Link to="/admin/register" className="link">
                Create one with access code
              </Link>
              <span className="mt-2 block text-xs text-ink-faint">
                Not an administrator?{' '}
                <Link to="/login" className="link">
                  Customer sign in
                </Link>
              </span>
            </p>
          ) : (
            <p className="mt-6 text-center text-sm text-ink-soft">
              New to SAMHIN?{' '}
              <Link to="/register" className="link">
                Create an account
              </Link>
              <span className="mt-2 block text-xs text-ink-faint">
                Studio manager?{' '}
                <Link to="/admin/login" className="link">
                  Administrator sign in
                </Link>
              </span>
            </p>
          )}
        </div>

        <AuthAside
          quote={
            adminMode
              ? 'Every order, every plant, every customer — all in one place.'
              : "They sent the loveliest monstera I've ever received. Not a leaf bruised."
          }
          author={adminMode ? 'The SAMHIN studio team' : 'Amelia R. — verified buyer'}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Customer sign up                                                    */
/* ------------------------------------------------------------------ */

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
      toast.success(`Welcome to SAMHIN, ${user.name.split(' ')[0]}`);
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
        <Link to="/" className="mb-6 inline-flex items-center gap-3">
          <img
            src="/logo.png"
            alt="SAMHIN logo"
            className="h-10 w-10 rounded-full object-cover ring-1 ring-forest/20"
          />
          <span className="font-display text-xl text-forest">SAMHIN</span>
        </Link>
        <p className="eyebrow">Join SAMHIN</p>
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
              <input
                {...field('name', {
                  placeholder: 'Full name',
                  required: true,
                  autoComplete: 'name',
                })}
                className="field pl-9"
              />
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
                {...field('email', {
                  type: 'email',
                  placeholder: 'you@example.com',
                  required: true,
                  autoComplete: 'email',
                })}
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
                {...field('phone', { placeholder: '+254 700 000 000', autoComplete: 'tel' })}
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
                  autoComplete: 'new-password',
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
              {...field('confirm', {
                type: 'password',
                placeholder: 'Again',
                required: true,
                autoComplete: 'new-password',
              })}
              className="field"
            />
          </div>

          {error && <FormError>{error}</FormError>}

          <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
            {busy ? 'Creating account…' : <>Create account <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
          <span className="mt-2 block text-xs text-ink-faint">
            Studio staff?{' '}
            <Link to="/admin/register" className="link">
              Create an administrator account
            </Link>
          </span>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Administrator sign up                                               */
/* ------------------------------------------------------------------ */

export function AdminRegister() {
  const { registerAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    adminCode: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .adminSignupStatus()
      .then((data) => {
        if (!cancelled) setSignupEnabled(Boolean(data.enabled));
      })
      .catch(() => {
        if (!cancelled) setSignupEnabled(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const user = await registerAdmin({
        name: form.name,
        email: form.email,
        phone: form.phone,
        adminCode: form.adminCode,
        password: form.password,
      });
      toast.success(`Welcome to the studio, ${user.name.split(' ')[0]}`);
      navigate('/admin', { replace: true });
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

  const disabled = busy || signupEnabled === false;

  return (
    <div className="container-page py-14 md:py-20">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[1.5rem] border border-sand/70 bg-white md:grid-cols-2">
        <div className="p-7 md:p-10">
          <Link to="/" className="mb-6 inline-flex items-center gap-3">
            <img
              src="/logo.png"
              alt="SAMHIN logo"
              className="h-10 w-10 rounded-full object-cover ring-1 ring-forest/20"
            />
            <span className="font-display text-xl text-forest">SAMHIN</span>
          </Link>

          <p className="eyebrow flex items-center gap-2">
            <ShieldCheck size={13} /> Store administration
          </p>
          <h1 className="mt-2 font-display text-3xl text-ink">Create an admin account</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Administrator accounts can manage orders, products, categories, customers and reviews.
          </p>

          {signupEnabled === false && (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-gold-soft px-3.5 py-2.5 text-sm text-clay">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>
                Administrator sign-up is disabled on this server. Set{' '}
                <code className="font-mono text-xs">ADMIN_SIGNUP_CODE</code> to enable it.
              </span>
            </p>
          )}

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
                <input
                  {...field('name', {
                    placeholder: 'Studio manager',
                    required: true,
                    autoComplete: 'name',
                  })}
                  className="field pl-9"
                />
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
                  {...field('email', {
                    type: 'email',
                    placeholder: 'you@samhin.shop',
                    required: true,
                    autoComplete: 'email',
                  })}
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
                  {...field('phone', { placeholder: '+254 700 000 000', autoComplete: 'tel' })}
                  className="field pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="adminCode">
                Administrator access code
              </label>
              <div className="relative">
                <KeyRound
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  {...field('adminCode', {
                    placeholder: 'Provided by the studio owner',
                    required: true,
                    autoComplete: 'off',
                  })}
                  className="field pl-9"
                />
              </div>
              <p className="mt-1.5 text-xs text-ink-faint">
                This shared code is configured on the server as{' '}
                <code className="font-mono">ADMIN_SIGNUP_CODE</code> (default in dev:{' '}
                <code className="font-mono">samhin-admin</code>).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                      autoComplete: 'new-password',
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
                  {...field('confirm', {
                    type: 'password',
                    placeholder: 'Again',
                    required: true,
                    autoComplete: 'new-password',
                  })}
                  className="field"
                />
              </div>
            </div>

            {error && <FormError>{error}</FormError>}

            <button type="submit" disabled={disabled} className="btn btn-primary btn-lg w-full">
              {busy ? 'Creating admin account…' : <>Create admin account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Already an administrator?{' '}
            <Link to="/admin/login" className="link">
              Sign in
            </Link>
            <span className="mt-2 block text-xs text-ink-faint">
              Looking to shop?{' '}
              <Link to="/register" className="link">
                Create a customer account
              </Link>
            </span>
          </p>
        </div>

        <AuthAside
          icon={ShieldCheck}
          quote="Give your team the keys to the greenhouse — without sharing a login."
          author="SAMHIN administrator access"
        />
      </div>
    </div>
  );
}
