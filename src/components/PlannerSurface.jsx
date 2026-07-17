import { useMemo } from 'react';
import { BoardCanvas } from './BoardCanvas.jsx';
import { Editor } from './Editor.jsx';

/** Shared gesture → editor/event wiring used by workspace + share shells. */
export function handleGridGesture(result, { readOnly, session, updateEvent }) {
  if (readOnly) return;
  switch (result.type) {
    case 'open-create':
      session.openCreate(result.draft);
      break;
    case 'open-edit':
      session.openEdit(result.id);
      break;
    case 'patch':
      updateEvent(result.id, result.patch);
      break;
    case 'noop':
      break;
    default:
      throw new Error(`Unknown grid gesture: ${result.type}`);
  }
}

/**
 * Shared planner body: board canvas + editor.
 * Headers / menus stay in each shell; toasts render via the global Toaster.
 */
export function PlannerSurface({
  boardId,
  events,
  session,
  views,
  presence,
  readOnly,
  swapping = false,
  updateEvent,
  nowMin,
  nowDay,
  printShowMemos = true,
}) {
  const visibleEvents = useMemo(
    () => views.visibleEvents(events),
    [views, events],
  );

  return (
    <>
      <BoardCanvas
        room={presence.room}
        myColor={presence.myColor}
        boardId={boardId}
        events={visibleEvents}
        nowMin={nowMin}
        nowDay={nowDay}
        editing={session.editing}
        onOpenEdit={session.openEdit}
        onGestureResult={(result) =>
          handleGridGesture(result, { readOnly, session, updateEvent })
        }
        gestureBlocked={Boolean(session.editing)}
        readOnly={readOnly}
        days={views.days}
        compact={views.compact}
        showMemos={views.showMemos}
        printShowMemos={printShowMemos}
        colorLabel={views.colorLabel}
        swapping={swapping}
      />

      {session.editing && (
        <Editor
          key={session.editing.mode + ':' + (session.editing.id || 'new')}
          draft={session.editing.draft}
          isNew={session.editing.mode === 'create'}
          closing={session.editing.closing}
          readOnly={readOnly}
          colorLabel={views.colorLabel}
          onSave={session.save}
          onCancel={session.cancel}
          onDelete={session.deleteEvent}
        />
      )}
    </>
  );
}
