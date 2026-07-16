import { useEffect, useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { MoreHorizontal, CircleUserRound, Share2 } from 'lucide-react';
import { db } from '../db.js';
import { useBoardLifecycle } from '../hooks/useBoardLifecycle.js';
import { usePlannerRuntime } from '../hooks/usePlannerRuntime.js';
import { useTheme } from '../hooks/useTheme.js';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { planner } from '../styles/planner.js';
import { BoardMenu } from './BoardMenu.jsx';
import { BoardTabs } from './BoardTabs.jsx';
import { MoreMenu, UserMenu } from './Menus.jsx';
import { PrintDialog } from './PrintDialog.jsx';
import { PlannerHeader } from './PlannerHeader.jsx';
import { PlannerSurface } from './PlannerSurface.jsx';
import { SharePanel } from './SharePanel.jsx';
import { MenuPopover } from './ui/MenuPopover.jsx';
import { toast } from './ui/Toaster.jsx';

export function Planner() {
  const {
    user,
    boards,
    board,
    events,
    settings,
    boardPrefs,
    myRole,
    canEdit,
    isOwner,
    setActiveId,
    isLoading,
    error,
    ready,
    bootNote,
    clearBootNote,
  } = useWorkspace();

  const auth = db.useAuth();
  const { theme, toggleTheme } = useTheme(settings, toast);

  // Board menu is anchored to the active tab inside BoardTabs, so it runs as a
  // controlled popover instead of a trigger-based one.
  const [boardMenuAnchor, setBoardMenuAnchor] = useState(null);
  const closeBoardMenu = () => setBoardMenuAnchor(null);

  const lifecycle = useBoardLifecycle({
    user,
    boards,
    board,
    events,
    setActiveId,
    closeMenu: closeBoardMenu,
    toast,
    isOwner,
  });
  const runtime = usePlannerRuntime({
    board,
    events,
    boardPrefs,
    user,
    canRenameColors: isOwner,
    role: myRole,
    canEdit,
    onError: toast,
  });

  const [swapping, setSwapping] = useState(false);
  const [swapBoardId, setSwapBoardId] = useState(board?.id);

  useEffect(() => {
    if (!bootNote) return;
    toast(bootNote);
    clearBootNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot boot toast
  }, [bootNote]);

  useEffect(() => {
    if (!board?.id || board.id === swapBoardId) return;
    setSwapping(true);
    const t = setTimeout(() => {
      setSwapBoardId(board.id);
      setSwapping(false);
    }, 140);
    return () => clearTimeout(t);
  }, [board?.id, swapBoardId]);

  const myMembership = useMemo(() => {
    if (!board || !user) return null;
    return (board.members || []).find((m) => (m.user?.id || m.user) === user.id) || null;
  }, [board, user]);

  if (isLoading || (!ready && !boards.length)) {
    return <div {...stylex.props(planner.boot)}>불러오는 중…</div>;
  }
  if (error) return <div {...stylex.props(planner.boot)}>오류: {error.message}</div>;
  if (!board) return <div {...stylex.props(planner.boot)}>시간표를 준비하는 중…</div>;

  return (
    <div {...stylex.props(planner.app)}>
      {myRole === 'viewer' && !isOwner && (
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
          <>
            <BoardTabs
              boards={boards}
              activeId={board.id}
              canAdd={isOwner}
              onSelect={setActiveId}
              onOpenActive={(e) => setBoardMenuAnchor(e.currentTarget)}
              onAdd={lifecycle.addBoard}
            />
            <MenuPopover
              open={Boolean(boardMenuAnchor)}
              onOpenChange={(open) => {
                if (!open) closeBoardMenu();
              }}
              anchor={boardMenuAnchor}
              align="start"
            >
              <BoardMenu
                board={board}
                solo={boards.length < 2}
                canEditMeta={isOwner}
                onCommit={lifecycle.commitBoard}
                onDup={lifecycle.duplicateBoard}
                onClear={lifecycle.clearBoard}
                onDelete={lifecycle.deleteBoard}
              />
            </MenuPopover>
          </>
        }
        leadingActions={
          <MenuPopover
            trigger={
              <button
                {...stylex.props(planner.ibtn)}
                type="button"
                title={user.email || '계정'}
                aria-label="계정 메뉴"
              >
                <CircleUserRound size={15} strokeWidth={1.75} />
              </button>
            }
          >
            <UserMenu email={user.email} onSignOut={() => db.auth.signOut()} />
          </MenuPopover>
        }
        afterViewActions={
          (isOwner || myMembership) && (
            <MenuPopover
              width={264}
              trigger={
                <button {...stylex.props(planner.ibtn)} type="button" aria-label="공유">
                  <Share2 size={15} strokeWidth={1.75} />
                </button>
              }
            >
              <SharePanel
                board={board}
                isOwner={isOwner}
                user={user}
                refreshToken={auth.user?.refresh_token}
                myMembershipId={myMembership?.id}
              />
            </MenuPopover>
          )
        }
        afterThemeActions={
          <MenuPopover
            trigger={
              <button {...stylex.props(planner.ibtn)} type="button" aria-label="더보기">
                <MoreHorizontal size={15} strokeWidth={1.75} />
              </button>
            }
          >
            <MoreMenu
              onExport={lifecycle.doExport}
              onImport={isOwner ? lifecycle.askImport : null}
            />
          </MenuPopover>
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
        updateEvent={runtime.eventsApi.updateEvent}
        todayDow={runtime.clock.todayDow}
        nowMin={runtime.clock.nowMin}
        nowDay={runtime.clock.nowDay}
        printShowMemos={runtime.print.prefs.showMemos}
      />

      <PrintDialog {...runtime.print.dialog} />

      <input
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        ref={lifecycle.fileRef}
        onChange={lifecycle.onImportFile}
      />
    </div>
  );
}
