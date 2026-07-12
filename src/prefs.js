/** Board color labels + view-pref serialization (not share crypto). */

export function parseColorLabels(raw) {
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 20);
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeColorLabels(map) {
  const clean = {};
  for (const [k, v] of Object.entries(map || {})) {
    if (typeof v === 'string' && v.trim()) clean[k] = v.trim().slice(0, 20);
  }
  return Object.keys(clean).length ? JSON.stringify(clean) : '';
}

export function parseHiddenColors(raw) {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === 'string') : [];
  } catch {
    return [];
  }
}

export function serializeHiddenColors(list) {
  return JSON.stringify(Array.isArray(list) ? list : []);
}

export function defaultViewPrefs() {
  return {
    hiddenColors: [],
    hideWeekend: false,
    compact: false,
    showMemos: true,
  };
}

export function prefsFromDoc(doc) {
  if (!doc) return defaultViewPrefs();
  return {
    hiddenColors: parseHiddenColors(doc.hiddenColors),
    hideWeekend: Boolean(doc.hideWeekend),
    compact: Boolean(doc.compact),
    showMemos: doc.showMemos !== false,
  };
}
