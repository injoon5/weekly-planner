import { createContext, useContext, useMemo, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

const AppUpdateContext = createContext({
  needRefresh: false,
  forceShow: false,
  dismiss: () => {},
  refresh: () => {},
});

function shouldForceShow() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('updateBanner');
}

/**
 * Registers the PWA service worker once at the app root.
 * The visual banner only mounts inside the planner table.
 */
export function AppUpdateProvider({ children }) {
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

  const value = useMemo(() => {
    const show = (needRefresh || forceFromUrl) && !dismissed;
    return {
      needRefresh: show,
      forceShow: forceFromUrl && !needRefresh,
      dismiss: () => {
        setDismissed(true);
        setNeedRefresh(false);
      },
      refresh: () => {
        if (needRefresh) {
          void updateServiceWorker(true);
          return;
        }
        window.location.reload();
      },
    };
  }, [needRefresh, forceFromUrl, dismissed, setNeedRefresh, updateServiceWorker]);

  return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
}

export function useAppUpdate() {
  return useContext(AppUpdateContext);
}
