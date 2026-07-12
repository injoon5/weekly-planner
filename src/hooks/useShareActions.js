import {
  db,
  buildShareSecrets,
  createShareTx,
  deleteMemberTx,
  deleteShareTx,
  patchMemberTx,
  patchShareTx,
  setMemberEditorTx,
} from '../db.js';
import { shareUrl } from '../share.js';

function activeShareOf(board) {
  return (board?.shares || []).find((s) => s.enabled) || board?.shares?.[0] || null;
}

/** Share links + member invite/role — owner-only except leave. */
export function useShareActions({ board, isOwner = true, toast }) {
  const activeShare = () => activeShareOf(board);

  const enableShare = async ({ mode = 'open', role = 'viewer', password = '' } = {}) => {
    if (!isOwner || !board) return null;
    const existing = activeShare();
    try {
      const built = await buildShareSecrets({
        mode,
        role,
        password,
        existingToken: existing?.token,
      });
      // Always replace the share row so editSecret cannot linger on viewer demotion.
      const txs = [];
      if (existing) txs.push(deleteShareTx(existing.id));
      txs.push(createShareTx(board.id, { ...built, enabled: true }).tx);
      await db.transact(txs);
      const url = shareUrl(built.token);
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* ignore */
      }
      toast('공유 링크를 켰어요');
      return url;
    } catch (err) {
      toast(err instanceof Error ? err.message : '공유를 켜지 못했어요');
      return null;
    }
  };

  const disableShare = async () => {
    if (!isOwner || !board) return;
    const share = activeShare();
    if (!share) return;
    const tx = patchShareTx(share.id, { enabled: false });
    if (tx) await db.transact(tx);
    toast('공유 링크를 껐어요');
  };

  const rotateShare = async () => {
    if (!isOwner || !board) return null;
    const share = activeShare();
    if (!share) return null;
    if (share.mode === 'password') {
      toast('비밀번호 공유는 새 비밀번호로 다시 설정하세요');
      return null;
    }
    try {
      const built = await buildShareSecrets({
        mode: 'open',
        role: share.role === 'editor' ? 'editor' : 'viewer',
        password: '',
      });
      await db.transact([
        deleteShareTx(share.id),
        createShareTx(board.id, { ...built, enabled: true }).tx,
      ]);
      toast('새 링크를 만들었어요');
      return shareUrl(built.token);
    } catch (err) {
      toast(err instanceof Error ? err.message : '링크를 바꾸지 못했어요');
      return null;
    }
  };

  const copyShareLink = async () => {
    const share = activeShare();
    if (!share?.token) {
      toast('먼저 공유를 켜주세요');
      return;
    }
    const url = shareUrl(share.token);
    try {
      await navigator.clipboard.writeText(url);
      toast('링크를 복사했어요');
    } catch {
      toast(url);
    }
  };

  const updateMemberRole = (memberId, userId, role) => {
    if (!isOwner || !board || !userId) return;
    const txs = [setMemberEditorTx(board.id, userId, role === 'editor')];
    const mt = patchMemberTx(memberId, { role });
    if (mt) txs.unshift(mt);
    db.transact(txs);
  };

  const removeMember = (memberId, userId) => {
    if (!isOwner || !board) return;
    const txs = [deleteMemberTx(memberId)];
    if (userId) txs.push(setMemberEditorTx(board.id, userId, false));
    db.transact(txs);
    toast('멤버를 제거했어요');
  };

  const leaveBoard = (memberId, userId) => {
    if (!memberId || !board) return;
    const txs = [deleteMemberTx(memberId)];
    if (userId) txs.push(setMemberEditorTx(board.id, userId, false));
    db.transact(txs);
    toast('시간표에서 나갔어요');
  };

  const inviteMember = async ({ email, role, refreshToken }) => {
    if (!isOwner || !board) return false;
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: refreshToken || '',
        },
        body: JSON.stringify({
          refreshToken,
          boardId: board.id,
          email,
          role,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(body.error || '초대에 실패했어요');
        return false;
      }
      toast(body.updated ? '역할을 업데이트했어요' : '초대했어요');
      return true;
    } catch {
      toast('초대에 실패했어요');
      return false;
    }
  };

  return {
    activeShare,
    enableShare,
    disableShare,
    rotateShare,
    copyShareLink,
    updateMemberRole,
    removeMember,
    leaveBoard,
    inviteMember,
  };
}
