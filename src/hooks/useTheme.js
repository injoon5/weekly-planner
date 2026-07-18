import { useEffect, useRef, useState } from 'react';
import { isOk } from '../lib/command-result.js';
import { THEME_KEY } from '../lib/config.js';
import { toast } from '../lib/notify.js';
import { db } from '../db/instant.js';
import { applyDocumentTheme, readBootTheme } from '../theme/theme-dom.js';
import { commitTransaction } from '../db/transaction.js';
import { persistThemeTx } from '../db/tx/theme.js';

/**
 * Single theme owner after boot: Instant settings → local cache → DOM.
 * Print: beforeprint flips StyleX chrome to light; event colors use @media screen
 * dark rules so print inherits the base light palette without a second CSS dump.
 */
export function useTheme(settings) {
  const [theme, setTheme] = useState(readBootTheme);
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

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
    const toLight = () => applyDocumentTheme('light');
    const restore = () => applyDocumentTheme(themeRef.current);
    const onPrintMq = (event) => {
      if (event.matches) toLight();
      else restore();
    };

    // beforeprint is flaky on iOS Safari; matchMedia('print') covers preview.
    const mq = window.matchMedia('print');
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onPrintMq);
    else mq.addListener(onPrintMq);

    window.addEventListener('beforeprint', toLight);
    window.addEventListener('afterprint', restore);
    return () => {
      if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onPrintMq);
      else mq.removeListener(onPrintMq);
      window.removeEventListener('beforeprint', toLight);
      window.removeEventListener('afterprint', restore);
    };
  }, []);

  const persistTheme = async (next) => {
    const previous = themeRef.current;
    setTheme(next);
    const tx = persistThemeTx(settings, next);
    if (!tx) return true;
    const result = await commitTransaction((transaction) => db.transact(transaction), tx, {
      message: '테마를 저장하지 못했어요',
      onError: toast,
    });
    if (!isOk(result)) setTheme(previous);
    return isOk(result);
  };

  const toggleTheme = () => void persistTheme(theme === 'dark' ? 'light' : 'dark');

  return { theme, persistTheme, toggleTheme };
}
