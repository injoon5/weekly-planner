import { forcePrintMediaStyles } from '../lib/print-media.js';
import { printImageFilename, shareOrDownloadImage } from '../lib/print-share.js';
import { applyDocumentTheme } from '../theme/theme-dom.js';
import {
  prepareHeadTracksForPrint,
  restoreHeadTracksAfterPrint,
} from '../grid/grid-layout.js';

/** Capture width so seven day columns stay readable on phone screens. */
export const PRINT_CAPTURE_WIDTH_PX = 1024;

function waitTwoFrames() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

function resetScrollOffsets(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if (el instanceof HTMLElement) {
      if (el.scrollLeft) el.scrollLeft = 0;
      if (el.scrollTop) el.scrollTop = 0;
    }
  }
}

/**
 * Snapshot the planner shell with print styles forced on screen.
 * @param {ParentNode} [root=document]
 * @returns {Promise<Blob>}
 */
export async function capturePrintImageBlob(root = document) {
  const shell = root.querySelector?.('[data-app-shell="planner"]');
  if (!(shell instanceof HTMLElement)) {
    throw new Error('인쇄할 시간표를 찾지 못했어요');
  }

  const { toBlob } = await import('html-to-image');

  const html = document.documentElement;
  const prevTheme = html.dataset.theme === 'dark' ? 'dark' : 'light';
  const prevWidth = shell.style.width;
  const prevMaxWidth = shell.style.maxWidth;
  const prevMinHeight = shell.style.minHeight;

  prepareHeadTracksForPrint(root);
  applyDocumentTheme('light');
  const restoreMedia = forcePrintMediaStyles(document);

  shell.style.width = `${PRINT_CAPTURE_WIDTH_PX}px`;
  shell.style.maxWidth = `${PRINT_CAPTURE_WIDTH_PX}px`;
  shell.style.minHeight = 'auto';
  resetScrollOffsets(shell);

  await waitTwoFrames();

  try {
    const blob = await toBlob(shell, {
      pixelRatio: 2,
      bgcolor: '#ffffff',
      cacheBust: true,
      filter(node) {
        if (!(node instanceof Element)) return true;
        if (node.closest?.('[data-ui-toast-viewport]')) return false;
        if (node.closest?.('[data-ui-pop]')) return false;
        if (node.closest?.('[data-ui-dialog]')) return false;
        if (node.closest?.('[data-ui-drawer]')) return false;
        if (node.closest?.('[data-ui-dialog-backdrop]')) return false;
        if (node.closest?.('[data-ui-drawer-backdrop]')) return false;
        if (node.closest?.('[data-ui-drawer-viewport]')) return false;
        return true;
      },
    });
    if (!(blob instanceof Blob)) throw new Error('이미지를 만들지 못했어요');
    return blob;
  } finally {
    shell.style.width = prevWidth;
    shell.style.maxWidth = prevMaxWidth;
    shell.style.minHeight = prevMinHeight;
    restoreMedia();
    applyDocumentTheme(prevTheme);
    restoreHeadTracksAfterPrint(root);
  }
}

/**
 * Capture the print layout and share/download it.
 * @returns {Promise<{ ok: true, shared: boolean, cancelled?: boolean } | { ok: false, message: string }>}
 */
export async function exportPrintImage(options = {}) {
  const filename = options.filename || printImageFilename();
  try {
    const blob = await capturePrintImageBlob(options.root);
    return await shareOrDownloadImage(blob, filename);
  } catch (err) {
    const message =
      err instanceof Error && err.message ? err.message : '이미지를 만들지 못했어요';
    return { ok: false, message };
  }
}
