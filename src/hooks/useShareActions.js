import { fail, ok } from '../lib/command-result.js';
import { copyToClipboard } from '../lib/clipboard.js';
import { sessionRequest } from '../lib/session-api.js';
import { toast } from '../lib/notify.js';
import { db } from '../db/instant.js';
import { memberRoleTxs, removeMemberTxs } from '../sharing/member-policy.js';
import {
  createShareTx,
  deleteShareTx,
  patchShareTx,
  replaceShareTxs,
} from '../db/tx/shares.js';
import {
  activeShareOf,
  buildShareDisable,
  buildShareSecrets,
  buildShareUpdate,
} from '../sharing/share-policy.js';
import { SHARE_MODE, normalizeShareRole } from '../sharing/roles.js';
import { shareUrl } from '../sharing/share.js';
import { t } from '../strings.js';

/** Share-policy validation errors carry user-facing Korean messages; prefer them. */
function errorMessage(err, fallback) {
  return err instanceof Error && err.message ? err.message : fallback;
}

function failWith(message, error) {
  if (error !== undefined) console.error(error);
  toast(message);
  return fail(message, error);
}

/** Share links + member invite/role — owner-only except leave. */
export function useShareActions({ board, isOwner = true }) {
  const activeShare = () => activeShareOf(board);
  const enableShare = async ({ mode = 'open', role = 'viewer', password = '' } = {}) => {
    if (!isOwner || !board) return fail(t.share.err.ownerOnly);
    const existing = activeShare();
    try {
      const built = await buildShareSecrets({
        mode,
        role,
        password,
        existingToken: existing?.token,
      });
      await db.transact(replaceShareTxs(board.id, existing?.id, { ...built, enabled: true }));
      const url = shareUrl(built.token);
      await copyToClipboard(url);
      toast(t.share.toast.enabled);
      return ok(url);
    } catch (err) {
      return failWith(errorMessage(err, t.share.err.enableFailed), err);
    }
  };

  /**
   * Change mode/role/password of the live share while keeping its token,
   * so the URL people already have stays valid. Row is replaced (not patched)
   * so a stale editSecret can't survive a viewer demotion.
   */
  const updateShare = async ({ mode, role, password = '' } = {}) => {
    if (!isOwner || !board) return fail();
    const share = activeShare();
    if (!share?.token) return fail();
    try {
      const fields = await buildShareUpdate({ share, mode, role, password });
      await db.transact(replaceShareTxs(board.id, share.id, fields));
      toast(t.share.toast.updated);
      return ok();
    } catch (err) {
      return failWith(errorMessage(err, t.share.err.updateFailed), err);
    }
  };

  const disableShare = async () => {
    if (!isOwner || !board) return fail();
    const share = activeShare();
    if (!share) return fail();
    // buildShareDisable scrambles the secret so the revoked link can never
    // match the share rules again (see share-policy.js for why).
    const tx = patchShareTx(share.id, buildShareDisable());
    if (tx) await db.transact(tx);
    toast(t.share.toast.disabled);
    return ok();
  };

  const rotateShare = async () => {
    if (!isOwner || !board) return fail();
    const share = activeShare();
    if (!share) return fail();
    if (share.mode === SHARE_MODE.PASSWORD) {
      toast(t.share.err.passwordResetNeeded);
      return fail(t.share.err.passwordResetNeeded);
    }
    try {
      const built = await buildShareSecrets({
        mode: SHARE_MODE.OPEN,
        role: normalizeShareRole(share.role),
        password: '',
      });
      await db.transact([
        deleteShareTx(share.id),
        createShareTx(board.id, { ...built, enabled: true }).tx,
      ]);
      const url = shareUrl(built.token);
      await copyToClipboard(url);
      toast(t.share.toast.newLink);
      return ok(url);
    } catch (err) {
      return failWith(errorMessage(err, t.share.err.rotateFailed), err);
    }
  };

  const copyShareLink = async () => {
    const share = activeShare();
    if (!share?.token) {
      toast(t.share.err.firstEnable);
      return fail(t.share.err.firstEnable);
    }
    const url = shareUrl(share.token);
    if (await copyToClipboard(url)) {
      toast(t.share.toast.linkCopied);
      return ok(url);
    }
    toast(url);
    return ok(url);
  };

  const updateMemberRole = async (memberId, userId, role) => {
    if (!isOwner || !board || !userId) return fail();
    try {
      await db.transact(memberRoleTxs(db.tx, { boardId: board.id, memberId, userId, role }));
      return ok();
    } catch (error) {
      return failWith(t.share.err.roleChangeFailed, error);
    }
  };

  const removeMember = async (memberId, userId) => {
    if (!isOwner || !board) return fail();
    try {
      await db.transact(removeMemberTxs(db.tx, { boardId: board.id, memberId, userId }));
      toast(t.share.toast.memberRemoved);
      return ok();
    } catch (error) {
      return failWith(t.share.err.removeFailed, error);
    }
  };

  const leaveBoard = async (memberId, userId) => {
    if (!memberId || !board) return fail();
    try {
      await db.transact(removeMemberTxs(db.tx, { boardId: board.id, memberId, userId }));
      toast(t.share.toast.left);
      return ok();
    } catch (error) {
      return failWith(t.share.err.leaveFailed, error);
    }
  };

  const inviteMember = async ({ email, role, refreshToken }) => {
    if (!isOwner || !board) return fail();
    try {
      const { ok: sent, payload } = await sessionRequest('/api/invite', {
        refreshToken,
        body: { boardId: board.id, email, role },
      });
      if (!sent) return failWith(payload.error || t.share.err.inviteFailed);
      toast(payload.updated ? t.share.toast.roleUpdated : t.share.toast.invited);
      return ok({ updated: Boolean(payload.updated), memberId: payload.memberId });
    } catch (error) {
      return failWith(t.share.err.inviteFailed, error);
    }
  };

  return {
    activeShare,
    enableShare,
    updateShare,
    disableShare,
    rotateShare,
    copyShareLink,
    updateMemberRole,
    removeMember,
    leaveBoard,
    inviteMember,
  };
}
