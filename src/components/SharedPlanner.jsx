import * as stylex from '@stylexjs/stylex';
import { Link, useParams } from '@tanstack/react-router';
import { Moon, Printer, Sun, Eye } from 'lucide-react';
import { useBoardPresence } from '../hooks/useBoardPresence.js';
import { useEditorSession } from '../hooks/useEditorSession.js';
import { useEventMutations } from '../hooks/useEventMutations.js';
import { useMenu, menuPopStyle } from '../hooks/useMenu.js';
import { useSharedBoard } from '../hooks/useSharedBoard.js';
import { useTheme } from '../hooks/useTheme.js';
import { useToast } from '../hooks/useToast.js';
import { useViewControls } from '../hooks/useViewControls.js';
import { fmtRange, fmtRepeat } from '../time.js';
import { planner } from '../styles/planner.js';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';
import { auth as authStyles } from '../styles/auth.js';
import { PresenceAvatars } from './PresenceAvatars.jsx';
import { PlannerSurface, usePlannerClock } from './PlannerSurface.jsx';
import { ViewControls } from './ViewControls.jsx';

export function SharedPlanner() {
  const { token } = useParams({ from: '/s/$token' });
  const shared = useSharedBoard(token);
  const { note } = useToast();
  const { theme, toggleTheme } = useTheme(null);
  const { menu, openMenu, closeMenu } = useMenu();
  const { nowMin, nowDay, todayDow } = usePlannerClock();

  const eventsApi = useEventMutations({
    board: shared.board,
    canEdit: shared.canEdit,
    ruleParams: shared.ruleParams,
  });

  const session = useEditorSession({
    events: shared.events,
    createEvent: eventsApi.createEvent,
    removeEvent: eventsApi.removeEvent,
    ruleParams: shared.ruleParams,
  });

  const views = useViewControls({
    board: shared.board,
    boardPrefs: null,
    user: null,
    canRenameColors: false,
    storageKey: token,
  });

  const presence = useBoardPresence({
    boardId: shared.board?.id,
    user: null,
    role: shared.role,
    guestLabel: shared.canEdit ? '공유 편집' : '공유 보기',
  });

  if (shared.isLoading) {
    return <div {...stylex.props(planner.boot)}>불러오는 중…</div>;
  }
  if (shared.error) {
    return <div {...stylex.props(planner.boot)}>오류: {shared.error.message}</div>;
  }
  if (shared.notFound || shared.disabled) {
    return (
      <div {...stylex.props(planner.boot)}>
        <div {...stylex.props(planner.bootStack)}>
          <div>공유 링크를 찾을 수 없어요</div>
          <Link to="/login" {...stylex.props(planner.btn, planner.btnPlain)}>
            로그인
          </Link>
        </div>
      </div>
    );
  }

  if (shared.needsPassword) {
    return (
      <div {...stylex.props(authStyles.root)}>
        <form
          {...stylex.props(authStyles.card, authStyles.form)}
          onSubmit={(e) => {
            e.preventDefault();
            shared.tryPassword();
          }}
        >
          <h1 {...stylex.props(authStyles.title)}>비밀번호</h1>
          <p {...stylex.props(authStyles.copy)}>이 시간표는 비밀번호로 보호되어 있어요</p>
          <input
            {...stylex.props(ui.input)}
            type="password"
            autoFocus
            value={shared.password}
            onChange={(e) => shared.setPassword(e.target.value)}
            placeholder="비밀번호"
          />
          {shared.unlockError && (
            <div {...stylex.props(authStyles.err)} role="alert">
              {shared.unlockError}
            </div>
          )}
          <button
            type="submit"
            {...stylex.props(ui.btn, ui.btnPrimary, authStyles.formPrimary)}
            disabled={shared.busy || !shared.password}
          >
            {shared.busy ? '확인 중…' : '열기'}
          </button>
        </form>
      </div>
    );
  }

  if (!shared.board) {
    return <div {...stylex.props(planner.boot)}>불러오는 중…</div>;
  }

  const board = shared.board;
  const readOnly = shared.readOnly;

  return (
    <div {...stylex.props(planner.app)}>
      <div {...stylex.props(planner.banner)}>
        <span {...stylex.props(planner.bannerStrong)}>
          {readOnly ? '보기 전용' : '공유 편집'}
        </span>
        <span>{board.name || '시간표'}</span>
      </div>

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
        <div {...stylex.props(planner.hbtns)}>
          <PresenceAvatars peers={presence.peers} />
          <button
            {...stylex.props(planner.ibtn)}
            aria-label="보기 설정"
            onClick={(e) => openMenu('view', e, 'right', 264)}
          >
            <Eye size={15} strokeWidth={1.75} />
          </button>
          <button
            {...stylex.props(planner.ibtn)}
            aria-label={theme === 'dark' ? '라이트 모드' : '다크 모드'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={15} strokeWidth={1.75} /> : <Moon size={15} strokeWidth={1.75} />}
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
        events={shared.events}
        session={session}
        views={views}
        presence={presence}
        readOnly={readOnly}
        updateEvent={eventsApi.updateEvent}
        note={note}
        todayDow={todayDow}
        nowMin={nowMin}
        nowDay={nowDay}
      />

      {menu?.kind === 'view' && (
        <>
          <div {...stylex.props(menus.mscrim)} onPointerDown={closeMenu} />
          <div {...stylex.props(menus.pop)} role="menu" style={menuPopStyle(menu)}>
            <ViewControls views={views} />
          </div>
        </>
      )}
    </div>
  );
}
