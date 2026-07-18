import { pad } from './time.js';

export function printImageFilename(date = new Date()) {
  return `주간계획표-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.png`;
}

/** Trigger a browser download for a Blob (iOS-friendly object URL). */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

/**
 * Share a file via the Web Share API when available; otherwise download it.
 * @returns {Promise<{ ok: true, shared: boolean, cancelled?: boolean } | { ok: false, message: string }>}
 */
export async function shareOrDownloadImage(blob, filename = printImageFilename()) {
  if (!(blob instanceof Blob) || blob.size === 0) {
    return { ok: false, message: '이미지를 만들지 못했어요' };
  }

  const file = new File([blob], filename, { type: blob.type || 'image/png' });
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] }));

  if (canShareFiles) {
    try {
      await navigator.share({ files: [file], title: '주간 계획표' });
      return { ok: true, shared: true };
    } catch (err) {
      if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
        return { ok: true, shared: false, cancelled: true };
      }
      // Fall through to download when share is blocked or unsupported for this file.
    }
  }

  try {
    downloadBlob(blob, filename);
    return { ok: true, shared: false };
  } catch {
    return { ok: false, message: '이미지를 저장하지 못했어요' };
  }
}
