import { useEffect, useMemo, useState } from 'react';
import { Toast } from '@base-ui/react/toast';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { X } from 'lucide-react';
import * as stylex from '@stylexjs/stylex';
import { colors } from '../styles/tokens.stylex.js';
import { ui } from '../styles/ui.js';

const TOAST_ID = 'app-refresh';
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

const refreshToastManager = Toast.createToastManager();

const s = stylex.create({
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    maxWidth: 'min(420px, calc(100vw - 32px))',
    padding: '10px 10px 10px 14px',
    borderRadius: '14px',
    backgroundColor: colors.glass,
    WebkitBackdropFilter: 'blur(10px)',
    backdropFilter: 'blur(10px)',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 10px 28px -8px rgba(20, 20, 26, 0.22)`,
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
  },

  title: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
    textWrap: 'balance',
  },

  desc: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 500,
    color: colors.muted,
    lineHeight: 1.35,
  },

  action: {
    flexShrink: 0,
    borderRadius: '9px',
    paddingBlock: '7px',
    paddingInline: '11px',
  },

  close: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    borderStyle: 'none',
    borderRadius: '9px',
    backgroundColor: 'transparent',
    color: colors.muted,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: colors.hov,
      color: colors.ink,
    },
    ':active': {
      transform: 'scale(0.96)',
    },
  },
});

function RefreshToasts({ onRefresh }) {
  const { toasts } = Toast.useToastManager();

  return toasts.map((t) => (
    <Toast.Root key={t.id} toast={t} data-ui-refresh-toast="" {...stylex.props(s.card)}>
      <div {...stylex.props(s.copy)}>
        {t.title ? <Toast.Title {...stylex.props(s.title)} /> : null}
        {t.description ? <Toast.Description {...stylex.props(s.desc)} /> : null}
      </div>
      <Toast.Action
        {...stylex.props(ui.btn, ui.btnPrimary, s.action)}
        onClick={onRefresh}
      >
        {t.actionProps?.children ?? '새로고침'}
      </Toast.Action>
      <Toast.Close {...stylex.props(s.close)} aria-label="닫기">
        <X size={15} strokeWidth={2.25} />
      </Toast.Close>
    </Toast.Root>
  ));
}

function shouldForceShow() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('updateBanner');
}

/**
 * Floating refresh prompt when a new deployment/service worker is waiting.
 * Uses Base UI Toast (rounded card over the planner table). Dismissable.
 * Preview: append `?updateBanner` to the URL.
 */
export function RefreshBanner() {
  const forceFromUrl = useMemo(() => shouldForceShow(), []);
  const [dismissed, setDismissed] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Long-lived tabs: poll for a new deployment about once an hour.
      window.setInterval(() => {
        void registration.update();
      }, CHECK_INTERVAL_MS);
    },
  });

  const show = (needRefresh || forceFromUrl) && !dismissed;

  useEffect(() => {
    if (!show) {
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
      onClose: () => {
        setDismissed(true);
        setNeedRefresh(false);
      },
    });
  }, [show, setNeedRefresh]);

  const handleRefresh = () => {
    if (needRefresh) {
      void updateServiceWorker(true);
      return;
    }
    // Forced preview (no waiting SW) — just reload.
    window.location.reload();
  };

  return (
    <Toast.Provider toastManager={refreshToastManager} limit={1}>
      <Toast.Portal>
        <Toast.Viewport data-ui-refresh-viewport="">
          <RefreshToasts onRefresh={handleRefresh} />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
