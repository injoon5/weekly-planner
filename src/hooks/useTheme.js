import { useEffect, useRef, useState } from 'react';
import { THEME_KEY } from '../config.js';
import { db, persistThemeTx } from '../db.js';
import { applyDocumentTheme } from '../theme-dom.js';

function readBootTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  if (document.documentElement.dataset.theme === 'dark') return 'dark';
  if (document.documentElement.dataset.theme === 'light') return 'light';
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Single theme owner: Instant settings → local cache → DOM.
 * Callers never prop-drill theme for palettes (CSS uses html[data-theme]).
 */
export function useTheme(settings) {
  const [theme, setTheme] = useState(readBootTheme);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    applyDocumentTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (settings?.theme === 'dark' || settings?.theme === 'light') {
      setTheme(settings.theme);
    }
  }, [settings?.theme]);

  useEffect(() => {
    const before = () => applyDocumentTheme('light');
    const after = () => applyDocumentTheme(themeRef.current);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  const persistTheme = (next) => {
    setTheme(next);
    const tx = persistThemeTx(settings, next);
    if (tx) db.transact(tx);
  };

  const toggleTheme = () => persistTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, persistTheme, toggleTheme };
}
