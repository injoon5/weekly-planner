/** Uniform command result shape used by hooks and transaction commits. */

/**
 * @template [T=undefined]
 * @param {T} [value]
 * @returns {T extends undefined ? { ok: true } : { ok: true, value: T }}
 */
export function ok(value) {
  if (arguments.length === 0) return /** @type {any} */ ({ ok: true });
  return /** @type {any} */ ({ ok: true, value });
}

/**
 * @param {string} [message]
 * @param {unknown} [error]
 * @returns {{ ok: false, message?: string, error?: unknown }}
 */
export function fail(message, error) {
  /** @type {{ ok: false, message?: string, error?: unknown }} */
  const result = { ok: false };
  if (message !== undefined) result.message = message;
  if (error !== undefined) result.error = error;
  return result;
}

/** @param {{ ok?: boolean } | null | undefined} result */
export function isOk(result) {
  return Boolean(result?.ok);
}
