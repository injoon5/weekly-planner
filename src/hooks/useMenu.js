import { useEffect, useState } from 'react';
import { clamp } from '../time.js';

const MENU_W = 232;
const EDGE = 8;

export function useMenu() {
  const [menu, setMenu] = useState(null);

  const openMenu = (kind, e, align, width = MENU_W) => {
    const r = e.currentTarget.getBoundingClientRect();
    const w = Math.min(width, window.innerWidth - EDGE * 2);
    const x = align === 'right' ? r.right - w : r.left;
    setMenu({
      kind,
      w,
      x: clamp(x, EDGE, Math.max(EDGE, window.innerWidth - w - EDGE)),
      y: r.bottom + 6,
    });
  };

  const closeMenu = () => setMenu(null);

  useEffect(() => {
    if (!menu) return;
    const startW = window.innerWidth;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenu(null);
    };
    // Close on real layout changes only — mobile keyboards fire height-only
    // resizes while typing into menu inputs, which must not dismiss the menu.
    const onResize = () => {
      if (window.innerWidth !== startW) setMenu(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [menu]);

  return { menu, openMenu, closeMenu, setMenu };
}

/** Inline geometry for the fixed-position popover: clamped x/y + scroll room. */
export function menuPopStyle(menu) {
  return {
    left: `${menu.x}px`,
    top: `${menu.y}px`,
    width: `${menu.w}px`,
    maxHeight: `calc(100dvh - ${menu.y}px - 12px)`,
  };
}
