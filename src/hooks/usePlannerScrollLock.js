import { useEffect } from 'react';

const PLANNER_SCROLL_LOCK = 'planner-scroll-lock';

/**
 * Lock document scrolling while a planner shell is mounted.
 * Prefer a class over html:has(...) — cheaper style invalidation on mount.
 */
export function usePlannerScrollLock() {
  useEffect(() => {
    document.documentElement.classList.add(PLANNER_SCROLL_LOCK);
    return () => document.documentElement.classList.remove(PLANNER_SCROLL_LOCK);
  }, []);
}
