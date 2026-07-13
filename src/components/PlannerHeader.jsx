import * as stylex from '@stylexjs/stylex';
import { Eye, Moon, Printer, Sun } from 'lucide-react';
import { fmtRange, fmtRepeat } from '../time.js';
import { planner } from '../styles/planner.js';
import { PresenceAvatars } from './PresenceAvatars.jsx';
import { PrintMeta } from './PrintMeta.jsx';
import { ViewControls } from './ViewControls.jsx';
import { IconSwap } from './ui/IconSwap.jsx';
import { MenuPopover } from './ui/MenuPopover.jsx';

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
  afterViewActions,
  afterThemeActions,
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

        {afterThemeActions}

        <button
          {...stylex.props(planner.btn, planner.btnPlain)}
          type="button"
          aria-label="인쇄"
          onClick={onPrint}
        >
          <Printer size={14} strokeWidth={1.75} />
          <span {...stylex.props(planner.btnLabelHide)}>인쇄</span>
        </button>
      </div>
    </header>
  );
}
