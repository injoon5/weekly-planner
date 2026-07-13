/**
 * @template T
 * @param {(transaction: T) => Promise<unknown>} transact
 * @param {T} transaction
 * @param {{ message?: string, onError?: (message: string | undefined, error: unknown) => void }} [options]
 */
export async function commitTransaction(transact, transaction, options = {}) {
  const { message, onError } = options;
  try {
    await transact(transaction);
    return true;
  } catch (error) {
    console.error(error);
    onError?.(message, error);
    return false;
  }
}
