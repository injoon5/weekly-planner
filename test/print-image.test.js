import { describe, expect, it, vi } from 'vitest';

import {
  canNativePrint,
  isInAppBrowser,
  isStandaloneDisplay,
} from '../src/lib/print-support.js';
import { mapPrintMediaTextForTest } from '../src/lib/print-media.js';
import {
  downloadBlob,
  printImageFilename,
  shareOrDownloadImage,
} from '../src/lib/print-share.js';

function mockWindow({ print = () => {}, standalone = false, minimalUi = false, userAgent = 'Mozilla/5.0' } = {}) {
  return {
    print,
    matchMedia: (query) => ({
      matches:
        (standalone && query.includes('standalone')) ||
        (minimalUi && query.includes('minimal-ui')),
    }),
    navigator: { userAgent, standalone },
  };
}

describe('print support detection', () => {
  it('allows native print in a normal browser tab', () => {
    expect(canNativePrint(mockWindow())).toBe(true);
  });

  it('blocks native print in standalone / minimal-ui PWAs', () => {
    expect(canNativePrint(mockWindow({ standalone: true }))).toBe(false);
    expect(canNativePrint(mockWindow({ minimalUi: true }))).toBe(false);
    expect(isStandaloneDisplay(mockWindow({ standalone: true }))).toBe(true);
  });

  it('blocks native print when window.print is missing', () => {
    const win = mockWindow();
    delete win.print;
    expect(canNativePrint(win)).toBe(false);
  });

  it('detects common in-app browsers', () => {
    expect(isInAppBrowser('Mozilla/5.0 KAKAOTALK')).toBe(true);
    expect(isInAppBrowser('Instagram 300.0.0')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 (Linux; Android 14; wv)')).toBe(true);
    expect(isInAppBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe(false);
    expect(canNativePrint(mockWindow({ userAgent: 'KAKAOTALK' }))).toBe(false);
  });
});

describe('print media remapping', () => {
  it('forces print rules on and screen rules off', () => {
    expect(mapPrintMediaTextForTest('print')).toBe('all');
    expect(mapPrintMediaTextForTest('only print')).toBe('all');
    expect(mapPrintMediaTextForTest('screen and (max-width: 720px)')).toBe('not all');
    expect(mapPrintMediaTextForTest('screen, print')).toBe('all');
    expect(mapPrintMediaTextForTest('(prefers-reduced-motion: reduce)')).toBe(
      '(prefers-reduced-motion: reduce)',
    );
  });
});

describe('print image share helpers', () => {
  it('builds a Korean dated filename', () => {
    expect(printImageFilename(new Date(2026, 6, 18))).toBe('주간계획표-2026-07-18.png');
  });

  it('downloads when Web Share is unavailable', async () => {
    const click = vi.fn();
    vi.stubGlobal('navigator', {});
    vi.stubGlobal(
      'document',
      {
        createElement: () => ({
          click,
          set href(_v) {},
          set download(_v) {},
          set rel(_v) {},
        }),
      },
    );
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:test',
      revokeObjectURL: vi.fn(),
    });

    const blob = new Blob(['x'], { type: 'image/png' });
    const result = await shareOrDownloadImage(blob, 't.png');
    expect(result).toEqual({ ok: true, shared: false });
    expect(click).toHaveBeenCalledOnce();
  });

  it('shares via navigator.share when files are allowed', async () => {
    const share = vi.fn(async () => {});
    vi.stubGlobal('navigator', {
      share,
      canShare: () => true,
    });

    const blob = new Blob(['x'], { type: 'image/png' });
    const result = await shareOrDownloadImage(blob, 't.png');
    expect(result).toEqual({ ok: true, shared: true });
    expect(share).toHaveBeenCalledOnce();
    expect(share.mock.calls[0][0].files[0]).toBeInstanceOf(File);
  });

  it('treats share AbortError as a cancelled success', async () => {
    vi.stubGlobal('navigator', {
      share: vi.fn(async () => {
        const err = new Error('cancel');
        err.name = 'AbortError';
        throw err;
      }),
      canShare: () => true,
    });

    const result = await shareOrDownloadImage(new Blob(['x'], { type: 'image/png' }), 't.png');
    expect(result).toEqual({ ok: true, shared: false, cancelled: true });
  });

  it('rejects empty blobs', async () => {
    expect(await shareOrDownloadImage(new Blob([]), 't.png')).toEqual({
      ok: false,
      message: '이미지를 만들지 못했어요',
    });
  });

  it('downloadBlob clicks an object-URL anchor', () => {
    const click = vi.fn();
    const revoke = vi.fn();
    vi.stubGlobal(
      'document',
      {
        createElement: () => ({
          click,
          set href(_v) {},
          set download(_v) {},
          set rel(_v) {},
        }),
      },
    );
    vi.stubGlobal('URL', {
      createObjectURL: () => 'blob:x',
      revokeObjectURL: revoke,
    });
    vi.useFakeTimers();
    downloadBlob(new Blob(['x']), 'a.png');
    expect(click).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith('blob:x');
    vi.useRealTimers();
  });
});
