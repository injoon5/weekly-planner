import { useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { isOptimisticBoardId } from '../board/optimistic-board.js';
import { EMPTY_PRESENCE } from '../hooks/usePlannerRuntime.js';
import { planner } from '../styles/planner.js';
import { PlannerProvider } from '../planner/PlannerProvider.jsx';
import { usePlannerContext } from '../planner/usePlannerContext.js';
import { AccountMenu } from './AccountMenu.jsx';
import { BoardNav } from './BoardNav.jsx';
import { BoardPresenceBridge } from './BoardPresenceBridge.jsx';
import { MoreMenu } from './MoreMenu.jsx';
import { PlannerHeader } from './PlannerHeader.jsx';
import { PlannerSurface } from './PlannerSurface.jsx';
import { PrintDialog } from './PrintDialog.jsx';
import { ShareAction } from './ShareAction.jsx';
import { TodosAction } from './TodosAction.jsx';

const PLANNER_SCROLL_LOCK = 'planner-scroll-lock';

/**
 * Signed-in workspace shell: loads the workspace, then wires header clusters
 * (BoardNav / AccountMenu / TodosAction / ShareAction) around the shared
 * planner surface. The shared-link shell lives in SharedPlanner.jsx.
 */
export function Planner() {
  // Prefer a class over html:has(...) — cheaper style invalidation on mount.
  useEffect(() => {
    document.documentElement.classList.add(PLANNER_SCROLL_LOCK);
    return () => document.documentElement.classList.remove(PLANNER_SCROLL_LOCK);
  }, []);

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

  // Soft shell only while Instant list is still loading with nothing to paint.
  // Optimistic seed provides `board` so guest create skips this gate.
  if (error || isLoading || !board) {
    const message = error
      ? `오류: ${error.message}`
      : isLoading
        ? '불러오는 중…'
        : '시간표를 준비하는 중…';
    return (
      <div {...stylex.props(planner.app)} data-app-shell="planner">
        <header {...stylex.props(planner.top)}>
          <h1 {...stylex.props(planner.h1)}>주간 계획표</h1>
          <div {...stylex.props(planner.hbtns)}>
            {user ? <AccountMenu user={user} /> : null}
          </div>
        </header>
        <div
          {...stylex.props(planner.surfacePending)}
          aria-busy={!error}
          role={error ? 'alert' : 'status'}
        >
          {!error && (
            <span {...stylex.props(planner.surfacePendingSpinner)} aria-hidden="true" />
          )}
          {message}
        </div>
      </div>
    );
  }

  const livePresence = Boolean(board.id) && !isOptimisticBoardId(board.id);

  const view = (presence) => (
    <div {...stylex.props(planner.app)} data-app-shell="planner">
      {showViewerBanner && (
        <div {...stylex.props(planner.banner)}>
          <span {...stylex.props(planner.bannerStrong)}>보기 전용</span>
          <span>이 시간표는 보기만 할 수 있어요</span>
        </div>
      )}

      <PlannerHeader
        board={board}
        printPrefs={runtime.print.prefs}
        presence={presence}
        views={runtime.views}
        theme={theme}
        onToggleTheme={toggleTheme}
        onPrint={runtime.print.open}
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
          isOptimistic ? null : <ShareAction board={board} user={user} isOwner={isOwner} />
        }
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
    </div>
  );

  if (!livePresence) return view(EMPTY_PRESENCE);

  const { user: presenceUser, role, guestLabel, settings } = runtime.presenceArgs;
  return (
    <BoardPresenceBridge
      boardId={board.id}
      user={presenceUser}
      role={role}
      guestLabel={guestLabel}
      settings={settings}
    >
      {view}
    </BoardPresenceBridge>
  );
}
