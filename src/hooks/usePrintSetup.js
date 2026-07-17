import { useEffect, useState } from 'react';
import {
  prepareHeadTracksForPrint,
  restoreHeadTracksAfterPrint,
} from '../grid-layout.js';
import {
  normalizePrintPrefs,
  resolvePrintPrefs,
  writePrintPrefs,
} from '../print-prefs.js';

export function usePrintSetup(board) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => resolvePrintPrefs(board));
  const [draft, setDraft] = useState(() => resolvePrintPrefs(board));

  useEffect(() => {
    const next = resolvePrintPrefs(board);
    setPrefs(next);
    setDraft(next);
  }, [board?.id, board?.from, board?.to]);

  useEffect(() => {
    const onBeforePrint = () => prepareHeadTracksForPrint();
    const onAfterPrint = () => restoreHeadTracksAfterPrint();
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  const open = () => {
    setDraft(resolvePrintPrefs(board));
    setIsOpen(true);
  };

  const patchDraft = (partial) => {
    setDraft((current) => ({
      ...current,
      ...partial,
      ...normalizePrintPrefs({ ...current, ...partial }),
    }));
  };

  const print = () => {
    const next = {
      ...draft,
      ...normalizePrintPrefs(draft),
    };
    writePrintPrefs(next);
    setPrefs(next);
    setIsOpen(false);
    requestAnimationFrame(() => {
      prepareHeadTracksForPrint();
      requestAnimationFrame(() => window.print());
    });
  };

  return {
    prefs,
    dialog: {
      open: isOpen,
      draft,
      onOpenChange: setIsOpen,
      onPatch: patchDraft,
      onPrint: print,
    },
    open,
  };
}
