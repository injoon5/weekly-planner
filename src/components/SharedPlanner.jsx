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
import { LoadingStatus } from './ui/LoadingStatus.jsx';
import { t } from '../strings.js';

/** Header-only shell with a busy status while share metadata / board load. */
function SharedShellPending() {
  return (
    <div {...stylex.props(planner.app)} data-app-shell="shared">
      <header {...stylex.props(planner.top)}>
        <h1 {...stylex.props(planner.h1)}>{t.app.name}</h1>
      </header>
      <LoadingStatus>{t.common.loading}</LoadingStatus>
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
    guestLabel: shared.canEdit ? t.share.sharedEditor : t.share.sharedViewer,
  });

  usePlannerScrollLock();

  useEffect(() => {
    const name = shared.board?.name?.trim();
    if (!name) return undefined;
    const prev = document.title;
    document.title = t.share.docTitle(name);
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
        {t.common.errorPrefix(shared.error.message)}
      </div>
    );
  }
  if (shared.state === 'notFound' || shared.state === 'disabled') {
    return (
      <div {...stylex.props(planner.boot)}>
        <div {...stylex.props(planner.bootStack)}>
          <div>{t.share.notFound}</div>
          <Link to="/login" {...stylex.props(planner.btn, ui.btnPlain)}>
            {t.common.login}
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
          <h1 {...stylex.props(authStyles.title)}>{t.auth.passwordTitle}</h1>
          <p {...stylex.props(authStyles.copy)}>{t.auth.passwordProtected}</p>
          <input
            {...stylex.props(ui.input)}
            type="password"
            autoFocus
            value={shared.password}
            onChange={(e) => shared.setPassword(e.target.value)}
            placeholder={t.auth.password}
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
            {shared.busy ? t.common.checking : t.common.open}
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
          {readOnly ? t.share.viewerOnly : t.share.sharedEditor}
        </span>
        <span>{board.name || t.app.board}</span>
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
