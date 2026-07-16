import { fail, ok } from './command-result.js';

/**
 * @template T
 * @param {(transaction: T) => Promise<unknown>} transact
 * @param {T} transaction
 * @param {{ message?: string, onError?: (message: string | undefined, error: unknown) => void }} [options]
 * @returns {Promise<{ ok: true } | { ok: false, message?: string, error?: unknown }>}
 */
export async function commitTransaction(transact, transaction, options = {}) {
  const { message, onError } = options;
  try {
    await transact(transaction);
    return ok();
  } catch (error) {
    console.error(error);
    onError?.(message, error);
    return fail(message, error);
  }
}
