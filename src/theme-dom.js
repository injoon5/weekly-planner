import * as stylex from '@stylexjs/stylex';
import { darkTheme } from './themes.js';
import { reset } from './styles/ui.js';

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
  if (meta) meta.content = theme === 'dark' ? '#131316' : '#F6F6F7';
}
