import { createContext, useContext, useMemo, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { applyAppUpdate } from '../lib/app-update-refresh.js';

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

const AppUpdateContext = createContext({
  needRefresh: false,
  dismiss: () => {},
  refresh: () => {},
});

function shouldForceShow() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('updateBanner');
}

/**
 * Registers the PWA service worker once at the app root.
 * The visual banner only mounts inside the planner table area.
 */
export function AppUpdateProvider({ children }) {
  const [dismissed, setDismissed] = useState(false);
  const {
    needRefresh: [swNeedRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      window.setInterval(() => {
        void registration.update();
      }, CHECK_INTERVAL_MS);
    },
  });

  // Re-check each render so soft navigations / reloads with ?updateBanner work.
  const forceFromUrl = shouldForceShow();

  const value = useMemo(() => {
    const show = (swNeedRefresh || forceFromUrl) && !dismissed;
    return {
      needRefresh: show,
      dismiss: () => {
        setDismissed(true);
        setNeedRefresh(false);
      },
      refresh: () => {
        applyAppUpdate({
          hasWaitingWorker: swNeedRefresh,
          updateServiceWorker,
        });
      },
    };
  }, [swNeedRefresh, forceFromUrl, dismissed, setNeedRefresh, updateServiceWorker]);

  return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
}

export function useAppUpdate() {
  return useContext(AppUpdateContext);
}
