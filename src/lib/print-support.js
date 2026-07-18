/**
 * Environments where `window.print()` is missing or a silent no-op.
 * Installed PWAs and most in-app browsers cannot open a system print sheet.
 */

const IN_APP_BROWSER_RE =
  /KAKAOTALK|Instagram|FBAN|FBAV|FBIOS|Line\/|NAVER\(inapp|SamsungBrowser\/[^ ]*CrossApp|\bwv\b/i;

/** True when the app is running as an installed PWA / home-screen web app. */
export function isStandaloneDisplay(win = window) {
  if (typeof win === 'undefined') return false;
  try {
    if (win.matchMedia('(display-mode: standalone)').matches) return true;
    if (win.matchMedia('(display-mode: minimal-ui)').matches) return true;
  } catch {
    // matchMedia can throw in odd test / embedded environments
  }
  // iOS Safari legacy standalone flag
  return win.navigator?.standalone === true;
}

/** True for common in-app WebViews that block or ignore print. */
export function isInAppBrowser(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  return IN_APP_BROWSER_RE.test(userAgent || '');
}

/**
 * Whether calling `window.print()` is expected to open a real print UI.
 * When false, callers should share/save a print-styled image instead.
 */
export function canNativePrint(win = typeof window !== 'undefined' ? window : undefined) {
  if (!win || typeof win.print !== 'function') return false;
  if (isStandaloneDisplay(win)) return false;
  if (isInAppBrowser(win.navigator?.userAgent)) return false;
  return true;
}
