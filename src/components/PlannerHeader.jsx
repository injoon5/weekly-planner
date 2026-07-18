import { Popover } from '@base-ui/react/popover';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Moon, MoreHorizontal, Printer, Sun } from 'lucide-react';
import { fmtRange, fmtRepeat } from '../lib/time.js';
import { menus } from '../styles/menus.js';
import { planner } from '../styles/planner.js';
import { PresenceAvatars } from './PresenceAvatars.jsx';
import { PrintMeta } from './PrintMeta.jsx';
import { ViewControls } from './ViewControls.jsx';
import { IconSwap } from './ui/IconSwap.jsx';
import { MenuPopover } from './ui/MenuPopover.jsx';

/**
 * Planner top chrome. Primary cluster: presence, account, todos, share, theme.
 * Views + print + import/export live in the ⋯ menu.
 */
export function PlannerHeader({
  board,
  printPrefs,
  presence,
  views,
  theme,
  onToggleTheme,
  onPrint,
  navigation,
  leadingActions,
  todosAction,
  afterViewActions,
  moreMenuItems,
}) {
  return (
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
      {navigation}

      <div {...stylex.props(planner.hbtns)}>
        <PresenceAvatars peers={presence.peers} />
        {leadingActions}
        {todosAction}
        {afterViewActions}

        <button
          {...stylex.props(planner.ibtn)}
          type="button"
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          onClick={onToggleTheme}
        >
          <IconSwap
            active={theme === 'dark'}
            activeIcon={<Sun size={15} strokeWidth={1.75} />}
            inactiveIcon={<Moon size={15} strokeWidth={1.75} />}
          />
        </button>

        <MenuPopover
          width={264}
          trigger={
            <button {...stylex.props(planner.ibtn)} type="button" aria-label="더보기">
              <MoreHorizontal size={15} strokeWidth={1.75} />
            </button>
          }
        >
          <ViewControls views={views} />
          {onPrint ? (
            <>
              <Separator {...stylex.props(menus.mdiv)} />
              <Popover.Close
                render={<button {...stylex.props(menus.mi)} onClick={onPrint} />}
              >
                <span {...stylex.props(menus.miIconWrap)}>
                  <Printer size={14} strokeWidth={1.75} />
                </span>
                <span {...stylex.props(menus.miLabel)}>인쇄</span>
              </Popover.Close>
            </>
          ) : null}
          {moreMenuItems && <Separator {...stylex.props(menus.mdiv)} />}
          {moreMenuItems}
        </MenuPopover>
      </div>
    </header>
  );
}
