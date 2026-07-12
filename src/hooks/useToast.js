import { useEffect, useRef, useState } from 'react';

export function useToast(durationMs = 2600) {
  const [note, setNote] = useState(null);
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const toast = (msg) => {
    clearTimeout(timer.current);
    setNote({ msg, key: Date.now() });
    timer.current = setTimeout(() => setNote(null), durationMs);
  };

  return { note, toast };
}
