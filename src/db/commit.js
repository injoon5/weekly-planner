import { toast } from '../lib/notify.js';
import { db } from './instant.js';
import { commitTransaction } from './transaction.js';

/**
 * App-standard Instant commit: run `tx` against the live db, toast `message`
 * on failure, and return the command result. The pure core stays in
 * `transaction.js` for tests; every hook/component should go through this.
 *
 * @param {unknown} tx Instant transaction (or array of transactions)
 * @param {string} [message] User-facing failure toast
 */
export function commitTx(tx, message) {
  return commitTransaction((transaction) => db.transact(transaction), tx, {
    message,
    onError: toast,
  });
}
