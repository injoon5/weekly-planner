import { useState } from 'react';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Copy, KeyRound, Link2, Link2Off, LogOut, RefreshCw, UserPlus, X } from 'lucide-react';
import { useShareActions } from '../hooks/useShareActions.js';
import { UiSelect } from './ui/UiSelect.jsx';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';
import { linkedId } from '../links.js';
import { isOk } from '../command-result.js';
import { sharePath } from '../share.js';
import { toast } from './ui/Toaster.jsx';

const MODE_OPTS = [
  { value: 'open', label: '공개 링크' },
  { value: 'password', label: '비밀번호' },
];

const ROLE_OPTS = [
  { value: 'viewer', label: '보기' },
  { value: 'editor', label: '편집' },
];

function ShareSettingsFields({
  mode,
  role,
  password,
  passwordPlaceholder,
  busy = false,
  onModeChange,
  onRoleChange,
  onPasswordChange,
}) {
  return (
    <>
      <div {...stylex.props(menus.drow)}>
        <span {...stylex.props(menus.drowLabel)}>모드</span>
        <UiSelect
          ariaLabel="공유 모드"
          items={MODE_OPTS}
          value={mode}
          disabled={busy}
          xstyle={menus.drowInput}
          onValueChange={onModeChange}
        />
      </div>
      <div {...stylex.props(menus.drow)}>
        <span {...stylex.props(menus.drowLabel)}>권한</span>
        <UiSelect
          ariaLabel="공유 권한"
          items={ROLE_OPTS}
          value={role}
          disabled={busy}
          xstyle={menus.drowInput}
          onValueChange={onRoleChange}
        />
      </div>
      {mode === 'password' && (
        <div {...stylex.props(menus.pin)}>
          <input
            {...stylex.props(ui.input, ui.inputSm)}
            type="password"
            placeholder={passwordPlaceholder}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
        </div>
      )}
    </>
  );
}

function InviteSection({ busy, refreshToken, onInvite, run }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  return (
    <>
      <Separator {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap, menus.mcapStrong)}>멤버 초대</div>
      <div {...stylex.props(menus.mcap, menus.mcapTight)}>등록된 계정만 초대할 수 있어요</div>
      <div {...stylex.props(menus.pin)}>
        <input
          {...stylex.props(ui.input, ui.inputSm)}
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div {...stylex.props(menus.drow)}>
        <span {...stylex.props(menus.drowLabel)}>역할</span>
        <UiSelect
          ariaLabel="초대 역할"
          items={ROLE_OPTS}
          value={role}
          xstyle={menus.drowInput}
          onValueChange={setRole}
        />
      </div>
      <button
        type="button"
        {...stylex.props(menus.mi)}
        disabled={busy || !email.trim()}
        onClick={() =>
          void run(async () => {
            const result = await onInvite({ email: email.trim(), role, refreshToken });
            if (isOk(result)) setEmail('');
          })
        }
      >
        <span {...stylex.props(menus.miIconWrap)}>
          <UserPlus size={14} strokeWidth={1.75} />
        </span>
        <span {...stylex.props(menus.miLabel)}>초대</span>
      </button>
    </>
  );
}

