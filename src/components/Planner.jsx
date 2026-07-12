import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import {
  Plus,
  Printer,
  ChevronDown,
  Moon,
  Sun,
  MoreHorizontal,
} from 'lucide-react';
import { db } from '../db.js';
import { useBoardActions } from '../hooks/useBoardActions.js';
import { useEditorSession } from '../hooks/useEditorSession.js';
import { useMenu } from '../hooks/useMenu.js';
import { useTheme } from '../hooks/useTheme.js';
import { useToast } from '../hooks/useToast.js';
import { useWorkspace } from '../hooks/useWorkspace.js';
import { pickLeastUsedColor } from '../models.js';
import { fmtRange, nowOnGrid } from '../time.js';
import { planner } from '../styles/planner.js';
import { menus } from '../styles/menus.js';
import { BoardMenu } from './BoardMenu.jsx';
import { Editor } from './Editor.jsx';
import { MoreMenu, UserMenu } from './Menus.jsx';
import { WeekGrid } from './WeekGrid.jsx';

export function Planner() {
  const { note, toast } = useToast();
  const {
    user,
    boards,
    board,
    events,
    settings,
    setActiveId,
    isLoading,
    error,
    ready,
    bootNote,
    clearBootNote,
  } = useWorkspace();

  const { theme, toggleTheme } = useTheme(settings);
  const { menu, openMenu, closeMenu } = useMenu();

  const actions = useBoardActions({
    user,
    boards,
    board,
    events,
    setActiveId,
    closeMenu,
    toast,
  });

  const session = useEditorSession({
    events,
    createEvent: actions.createEvent,
    removeEvent: actions.removeEvent,
  });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!bootNote) return;
    toast(bootNote);
    clearBootNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot boot toast
  }, [bootNote]);

  const { nowMin, nowDay, todayDow } = nowOnGrid(new Date(now));

  const onGestureResult = (result) => {
    switch (result.type) {
      case 'open-create':
        session.openCreate(result.draft);
        break;
      case 'open-edit':
        session.openEdit(result.id);
        break;
      case 'patch':
        actions.updateEvent(result.id, result.patch);
        break;
      case 'noop':
        break;
      default: {
        const _exhaustive = result.type;
        void _exhaustive;
        break;
      }
    }
  };

  const addNew = () => {
    session.openCreate({
      day: todayDow,
      start: 720,
      dur: 60,
      title: '',
      color: pickLeastUsedColor(events),
      memo: '',
    });
  };

  if (isLoading || (!ready && !boards.length)) {
    return <div {...stylex.props(planner.boot)}>불러오는 중…</div>;
  }
  if (error) return <div {...stylex.props(planner.boot)}>오류: {error.message}</div>;
  if (!board) return <div {...stylex.props(planner.boot)}>시간표를 준비하는 중…</div>;

  return (
    <div {...stylex.props(planner.app)}>
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

        <nav {...stylex.props(planner.tabs)} aria-label="시간표 목록">
          {boards.map((b) => (
            <button
              key={b.id}
              {...stylex.props(planner.tab, b.id === board.id && planner.tabOn)}
              data-active-tab={b.id === board.id ? 'true' : undefined}
              aria-current={b.id === board.id ? 'true' : 'false'}
              title={b.id === board.id ? '시간표 설정' : b.name}
              onClick={(e) =>
                b.id === board.id ? openMenu('board', e) : setActiveId(b.id)
              }
            >
              <span {...stylex.props(planner.tabName)}>{b.name || '시간표'}</span>
              {b.id === board.id && <ChevronDown size={11} strokeWidth={2} />}
            </button>
          ))}
          <button
            {...stylex.props(planner.tadd)}
            aria-label="새 시간표 추가"
            onClick={actions.addBoard}
          >
            <Plus size={13} strokeWidth={2} />
          </button>
        </nav>

        <div {...stylex.props(planner.hbtns)}>
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
          <button {...stylex.props(planner.btn, planner.btnPrimary)} onClick={addNew}>
            <Plus size={14} strokeWidth={2} />새 일정
          </button>
        </div>
      </header>

      <WeekGrid
        boardId={board.id}
        events={events}
        todayDow={todayDow}
        nowMin={nowMin}
        nowDay={nowDay}
        editing={session.editing}
        onOpenEdit={session.openEdit}
        onGestureResult={onGestureResult}
        gestureBlocked={Boolean(session.editing)}
      />

      {menu && (
        <>
          <div {...stylex.props(menus.mscrim)} onPointerDown={closeMenu} />
          <div
            {...stylex.props(menus.pop)}
            role="menu"
            style={{ left: `${menu.x}px`, top: `${menu.y}px` }}
          >
            {menu.kind === 'board' ? (
              <BoardMenu
                board={board}
                solo={boards.length < 2}
                onCommit={actions.commitBoard}
                onDup={actions.duplicateBoard}
                onClear={actions.clearBoard}
                onDelete={actions.deleteBoard}
              />
            ) : menu.kind === 'user' ? (
              <UserMenu
                email={user.email}
                onSignOut={() => {
                  closeMenu();
                  db.auth.signOut();
                }}
              />
            ) : (
              <MoreMenu onExport={actions.doExport} onImport={actions.askImport} />
            )}
          </div>
        </>
      )}

      {note && (
        <div key={note.key} {...stylex.props(menus.toast)} role="status">
          {note.msg}
        </div>
      )}

      <input
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        ref={actions.fileRef}
        onChange={actions.onImportFile}
      />

      {session.editing && (
        <Editor
          key={session.editing.mode + ':' + (session.editing.id || 'new')}
          draft={session.editing.draft}
          isNew={session.editing.mode === 'create'}
          closing={session.editing.closing}
          onSave={session.save}
          onCancel={session.cancel}
          onDelete={session.deleteEvent}
        />
      )}
    </div>
  );
}
