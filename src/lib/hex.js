/** Byte ↔ hex helpers shared by the share crypto and API-token hashing. */

/** @param {Uint8Array} bytes */
export function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * @param {string} hexStr
 * @returns {Uint8Array<ArrayBuffer>}
 * @throws when the input is not even-length hex
 */
export function hexToBytes(hexStr) {
  const clean = String(hexStr || '');
  if (!/^[0-9a-f]*$/i.test(clean) || clean.length % 2 !== 0) {
    throw new Error('Invalid hex');
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
