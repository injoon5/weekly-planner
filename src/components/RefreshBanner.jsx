import { Button } from '@base-ui/react/button';
import { X } from 'lucide-react';
import * as stylex from '@stylexjs/stylex';
import { useAppUpdate } from '../hooks/useAppUpdate.jsx';
import { colors } from '../styles/tokens.stylex.js';
import { ui } from '../styles/ui.js';

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

// Concentric radii: outer 16 = inner 8 + padding 8.
const s = stylex.create({
  banner: {
    position: 'absolute',
    top: '10px',
    left: '50%',
    zIndex: 45,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: 'max-content',
    maxWidth: 'min(380px, calc(100% - 24px))',
    padding: '8px 8px 8px 14px',
    borderRadius: '16px',
    backgroundColor: colors.glass,
    WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
    backdropFilter: 'blur(12px) saturate(1.2)',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 1px 2px rgba(20, 20, 26, 0.04), 0 8px 24px -6px rgba(20, 20, 26, 0.18)`,
    color: colors.ink,
    transform: 'translateX(-50%)',
    pointerEvents: 'auto',
    '@media print': {
      display: 'none',
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
    fontWeight: 600,
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    textWrap: 'balance',
  },

  desc: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 500,
    color: colors.muted,
    lineHeight: 1.35,
    whiteSpace: 'nowrap',
    textWrap: 'pretty',
  },

  action: {
    flexShrink: 0,
    borderRadius: '8px',
    paddingBlock: '7px',
    paddingInline: '12px',
    outline: 'none',
    ':focus-visible': {
      boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 3.5px ${colors.ink}`,
    },
  },

  close: {
    position: 'relative',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    margin: 0,
    padding: 0,
    paddingTop: '1px',
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: colors.muted,
    cursor: 'pointer',
    fontFamily: 'inherit',
    outline: 'none',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '140ms',
    transitionTimingFunction: EASE_OUT,
    '::before': {
      content: '""',
      position: 'absolute',
      inset: '-6px',
    },
    ':hover': {
      backgroundColor: colors.hov,
      color: colors.ink,
    },
    ':active': {
      transform: 'scale(0.96)',
    },
    ':focus-visible': {
      boxShadow: `0 0 0 2px ${colors.paper}, 0 0 0 3.5px ${colors.ink}`,
    },
  },

  closeIcon: {
    display: 'block',
    pointerEvents: 'none',
  },
});

/**
 * Dismissable update card on the week table.
 * Plain overlay (not Toast viewport) so width isn't collapsed to 0.
 */
export function RefreshBanner() {
  const { needRefresh, dismiss, refresh } = useAppUpdate();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-ui-refresh-banner=""
      {...stylex.props(s.banner)}
    >
      <div {...stylex.props(s.copy)}>
        <p {...stylex.props(s.title)}>새 버전이 있어요</p>
        <p {...stylex.props(s.desc)}>새로고침하면 최신으로 업데이트돼요</p>
      </div>
      <Button
        type="button"
        {...stylex.props(ui.btn, ui.btnPrimary, s.action)}
        onClick={refresh}
      >
        새로고침
      </Button>
      <button
        type="button"
        {...stylex.props(s.close)}
        aria-label="닫기"
        onClick={dismiss}
      >
        <span {...stylex.props(s.closeIcon)} aria-hidden>
          <X size={14} strokeWidth={2.25} />
        </span>
      </button>
    </div>
  );
}
