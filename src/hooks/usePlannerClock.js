import { useEffect, useState } from 'react';
import { nowOnGrid } from '../lib/time.js';

export function usePlannerClock(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return nowOnGrid(new Date(now));
}
