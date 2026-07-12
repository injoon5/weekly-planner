import { useEffect, useState } from 'react';
import { clamp } from '../time.js';

const MENU_W = 232;

export function useMenu() {
  const [menu, setMenu] = useState(null);

  const openMenu = (kind, e, align) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = align === 'right' ? r.right - MENU_W : r.left;
    setMenu({
      kind,
      x: clamp(x, 8, window.innerWidth - MENU_W - 8),
      y: r.bottom + 6,
    });
  };

  const closeMenu = () => setMenu(null);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenu(null);
    };
    const onResize = () => setMenu(null);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menu]);

  return { menu, openMenu, closeMenu, setMenu };
}
