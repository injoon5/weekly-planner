import { useEffect, useState } from 'react';
import { MOBILE_SHEET_MQ } from '../lib/config.js';

/** True when overlays should render as a swipeable bottom drawer. */
export function useMobileSheet() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_SHEET_MQ).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_SHEET_MQ);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return mobile;
}
