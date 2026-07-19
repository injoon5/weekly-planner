import { useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Link, useParams } from '@tanstack/react-router';
import { EMPTY_PRESENCE, usePlannerRuntime } from '../hooks/usePlannerRuntime.js';
import { usePlannerScrollLock } from '../hooks/usePlannerScrollLock.js';
import { useSharedBoard } from '../hooks/useSharedBoard.js';
import { useTheme } from '../hooks/useTheme.js';
import { planner } from '../styles/planner.js';
import { ui } from '../styles/ui.js';
import { auth as authStyles } from '../styles/auth.js';
import { BoardPresenceBridge } from './BoardPresenceBridge.jsx';
import { PrintDialog } from './PrintDialog.jsx';
import { PlannerHeader } from './PlannerHeader.jsx';
import { PlannerSurface } from './PlannerSurface.jsx';

/** Header-only shell with a busy status while share metadata / board load. */
function SharedShellPending() {
  return (
    <div {...stylex.props(planner.app)} data-app-shell="shared">
      <header {...stylex.props(planner.top)}>
        <h1 {...stylex.props(planner.h1)}>주간 계획표</h1>
      </header>
      <div {...stylex.props(planner.surfacePending)} aria-busy="true" role="status">
        <span {...stylex.props(planner.surfacePendingSpinner)} aria-hidden="true" />
        불러오는 중…
      </div>
    </div>
  );
}

export function SharedPlanner() {
  const { token } = useParams({ from: '/s/$token' });
  const shared = useSharedBoard(token);
  const { theme, toggleTheme } = useTheme(null);
  const runtime = usePlannerRuntime({
    board: shared.board,
    events: shared.events,
    canEdit: shared.canEdit,
    ruleParams: shared.ruleParams,
    boardPrefs: null,
    user: null,
    canRenameColors: false,
    storageKey: token,
    role: shared.role,
    guestLabel: shared.canEdit ? '공유 편집' : '공유 보기',
  });

  usePlannerScrollLock();

  useEffect(() => {
    const name = shared.board?.name?.trim();
    if (!name) return undefined;
    const prev = document.title;
    document.title = `${name} · 주간 계획표`;
    return () => {
      document.title = prev;
    };
  }, [shared.board?.name]);

  if (shared.isLoading) {
    return <SharedShellPending />;
  }
  if (shared.error) {
    return (
      <div {...stylex.props(planner.boot)} role="alert">
        오류: {shared.error.message}
      </div>
    );
  }
  if (shared.state === 'notFound' || shared.state === 'disabled') {
    return (
      <div {...stylex.props(planner.boot)}>
        <div {...stylex.props(planner.bootStack)}>
          <div>공유 링크를 찾을 수 없어요</div>
          <Link to="/login" {...stylex.props(planner.btn, ui.btnPlain)}>
            로그인
          </Link>
        </div>
      </div>
    );
  }

  if (shared.state === 'passwordRequired' || shared.state === 'unlockFailed') {
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
    return <SharedShellPending />;
  }

  const board = shared.board;
  const readOnly = shared.readOnly;

  const view = (presence) => (
    <div {...stylex.props(planner.app)} data-app-shell="planner">
      <div {...stylex.props(planner.banner)}>
        <span {...stylex.props(planner.bannerStrong)}>
          {readOnly ? '보기 전용' : '공유 편집'}
        </span>
        <span>{board.name || '시간표'}</span>
      </div>

      <PlannerHeader
        board={board}
        printPrefs={runtime.print.prefs}
        presence={presence}
        views={runtime.views}
        theme={theme}
        onToggleTheme={toggleTheme}
        onPrint={runtime.print.open}
      />

      <PlannerSurface
        boardId={board.id}
        events={shared.events}
        session={runtime.session}
        views={runtime.views}
        presence={presence}
        readOnly={readOnly}
        updateEvent={runtime.eventsApi.updateEvent}
        printShowMemos={runtime.print.prefs.showMemos}
      />

      <PrintDialog {...runtime.print.dialog} />
    </div>
  );

  if (!board.id) return view(EMPTY_PRESENCE);

  const { user, role, guestLabel, settings } = runtime.presenceArgs;
  return (
    <BoardPresenceBridge
      boardId={board.id}
      user={user}
      role={role}
      guestLabel={guestLabel}
      settings={settings}
    >
      {view}
    </BoardPresenceBridge>
  );
}
