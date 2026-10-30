import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'hinga.theme';
export const THEME_MODES = ['light', 'dark', 'system'];

const ThemeContext = createContext(null);

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

function storedMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (THEME_MODES.includes(stored)) return stored;
  } catch {
    /* storage can be blocked, fall back to the device */
  }
  return 'system';
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(storedMode);
  const [systemDark, setSystemDark] = useState(prefersDark);

  /* Keep the device preference current while system mode is chosen. */
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const theme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  const setMode = useCallback((next) => {
    if (!THEME_MODES.includes(next)) return;
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* the choice still applies to this visit */
    }
  }, []);

  /* The quick sun/moon button always settles on an explicit side. */
  const toggle = useCallback(() => setMode(theme === 'dark' ? 'light' : 'dark'), [setMode, theme]);

  const value = useMemo(
    () => ({ mode, theme, isDark: theme === 'dark', setMode, toggle }),
    [mode, theme, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
  return context;
}
