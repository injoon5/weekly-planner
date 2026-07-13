import { useEffect, useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import {
  Printer,
  Moon,
  Sun,
  MoreHorizontal,
  Eye,
  Share2,
} from 'lucide-react';
import { db } from '../db.js';
import { useBoardLifecycle } from '../hooks/useBoardLifecycle.js';
import { useBoardPresence } from '../hooks/useBoardPresence.js';
import { useEditorSession } from '../hooks/useEditorSession.js';
import { useEventMutations } from '../hooks/useEventMutations.js';
import { useMenu, menuPopStyle } from '../hooks/useMenu.js';
import { useShareActions } from '../hooks/useShareActions.js';
import { useTheme } from '../hooks/useTheme.js';
import { useToast } from '../hooks/useToast.js';
import { useViewControls } from '../hooks/useViewControls.js';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { fmtRange } from '../time.js';
import { planner } from '../styles/planner.js';
import { menus } from '../styles/menus.js';
import { BoardMenu } from './BoardMenu.jsx';
import { BoardTabs } from './BoardTabs.jsx';
import { MoreMenu, UserMenu } from './Menus.jsx';
import { PresenceAvatars } from './PresenceAvatars.jsx';
import { PlannerSurface, usePlannerClock } from './PlannerSurface.jsx';
import { SharePanel } from './SharePanel.jsx';
import { ViewControls } from './ViewControls.jsx';

export function Planner() {
  const { note, toast } = useToast();
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
  const { menu, openMenu, closeMenu } = useMenu();
  const { nowMin, nowDay, todayDow } = usePlannerClock();

  const eventsApi = useEventMutations({ board, canEdit });
  const lifecycle = useBoardLifecycle({
    user,
    boards,
    board,
    events,
    setActiveId,
    closeMenu,
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
          <span {...stylex.props(planner.prange)}>{fmtRange(board.from, board.to)}</span>
        )}

        <div {...stylex.props(planner.printMeta)}>
          <span>
            이름
            <i {...stylex.props(planner.printMetaBlank)} />
          </span>
          <span>
            기간
            {board.from || board.to ? (
              <b {...stylex.props(planner.printMetaVal)}>{fmtRange(board.from, board.to)}</b>
            ) : (
              <i {...stylex.props(planner.printMetaBlank)} />
            )}
          </span>
        </div>

        <BoardTabs
          boards={boards}
          activeId={board.id}
          canAdd={isOwner}
          onSelect={setActiveId}
          onOpenActive={(e) => openMenu('board', e)}
          onAdd={lifecycle.addBoard}
        />

        <div {...stylex.props(planner.hbtns)}>
          <PresenceAvatars peers={presence.peers} />
          <button
            {...stylex.props(planner.userchip)}
            type="button"
            title={user.email || '계정'}
            aria-label="계정 메뉴"
            onClick={(e) => openMenu('user', e, 'right')}
          >
            <span {...stylex.props(planner.chipText)}>{user.email || '계정'}</span>
          </button>
          <button
            {...stylex.props(planner.ibtn)}
            aria-label="보기 설정"
            onClick={(e) => openMenu('view', e, 'right', 264)}
          >
            <Eye size={15} strokeWidth={1.75} />
          </button>
          {(isOwner || myMembership) && (
            <button
              {...stylex.props(planner.ibtn)}
              aria-label="공유"
              onClick={(e) => openMenu('share', e, 'right', 264)}
            >
              <Share2 size={15} strokeWidth={1.75} />
            </button>
          )}
          <button
            {...stylex.props(planner.ibtn)}
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun size={15} strokeWidth={1.75} />
            ) : (
              <Moon size={15} strokeWidth={1.75} />
            )}
          </button>
          <button
            {...stylex.props(planner.ibtn)}
            aria-label="더보기"
            onClick={(e) => openMenu('more', e, 'right')}
          >
            <MoreHorizontal size={15} strokeWidth={1.75} />
          </button>
          <button
            {...stylex.props(planner.btn, planner.btnPlain)}
            onClick={() => window.print()}
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
        note={note}
        todayDow={todayDow}
        nowMin={nowMin}
        nowDay={nowDay}
      />

      {menu && (
        <>
          <div {...stylex.props(menus.mscrim)} onPointerDown={closeMenu} />
          <div {...stylex.props(menus.pop)} role="menu" style={menuPopStyle(menu)}>
            {menu.kind === 'board' ? (
              <BoardMenu
                board={board}
                solo={boards.length < 2}
                canEditMeta={isOwner}
                onCommit={lifecycle.commitBoard}
                onDup={lifecycle.duplicateBoard}
                onClear={lifecycle.clearBoard}
                onDelete={lifecycle.deleteBoard}
              />
            ) : menu.kind === 'user' ? (
              <UserMenu
                email={user.email}
                onSignOut={() => {
                  closeMenu();
                  db.auth.signOut();
                }}
              />
            ) : menu.kind === 'share' ? (
              <SharePanel
                board={board}
                isOwner={isOwner}
                user={user}
                refreshToken={auth.user?.refresh_token}
                myMembershipId={myMembership?.id}
                onEnableShare={share.enableShare}
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
            ) : menu.kind === 'view' ? (
              <ViewControls views={views} />
            ) : (
              <MoreMenu
                onExport={lifecycle.doExport}
                onImport={isOwner ? lifecycle.askImport : null}
              />
            )}
          </div>
        </>
      )}

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
