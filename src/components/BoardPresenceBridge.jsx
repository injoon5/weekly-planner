import { useBoardPresence } from '../hooks/useBoardPresence.js';

/**
 * Mount Instant board presence only when a real board id is available.
 * Keeps hooks out of idle/optimistic shells (no `idle:` room traffic).
 */
export function BoardPresenceBridge({
  boardId,
  user,
  role,
  guestLabel,
  settings,
  children,
}) {
  const presence = useBoardPresence({
    boardId,
    user,
    role,
    guestLabel,
    settings,
  });
  return children(presence);
}
