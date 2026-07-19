import { describe, expect, it } from 'vitest';
import { bytesToHex, hexToBytes } from '../src/lib/hex.js';

describe('hex helpers', () => {
  it('round-trips bytes through hex', () => {
    const bytes = new Uint8Array([0, 1, 15, 16, 128, 255]);
    const hex = bytesToHex(bytes);
    expect(hex).toBe('00010f1080ff');
    expect(hexToBytes(hex)).toEqual(bytes);
  });

  it('accepts uppercase hex and empty input', () => {
    expect(hexToBytes('DEADBEEF')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
    expect(hexToBytes('')).toEqual(new Uint8Array(0));
  });

  it('rejects malformed hex', () => {
    expect(() => hexToBytes('abc')).toThrow();
    expect(() => hexToBytes('zz')).toThrow();
  });
});
