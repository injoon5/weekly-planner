import { RefreshCw } from 'lucide-react';
import * as stylex from '@stylexjs/stylex';
import { useAppUpdate } from '../hooks/useAppUpdate.js';
import { colors } from '../styles/tokens.stylex.js';
import { ui } from '../styles/ui.js';
import { t } from '../strings.js';

const MOBILE = '@media screen and (max-width: 720px)';

// Concentric: outer = button radius + padding.
// Desktop: 12 + 12 = 24. Mobile: 10 + 10 = 20.
const s = stylex.create({
  banner: {
    position: 'absolute',
    // Top-right of the week table card.
    top: '12px',
    right: '12px',
    left: 'auto',
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: 'max-content',
    maxWidth: 'min(440px, calc(100% - 24px))',
    padding: '12px 12px 12px 18px',
    borderRadius: '24px',
    backgroundColor: colors.glass,
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    // Layered shadows (product emptyHint language + a touch more lift over the grid).
    boxShadow: `0 0 0 1px ${colors.edge}, 0 4px 12px rgba(20, 20, 26, 0.10), 0 16px 32px -16px rgba(20, 20, 26, 0.28)`,
    color: colors.ink,
    pointerEvents: 'auto',
    [MOBILE]: {
      // Tighter inset + softer scale so it doesn't eat the sticky day header.
      top: '8px',
      right: '8px',
      gap: '10px',
      maxWidth: 'calc(100% - 16px)',
      padding: '10px 10px 10px 14px',
      borderRadius: '20px',
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
    gap: '2px',
    minWidth: 0,
    flex: '1 1 auto',
    paddingBlock: '2px',
  },

  title: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 650,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    textWrap: 'balance',
    [MOBILE]: {
      fontSize: '14px',
      // Let copy wrap instead of overflowing the narrow pane.
      whiteSpace: 'normal',
    },
  },

  desc: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 550,
    color: colors.muted,
    lineHeight: 1.35,
    whiteSpace: 'nowrap',
    textWrap: 'pretty',
    [MOBILE]: {
      fontSize: '12.5px',
      whiteSpace: 'normal',
    },
  },

  action: {
    flexShrink: 0,
    gap: '7px',
    borderRadius: '12px',
    paddingBlock: '10px',
    paddingInline: '14px',
    fontSize: '13.5px',
    outline: 'none',
    [MOBILE]: {
      // ≥44px touch target without ballooning the card.
      borderRadius: '10px',
      paddingBlock: '9px',
      paddingInline: '12px',
      fontSize: '13px',
      minHeight: '40px',
    },
    ':focus-visible': {
      boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 3.5px ${colors.ink}`,
    },
  },

  actionIcon: {
    display: 'block',
    flexShrink: 0,
    // Lucide RefreshCw sits optically high next to Hangul — nudge down.
    transform: 'translateY(2px)',
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
        <p {...stylex.props(s.title)}>{t.update.title}</p>
        <p {...stylex.props(s.desc)}>{t.update.detail}</p>
      </div>
      <button
        type="button"
        data-ui-refresh-action=""
        {...stylex.props(ui.btn, ui.btnPrimary, s.action)}
        onClick={refresh}
      >
        <span {...stylex.props(s.actionIcon)} aria-hidden>
          <RefreshCw size={15} strokeWidth={2.25} />
        </span>
        {t.update.action}
      </button>
    </div>
  );
}
