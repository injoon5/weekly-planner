/** Device-local prefs for the print header (name / date / time fields). */

export const PRINT_PREFS_KEY = 'weekly-planner.print';

export function defaultPrintPrefs() {
  return {
    name: '',
    time: '',
    showName: true,
    showDate: true,
    showTime: true,
    showMemos: true,
  };
}

export function normalizePrintPrefs(value) {
  const prefs = value && typeof value === 'object' ? value : {};
  return {
    name: typeof prefs.name === 'string' ? prefs.name.slice(0, 40) : '',
    time: typeof prefs.time === 'string' ? prefs.time.slice(0, 40) : '',
    showName: prefs.showName !== false,
    showDate: prefs.showDate !== false,
    showTime: prefs.showTime !== false,
    showMemos: prefs.showMemos !== false,
  };
}

export function readPrintPrefs() {
  try {
    const raw = localStorage.getItem(PRINT_PREFS_KEY);
    return raw ? normalizePrintPrefs(JSON.parse(raw)) : defaultPrintPrefs();
  } catch {
    return defaultPrintPrefs();
  }
}

export function resolvePrintPrefs(board) {
  return {
    ...readPrintPrefs(),
    from: board?.from || '',
    to: board?.to || '',
  };
}

export function writePrintPrefs(prefs) {
  try {
    localStorage.setItem(PRINT_PREFS_KEY, JSON.stringify(normalizePrintPrefs(prefs)));
  } catch {
    /* ignore */
  }
}
