import { Button } from '@base-ui/react/button';
import { RefreshCw } from 'lucide-react';
import * as stylex from '@stylexjs/stylex';
import { useAppUpdate } from '../hooks/useAppUpdate.jsx';
import { colors } from '../styles/tokens.stylex.js';
import { ui } from '../styles/ui.js';

const MOBILE = '@media screen and (max-width: 720px)';

// Concentric: outer 16 = button 8 + padding 8.
const s = stylex.create({
  banner: {
    position: 'absolute',
    // Sit on the table’s top-right (pane has 12px side margin).
    top: '10px',
    right: '22px',
    left: 'auto',
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: 'max-content',
    maxWidth: 'min(360px, calc(100% - 36px))',
    padding: '8px 8px 8px 14px',
    borderRadius: '16px',
    backgroundColor: colors.glass,
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    // Layered shadows (product emptyHint language + a touch more lift over the grid).
    boxShadow: `0 0 0 1px ${colors.edge}, 0 4px 12px rgba(20, 20, 26, 0.10), 0 16px 32px -16px rgba(20, 20, 26, 0.28)`,
    color: colors.ink,
    pointerEvents: 'auto',
    [MOBILE]: {
      right: '10px',
      maxWidth: 'min(360px, calc(100% - 20px))',
    },
    '@media print': {
      display: 'none',
    },
    '@media (prefers-reduced-transparency: reduce)': {
      backgroundColor: colors.paper,
      WebkitBackdropFilter: 'none',
      backdropFilter: 'none',
    },
  },

  copy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    minWidth: 0,
    flex: '1 1 auto',
    paddingBlock: '2px',
  },

  title: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 650,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    textWrap: 'balance',
  },

  desc: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 550,
    color: colors.muted,
    lineHeight: 1.35,
    whiteSpace: 'nowrap',
    textWrap: 'pretty',
  },

  action: {
    flexShrink: 0,
    gap: '6px',
    borderRadius: '8px',
    paddingBlock: '7px',
    paddingInline: '11px',
    outline: 'none',
    ':focus-visible': {
      boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 3.5px ${colors.ink}`,
    },
  },

  actionIcon: {
    display: 'block',
    flexShrink: 0,
    // Lucide RefreshCw sits optically high next to Hangul — nudge down.
    transform: 'translateY(1.5px)',
  },
});

/**
 * Update card on the week table — refresh to apply; no dismiss chrome.
 */
export function RefreshBanner() {
  const { needRefresh, refresh } = useAppUpdate();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-ui-refresh-banner=""
      {...stylex.props(s.banner)}
    >
      <div {...stylex.props(s.copy)} data-ui-refresh-copy="">
        <p {...stylex.props(s.title)}>새 버전이 있어요</p>
        <p {...stylex.props(s.desc)}>새로고침하면 최신으로 업데이트돼요</p>
      </div>
      <Button
        type="button"
        data-ui-refresh-action=""
        {...stylex.props(ui.btn, ui.btnPrimary, s.action)}
        onClick={refresh}
      >
        <span {...stylex.props(s.actionIcon)} aria-hidden>
          <RefreshCw size={13} strokeWidth={2.25} />
        </span>
        새로고침
      </Button>
    </div>
  );
}
