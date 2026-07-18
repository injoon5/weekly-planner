import { useEffect } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EMPTY_PRESENCE } from '../hooks/usePlannerRuntime.js';
import { planner } from '../styles/planner.js';
import { BoardPresenceBridge } from './BoardPresenceBridge.jsx';

export const PLANNER_SCROLL_LOCK = 'planner-scroll-lock';

/** Locks document scroll while any planner shell is mounted. */
export function usePlannerScrollLock() {
  useEffect(() => {
    document.documentElement.classList.add(PLANNER_SCROLL_LOCK);
    return () => document.documentElement.classList.remove(PLANNER_SCROLL_LOCK);
  }, []);
}

/**
 * Shared loading / error chrome for signed-in and share shells.
 * @param {{
 *   shell?: string,
 *   title?: string,
 *   message: string,
 *   error?: boolean,
 *   trailing?: import('react').ReactNode,
 * }} props
 */
export function PlannerStatusShell({
  shell = 'planner',
  title = '주간 계획표',
  message,
  error = false,
  trailing = null,
}) {
  return (
    <div {...stylex.props(planner.app)} data-app-shell={shell}>
      <header {...stylex.props(planner.top)}>
        <h1 {...stylex.props(planner.h1)}>{title}</h1>
        {trailing ? <div {...stylex.props(planner.hbtns)}>{trailing}</div> : null}
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

/**
 * Ready-state chrome: optional banner, header, surface, dialogs.
 * Presence bridge mounts only when `presenceBoardId` is a live Instant id.
 *
 * @param {{
 *   presenceBoardId?: string | null,
 *   presenceArgs?: { user: unknown, role: unknown, guestLabel: unknown, settings: unknown } | null,
 *   banner?: import('react').ReactNode,
 *   children: (presence: typeof EMPTY_PRESENCE) => import('react').ReactNode,
 * }} props
 */
export function PlannerReadyChrome({ presenceBoardId, presenceArgs, banner, children }) {
  const view = (presence) => (
    <div {...stylex.props(planner.app)} data-app-shell="planner">
      {banner}
      {children(presence)}
    </div>
  );

  if (!presenceBoardId || !presenceArgs) return view(EMPTY_PRESENCE);

  return (
    <BoardPresenceBridge
      boardId={presenceBoardId}
      user={presenceArgs.user}
      role={presenceArgs.role}
      guestLabel={presenceArgs.guestLabel}
      settings={presenceArgs.settings}
    >
      {view}
    </BoardPresenceBridge>
  );
}
