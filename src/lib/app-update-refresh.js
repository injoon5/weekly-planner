/**
 * Activate a waiting service worker (if any), then hard-reload the page.
 *
 * vite-plugin-pwa's `updateServiceWorker(reloadPage)` ignores `reloadPage` since
 * 0.13.2 — it only posts skipWaiting and expects a Workbox `controlling` event
 * to reload. That event often never arrives (already-controlled clients, missed
 * `isUpdate`, dev stub), so the refresh button would appear to do nothing.
 */
export function applyAppUpdate({
  hasWaitingWorker,
  updateServiceWorker,
  reload = () => {
    globalThis.location.reload();
  },
  setTimeoutFn = (fn, ms) => globalThis.setTimeout(fn, ms),
  sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined,
  fallbackMs = 350,
} = {}) {
  if (!hasWaitingWorker) {
    reload();
    return;
  }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    sw?.removeEventListener?.('controllerchange', onControllerChange);
    reload();
  };
  const onControllerChange = () => {
    finish();
  };

  sw?.addEventListener?.('controllerchange', onControllerChange);
  void Promise.resolve(updateServiceWorker?.(true)).finally(() => {
    setTimeoutFn(finish, fallbackMs);
  });
}
