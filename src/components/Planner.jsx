import { useEffect, useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import {
  Printer,
  Moon,
  Sun,
  MoreHorizontal,
  CircleUserRound,
  Eye,
  Share2,
} from 'lucide-react';
import { db } from '../db.js';
import { useBoardLifecycle } from '../hooks/useBoardLifecycle.js';
import { useBoardPresence } from '../hooks/useBoardPresence.js';
import { useEditorSession } from '../hooks/useEditorSession.js';
import { useEventMutations } from '../hooks/useEventMutations.js';
import { useShareActions } from '../hooks/useShareActions.js';
import { useTheme } from '../hooks/useTheme.js';
import { useViewControls } from '../hooks/useViewControls.js';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { defaultPrintPrefs, readPrintPrefs } from '../print-prefs.js';
import { fmtRange, fmtRepeat } from '../time.js';
import { planner } from '../styles/planner.js';
import { BoardMenu } from './BoardMenu.jsx';
import { BoardTabs } from './BoardTabs.jsx';
import { MoreMenu, UserMenu } from './Menus.jsx';
import { PresenceAvatars } from './PresenceAvatars.jsx';
import { PrintDialog } from './PrintDialog.jsx';
import { PrintMeta } from './PrintMeta.jsx';
import { PlannerSurface, usePlannerClock } from './PlannerSurface.jsx';
import { SharePanel } from './SharePanel.jsx';
import { ViewControls } from './ViewControls.jsx';
import { IconSwap } from './ui/IconSwap.jsx';
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
  const { theme, toggleTheme } = useTheme(settings);
  const { nowMin, nowDay, todayDow } = usePlannerClock();

  // Board menu is anchored to the active tab inside BoardTabs, so it runs as a
  // controlled popover instead of a trigger-based one.
  const [boardMenuAnchor, setBoardMenuAnchor] = useState(null);
  const closeBoardMenu = () => setBoardMenuAnchor(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [printPrefs, setPrintPrefs] = useState(() => readPrintPrefs(null));

  const eventsApi = useEventMutations({ board, canEdit });
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
  const share = useShareActions({ board, isOwner, toast });

  const session = useEditorSession({
    events,
    createEvent: eventsApi.createEvent,
    removeEvent: eventsApi.removeEvent,
  });

  const views = useViewControls({
    board,
    boardPrefs,
    user,
    canRenameColors: isOwner,
  });

  const presence = useBoardPresence({
    boardId: board?.id,
    user,
    role: myRole,
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

  useEffect(() => {
    if (!board) return;
    const stored = readPrintPrefs(board);
    setPrintPrefs({
      ...defaultPrintPrefs(board),
      ...stored,
      from: board.from || '',
      to: board.to || '',
    });
  }, [board?.id, board?.from, board?.to]);

  const readOnly = !canEdit;

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

      <header {...stylex.props(planner.top)}>
        <h1 {...stylex.props(planner.h1)}>
          주간 계획표
          <span {...stylex.props(planner.pbname)}> · {board.name || '시간표'}</span>
        </h1>

        {(board.from || board.to) && (
          <span {...stylex.props(planner.prange)}>
            {fmtRange(board.from, board.to)}
            {board.repeatEvery > 0 && ' · ' + fmtRepeat(board.repeatEvery)}
          </span>
        )}

        <PrintMeta prefs={printPrefs} />

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

        <div {...stylex.props(planner.hbtns)}>
          <PresenceAvatars peers={presence.peers} />

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

          <MenuPopover
            width={264}
            trigger={
              <button {...stylex.props(planner.ibtn)} type="button" aria-label="보기 설정">
                <Eye size={15} strokeWidth={1.75} />
              </button>
            }
          >
            <ViewControls views={views} />
          </MenuPopover>

          {(isOwner || myMembership) && (
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
                onEnableShare={share.enableShare}
                onUpdateShare={share.updateShare}
                onDisableShare={share.disableShare}
                onRotateShare={async () => {
                  const url = await share.rotateShare();
                  if (url) {
                    try {
                      await navigator.clipboard.writeText(url);
                    } catch {
                      /* ignore */
                    }
                  }
                }}
                onCopyLink={share.copyShareLink}
                onInvite={share.inviteMember}
                onUpdateRole={share.updateMemberRole}
                onRemoveMember={share.removeMember}
                onLeave={share.leaveBoard}
              />
            </MenuPopover>
          )}

          <button
            {...stylex.props(planner.ibtn)}
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            onClick={toggleTheme}
          >
            <IconSwap
              active={theme === 'dark'}
              activeIcon={<Sun size={15} strokeWidth={1.75} />}
              inactiveIcon={<Moon size={15} strokeWidth={1.75} />}
            />
          </button>

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

          <button
            {...stylex.props(planner.btn, planner.btnPlain)}
            type="button"
            aria-label="인쇄"
            onClick={() => setPrintOpen(true)}
          >
            <Printer size={14} strokeWidth={1.75} />
            <span {...stylex.props(planner.btnLabelHide)}>인쇄</span>
          </button>
        </div>
      </header>

      <PlannerSurface
        boardId={board.id}
        events={events}
        session={session}
        views={views}
        presence={presence}
        readOnly={readOnly}
        swapping={swapping}
        updateEvent={eventsApi.updateEvent}
        todayDow={todayDow}
        nowMin={nowMin}
        nowDay={nowDay}
      />

      <PrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        board={board}
        onPrintPrefs={setPrintPrefs}
      />

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
