import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Copy, KeyRound, Link2, Link2Off, LogOut, RefreshCw, UserPlus, X } from 'lucide-react';
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
  onUpdateShare,
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

  // Keep the local mode/role selects honest when the live share changes
  // (e.g. after applying an update, or the popover staying open across sync).
  useEffect(() => {
    if (!share) return;
    setMode(share.mode === 'password' ? 'password' : 'open');
    setRole(share.role === 'editor' ? 'editor' : 'viewer');
  }, [share?.id, share?.mode, share?.role]);

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
      <div {...stylex.props(menus.mcap, menus.mcapStrong, menus.mcapFirst)}>링크 공유</div>

      {share ? (
        <>
          <div {...stylex.props(menus.shareStatus)}>
            {share.mode === 'password' ? '비밀번호 필요 · ' : '공개 링크 · '}
            {share.role === 'editor' ? '편집 가능' : '보기 전용'}
          </div>
          <div {...stylex.props(menus.shareUrl)}>{shareUrl(share.token)}</div>
          {isOwner && (
            <>
              <div {...stylex.props(menus.drow)}>
                <span {...stylex.props(menus.drowLabel)}>모드</span>
                <select
                  {...stylex.props(ui.input, ui.inputSm, ui.select, menus.drowInput)}
                  aria-label="공유 모드"
                  value={mode}
                  disabled={busy}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMode(v);
                    // Password mode waits for the input below; open applies now.
                    if (v === 'open' && share.mode !== 'open') {
                      run(async () => {
                        const ok = await onUpdateShare({ mode: 'open' });
                        if (!ok) setMode('password');
                      });
                    }
                  }}
                >
                  <option value="open">공개 링크</option>
                  <option value="password">비밀번호</option>
                </select>
              </div>
              <div {...stylex.props(menus.drow)}>
                <span {...stylex.props(menus.drowLabel)}>권한</span>
                <select
                  {...stylex.props(ui.input, ui.inputSm, ui.select, menus.drowInput)}
                  aria-label="공유 권한"
                  value={role}
                  disabled={busy}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRole(v);
                    run(async () => {
                      const ok = await onUpdateShare({ role: v });
                      if (!ok) setRole(share.role === 'editor' ? 'editor' : 'viewer');
                    });
                  }}
                >
                  <option value="viewer">보기</option>
                  <option value="editor">편집</option>
                </select>
              </div>
              {mode === 'password' && (
                <>
                  <div {...stylex.props(menus.pin)}>
                    <input
                      {...stylex.props(ui.input, ui.inputSm)}
                      type="password"
                      placeholder={share.mode === 'password' ? '새 비밀번호' : '비밀번호'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    {...stylex.props(menus.mi)}
                    disabled={busy || !password}
                    onClick={() =>
                      run(async () => {
                        const ok = await onUpdateShare({ mode: 'password', password });
                        if (ok) setPassword('');
                      })
                    }
                  >
                    <span {...stylex.props(menus.miIconWrap)}>
                      <KeyRound size={14} strokeWidth={1.75} />
                    </span>
                    <span {...stylex.props(menus.miLabel)}>
                      {share.mode === 'password' ? '비밀번호 변경' : '비밀번호 설정'}
                    </span>
                  </button>
                </>
              )}
            </>
          )}
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
          {isOwner && (
            <>
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
            </>
          )}
        </>
      ) : (
        isOwner && (
          <>
            <div {...stylex.props(menus.drow)}>
              <span {...stylex.props(menus.drowLabel)}>모드</span>
              <select
                {...stylex.props(ui.input, ui.inputSm, ui.select, menus.drowInput)}
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
                {...stylex.props(ui.input, ui.inputSm, ui.select, menus.drowInput)}
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
          <div {...stylex.props(menus.mcap, menus.mcapStrong)}>멤버 초대</div>
          <div {...stylex.props(menus.mcap, menus.mcapTight)}>
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
              {...stylex.props(ui.input, ui.inputSm, ui.select, menus.drowInput)}
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
          <div {...stylex.props(menus.mcap, menus.mcapStrong)}>멤버</div>
          {members.map((m) => {
            const uid = m.user?.id || m.user;
            const label = m.email || m.user?.email || uid?.slice?.(0, 8) || '멤버';
            return (
              <div key={m.id} {...stylex.props(menus.memberRow)}>
                <span {...stylex.props(menus.memberName)} title={label}>
                  {label}
                </span>
                {isOwner ? (
                  <>
                    <select
                      {...stylex.props(ui.input, ui.inputSm, ui.select, menus.memberRoleSelect)}
                      aria-label={`${label} 역할`}
                      value={m.role === 'editor' ? 'editor' : 'viewer'}
                      onChange={(e) => onUpdateRole(m.id, uid, e.target.value)}
                    >
                      <option value="viewer">보기</option>
                      <option value="editor">편집</option>
                    </select>
                    <button
                      type="button"
                      {...stylex.props(menus.memberRemove)}
                      title="제거"
                      aria-label={`${label} 제거`}
                      onClick={() => onRemoveMember(m.id, uid)}
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </>
                ) : (
                  <span {...stylex.props(menus.memberRoleText)}>
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
            <span {...stylex.props(menus.miIconWrap)}>
              <LogOut size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>나가기</span>
          </button>
        </>
      )}
    </>
  );
}