function MembersSection({ members, isOwner, onUpdateRole, onRemoveMember }) {
  if (!members.length) return null;

  return (
    <>
      <Separator {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap, menus.mcapStrong)}>멤버</div>
      {members.map((member) => {
        const userId = linkedId(member.user);
        const label =
          member.email || member.user?.email || userId?.slice?.(0, 8) || '멤버';
        return (
          <div key={member.id} {...stylex.props(menus.memberRow)}>
            <span {...stylex.props(menus.memberName)} title={label}>
              {label}
            </span>
            {isOwner ? (
              <>
                <UiSelect
                  ariaLabel={`${label} 역할`}
                  items={ROLE_OPTS}
                  value={member.role === 'editor' ? 'editor' : 'viewer'}
                  xstyle={menus.memberRoleSelect}
                  onValueChange={(role) => void onUpdateRole(member.id, userId, role)}
                />
                <button
                  type="button"
                  {...stylex.props(menus.memberRemove)}
                  title="제거"
                  aria-label={`${label} 제거`}
                  onClick={() => void onRemoveMember(member.id, userId)}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </>
            ) : (
              <span {...stylex.props(menus.memberRoleText)}>
                {member.role === 'editor' ? '편집' : '보기'}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

export function SharePanel({
  board,
  isOwner,
  user,
  refreshToken,
  myMembershipId,
}) {
  const actions = useShareActions({ board, isOwner, toast });
  const share = (board?.shares || []).find((item) => item.enabled) || null;

  return (
    <SharePanelContent
      key={`${share?.id || 'new'}:${share?.mode || 'open'}:${share?.role || 'viewer'}`}
      board={board}
      share={share}
      isOwner={isOwner}
      user={user}
      refreshToken={refreshToken}
      myMembershipId={myMembershipId}
      onEnableShare={actions.enableShare}
      onUpdateShare={actions.updateShare}
      onDisableShare={actions.disableShare}
      onRotateShare={actions.rotateShare}
      onCopyLink={actions.copyShareLink}
      onInvite={actions.inviteMember}
      onUpdateRole={actions.updateMemberRole}
      onRemoveMember={actions.removeMember}
      onLeave={actions.leaveBoard}
    />
  );
}

function SharePanelContent({
  board,
  share,
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
  const [mode, setMode] = useState(share?.mode === 'password' ? 'password' : 'open');
  const [role, setRole] = useState(share?.role === 'editor' ? 'editor' : 'viewer');
  const [password, setPassword] = useState('');
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
      <div {...stylex.props(menus.mcap, menus.mcapStrong, menus.mcapFirst)}>링크 공유</div>

      {share ? (
        <>
          <div {...stylex.props(menus.shareStatus)}>
            {share.mode === 'password' ? '비밀번호 필요 · ' : '공개 링크 · '}
            {share.role === 'editor' ? '편집 가능' : '보기 전용'}
          </div>
          <button
            type="button"
            {...stylex.props(menus.shareUrl)}
            title="클릭해서 전체 링크 복사"
            aria-label={`공유 링크 ${sharePath(share.token)}, 클릭해서 복사`}
            disabled={busy}
            onClick={() => run(onCopyLink)}
          >
            {sharePath(share.token)}
          </button>
          {isOwner && (
            <>
              <ShareSettingsFields
                mode={mode}
                role={role}
                password={password}
                passwordPlaceholder={share.mode === 'password' ? '새 비밀번호' : '비밀번호'}
                busy={busy}
                onPasswordChange={setPassword}
                onModeChange={(nextMode) => {
                  setMode(nextMode);
                  // Password mode waits for the input below; open applies now.
                  if (nextMode === 'open' && share.mode !== 'open') {
                    void run(async () => {
                      const result = await onUpdateShare({ mode: 'open' });
                      if (!isOk(result)) setMode('password');
                    });
                  }
                }}
                onRoleChange={(nextRole) => {
                  setRole(nextRole);
                  void run(async () => {
                    const result = await onUpdateShare({ role: nextRole });
                    if (!isOk(result)) setRole(share.role === 'editor' ? 'editor' : 'viewer');
                  });
                }}
              />
              {mode === 'password' && (
                <>
                  <button
                    type="button"
                    {...stylex.props(menus.mi)}
                    disabled={busy || !password}
                    onClick={() =>
                      run(async () => {
                        const result = await onUpdateShare({ mode: 'password', password });
                        if (isOk(result)) setPassword('');
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
            <ShareSettingsFields
              mode={mode}
              role={role}
              password={password}
              passwordPlaceholder="비밀번호"
              busy={busy}
              onModeChange={setMode}
              onRoleChange={setRole}
              onPasswordChange={setPassword}
            />
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
        <InviteSection
          busy={busy}
          refreshToken={refreshToken}
          onInvite={onInvite}
          run={run}
        />
      )}

      <MembersSection
        members={members}
        isOwner={isOwner}
        onUpdateRole={onUpdateRole}
        onRemoveMember={onRemoveMember}
      />

      {!isOwner && myMembershipId && (
        <>
          <Separator {...stylex.props(menus.mdiv)} />
          <button
            type="button"
            {...stylex.props(menus.mi, menus.miRed)}
            onClick={() => void onLeave(myMembershipId, user?.id)}
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
