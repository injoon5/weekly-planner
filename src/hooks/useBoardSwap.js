import { useEffect, useState } from 'react';

/**
 * Brief crossfade when the active board changes: keep the outgoing board id
 * on screen for one beat, then swap. Returns whether the swap is in flight.
 */
export function useBoardSwap(boardId) {
  const [swapping, setSwapping] = useState(false);
  const [shownId, setShownId] = useState(boardId);

  useEffect(() => {
    if (!boardId || boardId === shownId) return;
    setSwapping(true);
    const t = setTimeout(() => {
      setShownId(boardId);
      setSwapping(false);
    }, 140);
    return () => clearTimeout(t);
  }, [boardId, shownId]);

  return swapping;
}
