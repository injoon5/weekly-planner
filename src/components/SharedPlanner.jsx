import * as stylex from '@stylexjs/stylex';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect } from 'react';
import { usePlannerRuntime } from '../hooks/usePlannerRuntime.js';
import { useSharedBoard } from '../hooks/useSharedBoard.js';
import { useTheme } from '../hooks/useTheme.js';
import { planner } from '../styles/planner.js';
import { ui } from '../styles/ui.js';
import { auth as authStyles } from '../styles/auth.js';
import { PrintDialog } from './PrintDialog.jsx';
import { PlannerHeader } from './PlannerHeader.jsx';
import { PlannerSurface } from './PlannerSurface.jsx';
import { toast } from './ui/Toaster.jsx';

export function SharedPlanner() {
  const { token } = useParams({ from: '/s/$token' });
  const shared = useSharedBoard(token);
  const { theme, toggleTheme } = useTheme(null, toast);
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
    onError: toast,
  });

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
    return <div {...stylex.props(planner.boot)}>불러오는 중…</div>;
  }
  if (shared.error) {
    return <div {...stylex.props(planner.boot)}>오류: {shared.error.message}</div>;
  }
  if (shared.state === 'notFound' || shared.state === 'disabled') {
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

      <PlannerHeader
        board={board}
        printPrefs={runtime.print.prefs}
        presence={runtime.presence}
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
        presence={runtime.presence}
        readOnly={readOnly}
        updateEvent={runtime.eventsApi.updateEvent}
        todayDow={runtime.clock.todayDow}
        nowMin={runtime.clock.nowMin}
        nowDay={runtime.clock.nowDay}
        printShowMemos={runtime.print.prefs.showMemos}
      />

      <PrintDialog {...runtime.print.dialog} />
    </div>
  );
}
