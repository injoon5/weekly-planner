import { useEffect, useState } from 'react';
import {
  prepareHeadTracksForPrint,
  restoreHeadTracksAfterPrint,
} from '../grid/grid-layout.js';
import { exportPrintImage } from '../board/print-image.js';
import {
  normalizePrintPrefs,
  resolvePrintPrefs,
  writePrintPrefs,
} from '../board/print-prefs.js';
import { canNativePrint } from '../lib/print-support.js';
import { toast } from '../lib/notify.js';

export function usePrintSetup(board) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => resolvePrintPrefs(board));
  const [draft, setDraft] = useState(() => resolvePrintPrefs(board));
  const [busy, setBusy] = useState(false);
  const [nativePrint, setNativePrint] = useState(() => canNativePrint());

  useEffect(() => {
    const next = resolvePrintPrefs(board);
    setPrefs(next);
    setDraft(next);
  }, [board, board?.id, board?.from, board?.to]);

  useEffect(() => {
    const sync = () => setNativePrint(canNativePrint());
    sync();
    const mqStandalone = window.matchMedia('(display-mode: standalone)');
    const mqMinimal = window.matchMedia('(display-mode: minimal-ui)');
    mqStandalone.addEventListener('change', sync);
    mqMinimal.addEventListener('change', sync);
    return () => {
      mqStandalone.removeEventListener('change', sync);
      mqMinimal.removeEventListener('change', sync);
    };
  }, []);

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
    if (busy) return;
    setNativePrint(canNativePrint());
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

  const onOpenChange = (next) => {
    if (busy) return;
    setIsOpen(next);
  };

  const print = () => {
    if (busy) return;

    const next = {
      ...draft,
      ...normalizePrintPrefs(draft),
    };
    writePrintPrefs(next);
    setPrefs(next);

    const useNative = canNativePrint();
    setNativePrint(useNative);

    if (useNative) {
      setIsOpen(false);
      requestAnimationFrame(() => {
        prepareHeadTracksForPrint();
        requestAnimationFrame(() => window.print());
      });
      return;
    }

    // Keep the sheet open (busy CTA) while we snapshot. Print CSS + the
    // capture filter hide overlays so they do not appear in the PNG.
    setBusy(true);
    requestAnimationFrame(() => {
      prepareHeadTracksForPrint();
      requestAnimationFrame(() => {
        void exportPrintImage()
          .then((result) => {
            if (!result.ok) {
              toast(result.message || '이미지를 만들지 못했어요');
              return;
            }
            if (result.cancelled) return;
            toast(result.shared ? '공유 시트를 열었어요' : '이미지를 저장했어요');
          })
          .finally(() => {
            setBusy(false);
            setIsOpen(false);
          });
      });
    });
  };

  return {
    prefs,
    dialog: {
      open: isOpen,
      draft,
      busy,
      mode: nativePrint ? 'print' : 'image',
      onOpenChange,
      onPatch: patchDraft,
      onPrint: print,
    },
    open,
  };
}
