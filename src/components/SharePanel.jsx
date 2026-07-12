import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Copy, Link2, Link2Off, RefreshCw, UserPlus } from 'lucide-react';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';
import { shareUrl } from '../share.js';

export function SharePanel({
  board,
  isOwner,
  user,
  refreshToken,
  myMembershipId,
  onEnableShare,
  onDisableShare,
  onRotateShare,
  onCopyLink,
  onInvite,
  onUpdateRole,
  onRemoveMember,
  onLeave,
}) {
  const share = (board?.shares || []).find((s) => s.enabled) || null;
  const [mode, setMode] = useState(share?.mode === 'password' ? 'password' : 'open');
  const [role, setRole] = useState(share?.role === 'editor' ? 'editor' : 'viewer');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [busy, setBusy] = useState(false);

  const members = board?.members || [];

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div {...stylex.props(menus.mcap)} style={{ paddingTop: 6 }}>
        링크 공유
      </div>

      {share ? (
        <>
          <div {...stylex.props(menus.mcap, menus.hintFine)} style={{ paddingTop: 0 }}>
            {share.mode === 'password' ? '비밀번호 필요 · ' : '공개 링크 · '}
            {share.role === 'editor' ? '편집 가능' : '보기 전용'}
          </div>
          <button
            type="button"
            {...stylex.props(menus.mi)}
            disabled={busy}
            onClick={() => run(onCopyLink)}
          >
            <span {...stylex.props(menus.miIconWrap)}>
              <Copy size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>링크 복사</span>
          </button>
          <button
            type="button"
            {...stylex.props(menus.mi)}
            disabled={busy || share.mode === 'password'}
            title={share.mode === 'password' ? '비밀번호 공유는 다시 설정하세요' : undefined}
            onClick={() => run(onRotateShare)}
          >
            <span {...stylex.props(menus.miIconWrap)}>
              <RefreshCw size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>새 링크</span>
          </button>
          <button
            type="button"
            {...stylex.props(menus.mi, menus.miRed)}
            disabled={busy}
            onClick={() => run(onDisableShare)}
          >
            <span {...stylex.props(menus.miIconWrap)}>
              <Link2Off size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>공유 끄기</span>
          </button>
          <div {...stylex.props(menus.mcap, menus.hintFine)} style={{ wordBreak: 'break-all' }}>
            {shareUrl(share.token)}
          </div>
        </>
      ) : (
        isOwner && (
          <>
            <div {...stylex.props(menus.drow)}>
              <span {...stylex.props(menus.drowLabel)}>모드</span>
              <select
                {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="open">공개 링크</option>
                <option value="password">비밀번호</option>
              </select>
            </div>
            <div {...stylex.props(menus.drow)}>
              <span {...stylex.props(menus.drowLabel)}>권한</span>
              <select
                {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="viewer">보기</option>
                <option value="editor">편집</option>
              </select>
            </div>
            {mode === 'password' && (
              <div {...stylex.props(menus.pin)}>
                <input
                  {...stylex.props(ui.input, ui.inputSm)}
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}
            <button
              type="button"
              {...stylex.props(menus.mi)}
              disabled={busy || (mode === 'password' && !password)}
              onClick={() =>
                run(async () => {
                  await onEnableShare({ mode, role, password });
                  setPassword('');
                })
              }
            >
              <span {...stylex.props(menus.miIconWrap)}>
                <Link2 size={14} strokeWidth={1.75} />
              </span>
              <span {...stylex.props(menus.miLabel)}>공유 링크 만들기</span>
            </button>
          </>
        )
      )}

      {isOwner && (
        <>
          <div {...stylex.props(menus.mdiv)} />
          <div {...stylex.props(menus.mcap)}>멤버 초대</div>
          <div {...stylex.props(menus.mcap, menus.hintFine)} style={{ paddingTop: 0 }}>
            등록된 계정만 초대할 수 있어요
          </div>
          <div {...stylex.props(menus.pin)}>
            <input
              {...stylex.props(ui.input, ui.inputSm)}
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div {...stylex.props(menus.drow)}>
            <span {...stylex.props(menus.drowLabel)}>역할</span>
            <select
              {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="viewer">보기</option>
              <option value="editor">편집</option>
            </select>
          </div>
          <button
            type="button"
            {...stylex.props(menus.mi)}
            disabled={busy || !email.trim()}
            onClick={() =>
              run(async () => {
                const ok = await onInvite({
                  email: email.trim(),
                  role: inviteRole,
                  refreshToken,
                });
                if (ok) setEmail('');
              })
            }
          >
            <span {...stylex.props(menus.miIconWrap)}>
              <UserPlus size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>초대</span>
          </button>
        </>
      )}

      {members.length > 0 && (
        <>
          <div {...stylex.props(menus.mdiv)} />
          <div {...stylex.props(menus.mcap)}>멤버</div>
          {members.map((m) => {
            const uid = m.user?.id || m.user;
            const label = m.email || m.user?.email || uid?.slice?.(0, 8) || '멤버';
            return (
              <div key={m.id} {...stylex.props(menus.drow)} style={{ alignItems: 'center' }}>
                <span
                  {...stylex.props(menus.miLabel)}
                  style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {label}
                </span>
                {isOwner ? (
                  <>
                    <select
                      {...stylex.props(ui.input, ui.inputSm)}
                      style={{ width: 72, paddingInline: 4 }}
                      value={m.role === 'editor' ? 'editor' : 'viewer'}
                      onChange={(e) => onUpdateRole(m.id, uid, e.target.value)}
                    >
                      <option value="viewer">보기</option>
                      <option value="editor">편집</option>
                    </select>
                    <button
                      type="button"
                      {...stylex.props(menus.mi, menus.miRed)}
                      style={{ width: 'auto', padding: '6px 8px' }}
                      onClick={() => onRemoveMember(m.id, uid)}
                    >
                      제거
                    </button>
                  </>
                ) : (
                  <span {...stylex.props(menus.drowLabel)}>
                    {m.role === 'editor' ? '편집' : '보기'}
                  </span>
                )}
              </div>
            );
          })}
        </>
      )}

      {!isOwner && myMembershipId && (
        <>
          <div {...stylex.props(menus.mdiv)} />
          <button
            type="button"
            {...stylex.props(menus.mi, menus.miRed)}
            onClick={() => onLeave(myMembershipId, user?.id)}
          >
            <span {...stylex.props(menus.miLabel)}>나가기</span>
          </button>
        </>
      )}
    </>
  );
}
