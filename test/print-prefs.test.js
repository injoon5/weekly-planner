import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  defaultPrintPrefs,
  normalizePrintPrefs,
  PRINT_PREFS_KEY,
  readPrintPrefs,
  resolvePrintPrefs,
  writePrintPrefs,
} from '../src/board/print-prefs.js';

function createStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key, nextValue) => {
      value = nextValue;
    }),
  };
}

describe('print preference normalization', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
  });

  it('keeps board dates transient when resolving print prefs', () => {
    expect(defaultPrintPrefs()).toEqual({
      name: '',
      time: '',
      showName: true,
      showDate: true,
      showTime: true,
      showMemos: true,
    });
    expect(resolvePrintPrefs({ from: '2026-07-13', to: '2026-07-19' })).toEqual({
      ...defaultPrintPrefs(),
      from: '2026-07-13',
      to: '2026-07-19',
    });
  });

  it('falls back safely for missing, malformed, and non-object storage', () => {
    expect(readPrintPrefs()).toEqual(defaultPrintPrefs());

    vi.stubGlobal('localStorage', createStorage('{'));
    expect(readPrintPrefs()).toEqual(defaultPrintPrefs());

    vi.stubGlobal('localStorage', createStorage('null'));
    expect(readPrintPrefs()).toEqual(defaultPrintPrefs());
  });

  it('normalizes stored values and preserves explicit false flags', () => {
    vi.stubGlobal(
      'localStorage',
      createStorage(
        JSON.stringify({
          name: 'n'.repeat(45),
          from: 123,
          to: '2026-07-19',
          time: 't'.repeat(45),
          showName: false,
          showDate: 0,
          showTime: null,
        }),
      ),
    );

    expect(readPrintPrefs()).toEqual({
      name: 'n'.repeat(40),
      time: 't'.repeat(40),
      showName: false,
      showDate: true,
      showTime: true,
      showMemos: true,
    });
  });

  it('writes only normalized serializable fields', () => {
    const storage = createStorage();
    vi.stubGlobal('localStorage', storage);

    writePrintPrefs({
      name: 'n'.repeat(45),
      from: '2026-07-13',
      to: null,
      time: 42,
      showName: false,
      showDate: true,
      showTime: undefined,
      ignored: 'value',
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      PRINT_PREFS_KEY,
      JSON.stringify({
        name: 'n'.repeat(40),
        time: '',
        showName: false,
        showDate: true,
        showTime: true,
        showMemos: true,
      }),
    );
  });

  it('normalizes invalid input without retaining unknown fields', () => {
    expect(normalizePrintPrefs({ name: 42, from: 'ignored', showDate: false })).toEqual({
      name: '',
      time: '',
      showName: true,
      showDate: false,
      showTime: true,
      showMemos: true,
    });
  });

  it('ignores unavailable storage', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('unavailable');
      },
      setItem: () => {
        throw new Error('unavailable');
      },
    });

    expect(readPrintPrefs()).toEqual(defaultPrintPrefs());
    expect(() => writePrintPrefs({})).not.toThrow();
  });
});
