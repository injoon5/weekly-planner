import * as stylex from '@stylexjs/stylex';
import { THEME_KEY } from './config.js';
import { darkTheme } from './themes.js';
import { reset } from './styles/ui.js';

export function readBootTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  if (document.documentElement.dataset.theme === 'dark') return 'dark';
  if (document.documentElement.dataset.theme === 'light') return 'light';
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Apply StyleX dark tokens on <html> so body + all descendants pick them up. */
export function applyDocumentTheme(theme) {
  const htmlBase = stylex.props(reset.html).className ?? '';
  const themeCls = theme === 'dark' ? (stylex.props(darkTheme).className ?? '') : '';
  document.documentElement.className = [htmlBase, themeCls].filter(Boolean).join(' ');
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  const bodyBase = stylex.props(reset.body).className ?? '';
  document.body.className = bodyBase;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta instanceof HTMLMetaElement) {
    meta.content = theme === 'dark' ? '#131316' : '#F6F6F7';
  }
}

/** One-shot pre-React boot — only call from main.jsx. */
export function bootDocumentTheme() {
  applyDocumentTheme(readBootTheme());
}
