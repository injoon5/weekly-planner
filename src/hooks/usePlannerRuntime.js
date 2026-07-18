import { useMemo } from 'react';
import { useEditorSession } from './useEditorSession.js';
import { useEventMutations } from './useEventMutations.js';
import { usePrintSetup } from './usePrintSetup.js';
import { useViewControls } from './useViewControls.js';

/** Empty presence for optimistic / boardless shells — no Instant room. */
export const EMPTY_PRESENCE = {
  room: null,
  peers: [],
  myColor: '#8F8F9C',
  myName: '',
  isReady: false,
};

export function usePlannerRuntime({
  board,
  events,
  canEdit,
  ruleParams = null,
  boardPrefs = null,
  user = null,
  settings = null,
  role,
  canRenameColors = false,
  storageKey,
  guestLabel,
}) {
  // Clock lives in WeekGrid so 30s ticks don't re-render the planner shell.
  // Presence mounts only for a real board id via BoardPresenceBridge.
  const eventsApi = useEventMutations({ board, canEdit, ruleParams });
  const session = useEditorSession({ events, eventsApi });
  const views = useViewControls({
    board,
    boardPrefs,
    user,
    canRenameColors,
    storageKey,
  });
  const print = usePrintSetup(board);

  const presenceArgs = useMemo(
    () => ({ user, role, guestLabel, settings }),
    [user, role, guestLabel, settings],
  );

  return useMemo(
    () => ({
      eventsApi,
      session,
      views,
      print,
      readOnly: !canEdit,
      presence: EMPTY_PRESENCE,
      presenceArgs,
    }),
    [eventsApi, session, views, print, canEdit, presenceArgs],
  );
}
