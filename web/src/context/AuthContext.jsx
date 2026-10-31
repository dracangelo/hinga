import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const { user: me } = await api.me();
        if (!cancelled) setUser(me);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { token, user: loggedIn } = await api.login(credentials);
    setToken(token);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (details) => {
    const { token, user: created } = await api.register(details);
    setToken(token);
    setUser(created);
    return created;
  }, []);

  const registerAdmin = useCallback(async (details) => {
    const { token, user: created } = await api.adminRegister(details);
    setToken(token);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (body) => {
    const { user: updated } = await api.updateProfile(body);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, registerAdmin, logout, updateProfile }),
    [user, loading, login, register, registerAdmin, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
