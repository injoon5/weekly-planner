import * as stylex from '@stylexjs/stylex';
import { planner } from '../styles/planner.js';
import { PlannerProvider } from '../planner/PlannerProvider.jsx';
import { usePlannerContext } from '../planner/usePlannerContext.js';
import { AccountMenu } from './AccountMenu.jsx';
import { BoardNav } from './BoardNav.jsx';
import { MoreMenu } from './MoreMenu.jsx';
import { PlannerHeader } from './PlannerHeader.jsx';
import { PlannerSurface } from './PlannerSurface.jsx';
import { PrintDialog } from './PrintDialog.jsx';
import { ShareAction } from './ShareAction.jsx';
import { TodosAction } from './TodosAction.jsx';

/**
 * Signed-in workspace shell: loads the workspace, then wires header clusters
 * (BoardNav / AccountMenu / TodosAction / ShareAction) around the shared
 * planner surface. The shared-link shell lives in SharedPlanner.jsx.
 */
export function Planner() {
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
    ready,
    theme,
    toggleTheme,
    runtime,
    transfer,
    swapping,
  } = usePlannerContext();

  // Cold empty workspace only — keep chrome once a list board exists.
  if (isLoading || (!ready && !boards.length)) {
    return <div {...stylex.props(planner.boot)}>불러오는 중…</div>;
  }
  if (error) return <div {...stylex.props(planner.boot)}>오류: {error.message}</div>;
  if (!board) return <div {...stylex.props(planner.boot)}>시간표를 준비하는 중…</div>;

  return (
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
        presence={runtime.presence}
        views={runtime.views}
        theme={theme}
        onToggleTheme={toggleTheme}
        onPrint={runtime.print.open}
        navigation={
          <BoardNav
            user={user}
            boards={boards}
            board={board}
            events={events}
            isOwner={isOwner}
            onSelect={setActiveId}
          />
        }
        leadingActions={<AccountMenu user={user} />}
        todosAction={<TodosAction user={user} events={events} />}
        afterViewActions={<ShareAction board={board} user={user} isOwner={isOwner} />}
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
        presence={runtime.presence}
        readOnly={runtime.readOnly}
        swapping={swapping}
        surfacePending={surfacePending}
        updateEvent={runtime.eventsApi.updateEvent}
        nowMin={runtime.clock.nowMin}
        nowDay={runtime.clock.nowDay}
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
}
