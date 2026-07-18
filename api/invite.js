import { init, id } from '@instantdb/admin';
import { linkedId } from '../src/lib/links.js';
import {
  createMemberTxs,
  findMemberForUser,
  memberRoleTxs,
} from '../src/sharing/member-policy.js';
import { normalizeMemberRole } from '../src/sharing/roles.js';
import { readBody, sendJson } from '../src/server/http.js';
import schema from '../src/db/schema.js';

const APP_ID = process.env.INSTANT_APP_ID || process.env.VITE_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;

/**
 * Invite a registered Instant user to a board.
 * POST { boardId, email, role: 'viewer'|'editor' }
 * Header `token` may also carry the refresh token.
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }
  if (!APP_ID || !ADMIN_TOKEN) {
    return sendJson(res, 500, { error: '서버 설정이 없어요' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJson(res, 400, { error: '잘못된 요청이에요' });
  }

  const refreshToken = req.headers.token || body.refreshToken;
  const boardId = body.boardId;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = normalizeMemberRole(body.role);

  if (!refreshToken || !boardId || !email) {
    return sendJson(res, 400, { error: '필수 값이 없어요' });
  }

  const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN, schema });

  try {
    const caller = await db.auth.verifyToken(refreshToken);
    if (!caller?.id) {
      return sendJson(res, 401, { error: '로그인이 필요해요' });
    }

    const { boards } = await db.query({
      boards: {
        $: { where: { id: boardId } },
        owner: {},
        members: { user: {} },
      },
    });
    const board = boards?.[0];
    if (!board) {
      return sendJson(res, 404, { error: '시간표를 찾을 수 없어요' });
    }
    const ownerId = linkedId(board.owner);
    if (ownerId !== caller.id) {
      return sendJson(res, 403, { error: '소유자만 초대할 수 있어요' });
    }

    let target;
    try {
      target = await db.auth.getUser({ email });
    } catch {
      target = null;
    }
    if (!target?.id) {
      return sendJson(res, 404, { error: '등록된 사용자만 초대할 수 있어요' });
    }
    if (target.id === caller.id) {
      return sendJson(res, 400, { error: '자기 자신은 초대할 수 없어요' });
    }

    const existing = findMemberForUser(board.members, target.id);
    if (existing) {
      await db.transact(
        memberRoleTxs(db.tx, {
          boardId,
          memberId: existing.id,
          userId: target.id,
          role,
        }),
      );
      return sendJson(res, 200, { ok: true, memberId: existing.id, updated: true });
    }

    const mid = id();
    const { txs } = createMemberTxs(db.tx, {
      boardId,
      userId: target.id,
      role,
      email,
      memberId: mid,
    });
    await db.transact(txs);
    return sendJson(res, 200, { ok: true, memberId: mid, updated: false });
  } catch (err) {
    console.error('invite failed', err);
    return sendJson(res, 500, { error: '초대에 실패했어요' });
  }
}
