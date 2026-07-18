import { useEffect, useState } from 'react';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Copy, KeyRound, Link2, Link2Off, LogOut, RefreshCw } from 'lucide-react';
import { useShareActions } from '../hooks/useShareActions.js';
import { enabledShareOf } from '../sharing/share-policy.js';
import { menus } from '../styles/menus.js';
import { isOk } from '../lib/command-result.js';
import { sharePath } from '../sharing/share.js';
import { ShareSettingsFields } from './share/ShareSettingsFields.jsx';
import { InviteSection } from './share/ShareInviteSection.jsx';
import { MembersSection } from './share/ShareMembersSection.jsx';

export function SharePanel({
  board,
  isOwner,
  user,
  refreshToken,
  myMembershipId,
}) {
  const actions = useShareActions({ board, isOwner });
  const share = enabledShareOf(board);

  return (
    <SharePanelContent
      // Remount when the share row id changes (not every field patch).
      key={share?.id || 'new'}
      board={board}
      share={share}
      isOwner={isOwner}
      user={user}
      refreshToken={refreshToken}
      myMembershipId={myMembershipId}
      actions={actions}
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
  actions,
}) {
  const [mode, setMode] = useState(share?.mode === 'password' ? 'password' : 'open');
  const [role, setRole] = useState(share?.role === 'editor' ? 'editor' : 'viewer');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMode(share?.mode === 'password' ? 'password' : 'open');
    setRole(share?.role === 'editor' ? 'editor' : 'viewer');
  }, [share?.mode, share?.role]);

  const members = board?.members || [];

  const withBusy = async (work) => {
    setBusy(true);
    try {
      return await work();
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
            onClick={() => void withBusy(actions.copyShareLink)}
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
                    void (async () => {
                      const result = await withBusy(() => actions.updateShare({ mode: 'open' }));
                      if (!isOk(result)) setMode('password');
                    })();
                  }
                }}
                onRoleChange={(nextRole) => {
                  setRole(nextRole);
                  void (async () => {
                    const result = await withBusy(() => actions.updateShare({ role: nextRole }));
                    if (!isOk(result)) setRole(share.role === 'editor' ? 'editor' : 'viewer');
                  })();
                }}
              />
              {mode === 'password' && (
                <>
                  <button
                    type="button"
                    {...stylex.props(menus.mi)}
                    disabled={busy || !password}
                    onClick={() => {
                      void (async () => {
                        const result = await withBusy(() =>
                          actions.updateShare({ mode: 'password', password }),
                        );
                        if (isOk(result)) setPassword('');
                      })();
                    }}
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
            onClick={() => void withBusy(actions.copyShareLink)}
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
                onClick={() => void withBusy(actions.rotateShare)}
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
                onClick={() => void withBusy(actions.disableShare)}
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
              onClick={() => {
                void (async () => {
                  await withBusy(() => actions.enableShare({ mode, role, password }));
                  setPassword('');
                })();
              }}
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
          onInvite={actions.inviteMember}
          run={withBusy}
        />
      )}

      <MembersSection
        board={board}
        members={members}
        isOwner={isOwner}
        onUpdateRole={actions.updateMemberRole}
        onRemoveMember={actions.removeMember}
      />

      {!isOwner && myMembershipId && (
        <>
          <Separator {...stylex.props(menus.mdiv)} />
          <button
            type="button"
            {...stylex.props(menus.mi, menus.miRed)}
            onClick={() => void actions.leaveBoard(myMembershipId, user?.id)}
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
