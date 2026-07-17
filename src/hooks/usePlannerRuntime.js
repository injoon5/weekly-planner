import { useBoardPresence } from './useBoardPresence.js';
import { useEditorSession } from './useEditorSession.js';
import { useEventMutations } from './useEventMutations.js';
import { usePrintSetup } from './usePrintSetup.js';
import { useViewControls } from './useViewControls.js';

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
  const eventsApi = useEventMutations({ board, canEdit, ruleParams });
  const session = useEditorSession({ events, eventsApi });
  const views = useViewControls({
    board,
    boardPrefs,
    user,
    canRenameColors,
    storageKey,
  });
  const presence = useBoardPresence({
    boardId: board?.id,
    user,
    role,
    guestLabel,
    settings,
  });
  const print = usePrintSetup(board);

  return {
    eventsApi,
    session,
    views,
    presence,
    print,
    readOnly: !canEdit,
  };
}
