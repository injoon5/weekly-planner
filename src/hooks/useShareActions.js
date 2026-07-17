import { fail, ok } from '../lib/command-result.js';
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
  buildShareSecrets,
  buildShareUpdate,
} from '../sharing/share-policy.js';
import { SHARE_MODE, normalizeShareRole } from '../sharing/roles.js';
import { shareUrl } from '../sharing/share.js';

async function copyUrl(url) {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

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
    if (!isOwner || !board) return fail('소유자만 공유할 수 있어요');
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
      await copyUrl(url);
      toast('공유 링크를 켰어요');
      return ok(url);
    } catch (err) {
      return failWith(errorMessage(err, '공유를 켜지 못했어요'), err);
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
      toast('공유 설정을 바꿨어요');
      return ok();
    } catch (err) {
      return failWith(errorMessage(err, '공유 설정을 바꾸지 못했어요'), err);
    }
  };

  const disableShare = async () => {
    if (!isOwner || !board) return fail();
    const share = activeShare();
    if (!share) return fail();
    const tx = patchShareTx(share.id, { enabled: false });
    if (tx) await db.transact(tx);
    toast('공유 링크를 껐어요');
    return ok();
  };

  const rotateShare = async () => {
    if (!isOwner || !board) return fail();
    const share = activeShare();
    if (!share) return fail();
    if (share.mode === SHARE_MODE.PASSWORD) {
      toast('비밀번호 공유는 새 비밀번호로 다시 설정하세요');
      return fail('비밀번호 공유는 새 비밀번호로 다시 설정하세요');
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
      await copyUrl(url);
      toast('새 링크를 만들었어요');
      return ok(url);
    } catch (err) {
      return failWith(errorMessage(err, '링크를 바꾸지 못했어요'), err);
    }
  };

  const copyShareLink = async () => {
    const share = activeShare();
    if (!share?.token) {
      toast('먼저 공유를 켜주세요');
      return fail('먼저 공유를 켜주세요');
    }
    const url = shareUrl(share.token);
    if (await copyUrl(url)) {
      toast('링크를 복사했어요');
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
      return failWith('멤버 역할을 바꾸지 못했어요', error);
    }
  };

  const removeMember = async (memberId, userId) => {
    if (!isOwner || !board) return fail();
    try {
      await db.transact(removeMemberTxs(db.tx, { boardId: board.id, memberId, userId }));
      toast('멤버를 제거했어요');
      return ok();
    } catch (error) {
      return failWith('멤버를 제거하지 못했어요', error);
    }
  };

  const leaveBoard = async (memberId, userId) => {
    if (!memberId || !board) return fail();
    try {
      await db.transact(removeMemberTxs(db.tx, { boardId: board.id, memberId, userId }));
      toast('시간표에서 나갔어요');
      return ok();
    } catch (error) {
      return failWith('시간표에서 나가지 못했어요', error);
    }
  };

  const inviteMember = async ({ email, role, refreshToken }) => {
    if (!isOwner || !board) return fail();
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: refreshToken || '',
        },
        body: JSON.stringify({
          boardId: board.id,
          email,
          role,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(body.error || '초대에 실패했어요');
        return fail(body.error || '초대에 실패했어요');
      }
      toast(body.updated ? '역할을 업데이트했어요' : '초대했어요');
      return ok({ updated: Boolean(body.updated), memberId: body.memberId });
    } catch (error) {
      return failWith('초대에 실패했어요', error);
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
