/** Device-local prefs for the print header (name / date / time fields). */

export const PRINT_PREFS_KEY = 'weekly-planner.print';

export function defaultPrintPrefs(board) {
  return {
    name: '',
    from: board?.from || '',
    to: board?.to || '',
    time: '',
    showName: true,
    showDate: true,
    showTime: true,
  };
}

export function readPrintPrefs(board) {
  const fallback = defaultPrintPrefs(board);
  try {
    const raw = localStorage.getItem(PRINT_PREFS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return {
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, 40) : '',
      from: typeof parsed.from === 'string' ? parsed.from : fallback.from,
      to: typeof parsed.to === 'string' ? parsed.to : fallback.to,
      time: typeof parsed.time === 'string' ? parsed.time.slice(0, 40) : '',
      showName: parsed.showName !== false,
      showDate: parsed.showDate !== false,
      showTime: parsed.showTime !== false,
    };
  } catch {
    return fallback;
  }
}

export function writePrintPrefs(prefs) {
  try {
    localStorage.setItem(
      PRINT_PREFS_KEY,
      JSON.stringify({
        name: typeof prefs.name === 'string' ? prefs.name.slice(0, 40) : '',
        from: typeof prefs.from === 'string' ? prefs.from : '',
        to: typeof prefs.to === 'string' ? prefs.to : '',
        time: typeof prefs.time === 'string' ? prefs.time.slice(0, 40) : '',
        showName: prefs.showName !== false,
        showDate: prefs.showDate !== false,
        showTime: prefs.showTime !== false,
      }),
    );
  } catch {
    /* ignore */
  }
}
