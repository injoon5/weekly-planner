import { useEffect } from 'react';
import { Toast } from '@base-ui/react/toast';
import { X } from 'lucide-react';
import * as stylex from '@stylexjs/stylex';
import { useAppUpdate } from '../hooks/useAppUpdate.js';
import { colors } from '../styles/tokens.stylex.js';
import { ui } from '../styles/ui.js';

const TOAST_ID = 'app-refresh';
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

const refreshToastManager = Toast.createToastManager();

// Concentric radii: outer 16 = inner 8 + padding 8.
const s = stylex.create({
  card: {
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
    // Layered shadows (no hard border) — depth over outline.
    boxShadow: `0 0 0 1px ${colors.edge}, 0 1px 2px rgba(20, 20, 26, 0.04), 0 8px 24px -6px rgba(20, 20, 26, 0.18)`,
    color: colors.ink,
    cursor: 'default',
    userSelect: 'none',
    '@media print': {
      display: 'none',
    },
  },

  copy: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    minWidth: 0,
    flex: 1,
    paddingBlock: '2px',
  },

  title: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1.25,
    textWrap: 'balance',
  },

  desc: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 500,
    color: colors.muted,
    lineHeight: 1.35,
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
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: colors.muted,
    cursor: 'pointer',
    fontFamily: 'inherit',
    outline: 'none',
    // Optical nudge: Lucide X sits a hair high in the box.
    paddingTop: '1px',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '140ms',
    transitionTimingFunction: EASE_OUT,
    // Expand hit target to ≥40px without changing the visible control.
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

function RefreshToasts({ onRefresh }) {
  const { toasts } = Toast.useToastManager();

  return toasts.map((t) => (
    <Toast.Root
      key={t.id}
      toast={t}
      swipeDirection={['up']}
      data-ui-refresh-toast=""
      {...stylex.props(s.card)}
    >
      <div {...stylex.props(s.copy)} data-ui-refresh-copy="">
        {t.title ? <Toast.Title {...stylex.props(s.title)} /> : null}
        {t.description ? <Toast.Description {...stylex.props(s.desc)} /> : null}
      </div>
      <Toast.Action
        {...stylex.props(ui.btn, ui.btnPrimary, s.action)}
        data-ui-refresh-action=""
        onClick={onRefresh}
      >
        {t.actionProps?.children ?? '새로고침'}
      </Toast.Action>
      <Toast.Close {...stylex.props(s.close)} aria-label="닫기">
        <span {...stylex.props(s.closeIcon)} aria-hidden>
          <X size={14} strokeWidth={2.25} />
        </span>
      </Toast.Close>
    </Toast.Root>
  ));
}

/**
 * Dismissable update card — sits on the week table inside the planner shell.
 * SW registration lives in AppUpdateProvider; this only renders chrome.
 */
export function RefreshBanner() {
  const { needRefresh, dismiss, refresh } = useAppUpdate();

  useEffect(() => {
    if (!needRefresh) {
      refreshToastManager.close(TOAST_ID);
      return;
    }

    refreshToastManager.add({
      id: TOAST_ID,
      type: 'refresh',
      title: '새 버전이 있어요',
      description: '새로고침하면 최신으로 업데이트돼요',
      timeout: 0,
      priority: 'high',
      actionProps: {
        children: '새로고침',
      },
      onClose: dismiss,
    });
  }, [needRefresh, dismiss]);

  if (!needRefresh) return null;

  // Keep the provider in-tree (not portaled) so the banner anchors to the table.
  return (
    <Toast.Provider toastManager={refreshToastManager} limit={1}>
      <Toast.Viewport data-ui-refresh-viewport="">
        <RefreshToasts onRefresh={refresh} />
      </Toast.Viewport>
    </Toast.Provider>
  );
}
