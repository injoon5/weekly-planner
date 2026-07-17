import { db, id } from '../instant.js';

export function createShareTx(
  boardId,
  { token, secret, editSecret, mode, role, enabled = true, passwordSalt },
) {
  const sid = id();
  return {
    sid,
    tx: db.tx.shares[sid]
      .update({
        token,
        secret,
        mode,
        role,
        enabled,
        createdAt: Date.now(),
        ...(editSecret ? { editSecret } : {}),
        ...(passwordSalt ? { passwordSalt } : {}),
      })
      .link({ board: boardId }),
  };
}

export function patchShareTx(shareId, patch) {
  const clean = {};
  for (const k of ['token', 'secret', 'editSecret', 'mode', 'role', 'enabled', 'passwordSalt']) {
    if (patch[k] !== undefined) clean[k] = patch[k];
  }
  if (!Object.keys(clean).length) return null;
  return db.tx.shares[shareId].update(clean);
}

export function deleteShareTx(shareId) {
  return db.tx.shares[shareId].delete();
}

/** Replace share row so editSecret cannot linger on viewer demotion. */
export function replaceShareTxs(boardId, existingShareId, fields) {
  const txs = [];
  if (existingShareId) txs.push(deleteShareTx(existingShareId));
  txs.push(createShareTx(boardId, fields).tx);
  return txs;
}
