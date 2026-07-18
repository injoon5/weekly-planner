/**
 * Force `@media print` rules onto the screen (and suppress `@media screen`)
 * so a DOM snapshot matches the print layout when `window.print()` is unavailable.
 *
 * Returns a restore function — always call it in a `finally`.
 */

function mapMediaText(text) {
  const raw = String(text || '').trim();
  if (!raw || raw.toLowerCase() === 'all') return raw;

  const lower = raw.toLowerCase();
  const hasPrint = /\bprint\b/.test(lower);
  const hasScreen = /\bscreen\b/.test(lower);

  if (hasPrint && hasScreen) return 'all';
  if (hasPrint) return raw.replace(/\bonly\s+print\b/gi, 'all').replace(/\bprint\b/gi, 'all');
  if (hasScreen) return 'not all';
  return raw;
}

/** @param {CSSRuleList} rules @param {{ type: string, mediaList?: MediaList, node?: Element, prev: string }[]} edits */
function walkRules(rules, edits) {
  for (const rule of rules) {
    if (typeof CSSMediaRule !== 'undefined' && rule instanceof CSSMediaRule) {
      const prev = rule.media.mediaText;
      const next = mapMediaText(prev);
      if (next !== prev) {
        try {
          rule.media.mediaText = next;
          edits.push({ type: 'mediaList', mediaList: rule.media, prev });
        } catch {
          // Some engines reject mediaText writes on constructed sheets.
        }
      }
      try {
        walkRules(rule.cssRules, edits);
      } catch {
        // ignore
      }
      continue;
    }
    if (typeof CSSGroupingRule !== 'undefined' && rule instanceof CSSGroupingRule) {
      try {
        walkRules(rule.cssRules, edits);
      } catch {
        // ignore
      }
    }
  }
}

/**
 * Apply print styles on screen. Restore with the returned function.
 * @returns {() => void}
 */
export function forcePrintMediaStyles(doc = document) {
  const edits = [];

  for (const sheet of doc.styleSheets) {
    const node = sheet.ownerNode;
    if (node instanceof HTMLLinkElement || node instanceof HTMLStyleElement) {
      const attr = node.getAttribute('media');
      if (attr && attr.trim() && attr.trim().toLowerCase() !== 'all') {
        const next = mapMediaText(attr);
        if (next !== attr.trim()) {
          edits.push({ type: 'attr', node, prev: attr });
          node.setAttribute('media', next);
        }
      }
    }

    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    walkRules(rules, edits);
  }

  return () => {
    for (let i = edits.length - 1; i >= 0; i -= 1) {
      const edit = edits[i];
      try {
        if (edit.type === 'attr' && edit.node) {
          edit.node.setAttribute('media', edit.prev);
        } else if (edit.type === 'mediaList' && edit.mediaList) {
          edit.mediaList.mediaText = edit.prev;
        }
      } catch {
        // Best-effort restore
      }
    }
  };
}

/** Exported for unit tests. */
export function mapPrintMediaTextForTest(text) {
  return mapMediaText(text);
}
