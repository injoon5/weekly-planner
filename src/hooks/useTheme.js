import { useEffect, useRef, useState } from 'react';
import { THEME_KEY } from '../config.js';
import { db, persistThemeTx } from '../db.js';
import { applyDocumentTheme, readBootTheme } from '../theme-dom.js';
import { commitTransaction } from '../transaction.js';

/**
 * Single theme owner after boot: Instant settings → local cache → DOM.
 * Print: beforeprint flips StyleX chrome to light; event colors use @media screen
 * dark rules so print inherits the base light palette without a second CSS dump.
 */
export function useTheme(settings, onError) {
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

  const persistTheme = async (next) => {
    const previous = themeRef.current;
    setTheme(next);
    const tx = persistThemeTx(settings, next);
    if (!tx) return true;
    const didSave = await commitTransaction((transaction) => db.transact(transaction), tx, {
      message: '테마를 저장하지 못했어요',
      onError,
    });
    if (!didSave) setTheme(previous);
    return didSave;
  };

  const toggleTheme = () => void persistTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, persistTheme, toggleTheme };
}
