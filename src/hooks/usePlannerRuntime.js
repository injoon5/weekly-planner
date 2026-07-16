import { useBoardPresence } from './useBoardPresence.js';
import { useEditorSession } from './useEditorSession.js';
import { useEventMutations } from './useEventMutations.js';
import { usePlannerClock } from './usePlannerClock.js';
import { usePrintSetup } from './usePrintSetup.js';
import { useTodoMutations } from './useTodoMutations.js';
import { useViewControls } from './useViewControls.js';

export function usePlannerRuntime({
  board,
  events,
  canEdit,
  ruleParams = null,
  boardPrefs = null,
  user = null,
  role,
  canRenameColors = false,
  storageKey,
  guestLabel,
  onError,
}) {
  const clock = usePlannerClock();
  const eventsApi = useEventMutations({ board, canEdit, ruleParams, onError });
  const todosApi = useTodoMutations({ board, canEdit, ruleParams, onError });
  const session = useEditorSession({ events, eventsApi });
  const views = useViewControls({
    board,
    boardPrefs,
    user,
    canRenameColors,
    storageKey,
    onError,
  });
  const presence = useBoardPresence({
    boardId: board?.id,
    user,
    role,
    guestLabel,
  });
  const print = usePrintSetup(board);

  return {
    clock,
    eventsApi,
    todosApi,
    session,
    views,
    presence,
    print,
    readOnly: !canEdit,
  };
}
