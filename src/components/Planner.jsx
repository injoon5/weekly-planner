import * as stylex from '@stylexjs/stylex';
import { isOptimisticBoardId } from '../board/optimistic-board.js';
import { PlannerProvider } from '../planner/PlannerProvider.jsx';
import { usePlannerContext } from '../planner/usePlannerContext.js';
import { planner } from '../styles/planner.js';
import { AccountMenu } from './AccountMenu.jsx';
import { BoardNav } from './BoardNav.jsx';
import {
  PlannerReadyChrome,
  PlannerStatusShell,
  usePlannerScrollLock,
} from './PlannerChrome.jsx';
import { MoreMenu } from './MoreMenu.jsx';
import { PlannerHeader } from './PlannerHeader.jsx';
import { PlannerSurface } from './PlannerSurface.jsx';
import { PrintDialog } from './PrintDialog.jsx';
import { ShareAction } from './ShareAction.jsx';
import { TodosAction } from './TodosAction.jsx';

/**
 * Signed-in workspace shell: loads the workspace, then wires header clusters
 * around the shared planner chrome. Share-link shell: SharedPlanner.jsx.
 */
export function Planner() {
  usePlannerScrollLock();

  return (
    <PlannerProvider>
      <PlannerShell />
    </PlannerProvider>
  );
}

function PlannerShell() {
  const {
    user,
    boards,
    board,
    events,
    isOwner,
    showViewerBanner,
    setActiveId,
    isLoading,
    surfacePending,
    error,
    theme,
    toggleTheme,
    runtime,
    transfer,
    swapping,
    isOptimistic,
  } = usePlannerContext();

  if (error || isLoading || !board) {
    const message = error
      ? '불러오지 못했어요'
      : isLoading
        ? '불러오는 중…'
        : '시간표를 준비하는 중…';
    return (
      <PlannerStatusShell
        message={message}
        error={Boolean(error)}
        trailing={user ? <AccountMenu user={user} /> : null}
      />
    );
  }

  const livePresence = Boolean(board.id) && !isOptimisticBoardId(board.id);

  return (
    <PlannerReadyChrome
      presenceBoardId={livePresence ? board.id : null}
      presenceArgs={livePresence ? runtime.presenceArgs : null}
      banner={
        showViewerBanner ? (
          <div {...stylex.props(planner.banner)}>
            <span {...stylex.props(planner.bannerStrong)}>보기 전용</span>
            <span>이 시간표는 보기만 할 수 있어요</span>
          </div>
        ) : null
      }
    >
      {(presence) => (
        <>
          <PlannerHeader
            board={board}
            printPrefs={runtime.print.prefs}
            presence={presence}
            views={runtime.views}
            theme={theme}
            onToggleTheme={toggleTheme}
            navigation={
              <BoardNav
                user={user}
                boards={isOptimistic ? [board] : boards}
                board={board}
                events={events}
                isOwner={isOwner}
                onSelect={setActiveId}
              />
            }
            leadingActions={<AccountMenu user={user} />}
            todosAction={<TodosAction user={user} events={events} />}
            afterViewActions={
              isOptimistic ? null : (
                <ShareAction board={board} user={user} isOwner={isOwner} />
              )
            }
            onPrint={runtime.print.open}
            moreMenuItems={
              <MoreMenu
                onExport={transfer.doExport}
                onImport={isOwner ? transfer.askImport : null}
              />
            }
          />

          <PlannerSurface
            boardId={board.id}
            events={events}
            session={runtime.session}
            views={runtime.views}
            presence={presence}
            readOnly={runtime.readOnly || isOptimistic}
            swapping={swapping}
            surfacePending={surfacePending}
            updateEvent={runtime.eventsApi.updateEvent}
            printShowMemos={runtime.print.prefs.showMemos}
          />

          <PrintDialog {...runtime.print.dialog} />

          <input
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            ref={transfer.fileRef}
            onChange={transfer.onImportFile}
          />
        </>
      )}
    </PlannerReadyChrome>
  );
}
