import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  api,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  setUnauthorizedHandler,
  syncTokenFromStorage,
} from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Restore from the cached session first so a reload paints as signed in
  // instead of bouncing through the login page while /auth/me is in flight.
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));
  const [loading, setLoading] = useState(() => Boolean(getToken()) && !getStoredUser());
  const [sessionExpired, setSessionExpired] = useState(false);

  const applyUser = useCallback((next) => {
    setUser(next);
    setStoredUser(next);
  }, []);

  const clearSession = useCallback(({ expired = false } = {}) => {
    setToken(null); // also drops the cached profile
    setUser(null);
    setSessionExpired(expired);
  }, []);

  /*
   * Revalidate the stored token on load. Only a real 401/404 signs the user
   * out: before this, a cold start or offline blip deleted the token, which is
   * why a reload could end with the login page and another registration.
   */
  useEffect(() => {
    let cancelled = false;
    let retryTimer = null;

    if (!getToken()) {
      setLoading(false);
      return undefined;
    }

    const revalidate = async (attempt = 0) => {
      try {
        const { user: me } = await api.me();
        if (cancelled) return;
        applyUser(me);
        setSessionExpired(false);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const status = Number(err?.status || 0);

        if (status === 401 || status === 404) {
          clearSession({ expired: true });
          setLoading(false);
          return;
        }

        // Offline, a cold start or a 5xx: keep the session, retry shortly.
        if (attempt < 2) {
          retryTimer = setTimeout(() => revalidate(attempt + 1), 1200 * (attempt + 1));
          return;
        }
        setLoading(false);
      }
    };

    revalidate();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [applyUser, clearSession]);

  /* Any authenticated call can discover an expired token, not just /auth/me. */
  useEffect(() => {
    setUnauthorizedHandler(() => clearSession({ expired: true }));
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  /* Keep tabs in step when one of them signs in or out. */
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key && event.key !== 'hinga.token' && event.key !== 'hinga.user') return;
      if (!syncTokenFromStorage()) {
        setUser(null);
        return;
      }
      setUser(getStoredUser());
      api
        .me()
        .then(({ user: me }) => applyUser(me))
        .catch(() => {});
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [applyUser]);

  const login = useCallback(
    async (credentials) => {
      const { token, user: loggedIn } = await api.login(credentials);
      setToken(token);
      applyUser(loggedIn);
      setSessionExpired(false);
      return loggedIn;
    },
    [applyUser],
  );

  const register = useCallback(
    async (details) => {
      const { token, user: created } = await api.register(details);
      setToken(token);
      applyUser(created);
      setSessionExpired(false);
      return created;
    },
    [applyUser],
  );

  const registerAdmin = useCallback(
    async (details) => {
      const { token, user: created } = await api.adminRegister(details);
      setToken(token);
      applyUser(created);
      setSessionExpired(false);
      return created;
    },
    [applyUser],
  );

  const logout = useCallback(() => clearSession(), [clearSession]);

  const updateProfile = useCallback(
    async (body) => {
      const { user: updated } = await api.updateProfile(body);
      applyUser(updated);
      return updated;
    },
    [applyUser],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      sessionExpired,
      login,
      register,
      registerAdmin,
      logout,
      updateProfile,
    }),
    [user, loading, sessionExpired, login, register, registerAdmin, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
