import { useMemo } from 'react';
import * as stylex from '@stylexjs/stylex';
import { handleGridGesture } from '../grid/grid-gesture.js';
import { planner } from '../styles/planner.js';
import { BoardCanvas } from './BoardCanvas.jsx';
import { Editor } from './Editor.jsx';

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
  surfacePending = false,
  updateEvent,
  printShowMemos = true,
}) {
  const visibleEvents = useMemo(
    () => views.visibleEvents(events),
    [views, events],
  );

  if (surfacePending) {
    return (
      <div {...stylex.props(planner.surfacePending)} aria-busy="true" role="status">
        <span {...stylex.props(planner.surfacePendingSpinner)} aria-hidden="true" />
        불러오는 중…
      </div>
    );
  }

  return (
    <>
      <BoardCanvas
        room={presence.room}
        myColor={presence.myColor}
        boardId={boardId}
        events={visibleEvents}
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
