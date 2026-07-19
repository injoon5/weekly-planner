import { useEffect, useState } from 'react';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Copy, KeyRound, Link2, Link2Off, LogOut, RefreshCw, UserPlus, X } from 'lucide-react';
import { useShareActions } from '../hooks/useShareActions.js';
import { enabledShareOf } from '../sharing/share-policy.js';
import { UiSelect } from './ui/UiSelect.jsx';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';
import { linkedId } from '../lib/links.js';
import { isOk } from '../lib/command-result.js';
import { sharePath } from '../sharing/share.js';
import { t } from '../strings.js';

const MODE_OPTS = [
  { value: 'open', label: t.share.modeOpen },
  { value: 'password', label: t.share.modePassword },
];

const ROLE_OPTS = [
  { value: 'viewer', label: t.share.roleViewer },
  { value: 'editor', label: t.share.roleEditor },
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
        <span {...stylex.props(menus.drowLabel)}>{t.share.mode}</span>
        <UiSelect
          ariaLabel={t.share.shareModeAria}
          items={MODE_OPTS}
          value={mode}
          disabled={busy}
          xstyle={menus.drowInput}
          onValueChange={onModeChange}
        />
      </div>
      <div {...stylex.props(menus.drow)}>
        <span {...stylex.props(menus.drowLabel)}>{t.share.permission}</span>
        <UiSelect
          ariaLabel={t.share.sharePermAria}
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
      <div {...stylex.props(menus.mcap, menus.mcapStrong)}>{t.share.inviteMember}</div>
      <div {...stylex.props(menus.mcap, menus.mcapTight)}>{t.share.inviteHint}</div>
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
        <span {...stylex.props(menus.drowLabel)}>{t.share.role}</span>
        <UiSelect
          ariaLabel={t.share.inviteRoleAria}
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
        onClick={() => {
          void (async () => {
            const result = await run(() =>
              onInvite({ email: email.trim(), role, refreshToken }),
            );
            if (isOk(result)) setEmail('');
          })();
        }}
      >
        <span {...stylex.props(menus.miIconWrap)}>
          <UserPlus size={14} strokeWidth={1.75} />
        </span>
        <span {...stylex.props(menus.miLabel)}>{t.share.invite}</span>
      </button>
    </>
  );
}

function MembersSection({ members, isOwner, onUpdateRole, onRemoveMember }) {
  if (!members.length) return null;

  return (
    <>
      <Separator {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap, menus.mcapStrong)}>{t.share.members}</div>
      {members.map((member) => {
        const userId = linkedId(member.user);
        const label =
          member.email || member.user?.email || userId?.slice?.(0, 8) || t.share.member;
        return (
          <div key={member.id} {...stylex.props(menus.memberRow)}>
            <span {...stylex.props(menus.memberName)} title={label}>
              {label}
            </span>
            {isOwner ? (
              <>
                <UiSelect
                  ariaLabel={t.a11y.memberRole(label)}
                  items={ROLE_OPTS}
                  value={member.role === 'editor' ? 'editor' : 'viewer'}
                  xstyle={menus.memberRoleSelect}
                  onValueChange={(role) => void onUpdateRole(member.id, userId, role)}
                />
                <button
                  type="button"
                  {...stylex.props(menus.memberRemove)}
                  title={t.share.remove}
                  aria-label={t.a11y.memberRemove(label)}
                  onClick={() => void onRemoveMember(member.id, userId)}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </>
            ) : (
              <span {...stylex.props(menus.memberRoleText)}>
                {member.role === 'editor' ? t.share.roleEditor : t.share.roleViewer}
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
      <div {...stylex.props(menus.mcap, menus.mcapStrong, menus.mcapFirst)}>{t.share.heading}</div>

      {share ? (
        <>
          <div {...stylex.props(menus.shareStatus)}>
            {share.mode === 'password' ? t.share.statusPassword : t.share.statusOpen}
            {share.role === 'editor' ? t.share.canEdit : t.share.viewerOnly}
          </div>
          <button
            type="button"
            {...stylex.props(menus.shareUrl)}
            title={t.share.copyLinkTitle}
            aria-label={t.share.copyLinkAria(sharePath(share.token))}
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
                passwordPlaceholder={share.mode === 'password' ? t.share.newPassword : t.share.password}
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
                      {share.mode === 'password' ? t.share.changePassword : t.share.setPassword}
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
            <span {...stylex.props(menus.miLabel)}>{t.share.copyLink}</span>
          </button>
          {isOwner && (
            <>
              <button
                type="button"
                {...stylex.props(menus.mi)}
                disabled={busy || share.mode === 'password'}
                title={share.mode === 'password' ? t.share.passwordResetTitle : undefined}
                onClick={() => void withBusy(actions.rotateShare)}
              >
                <span {...stylex.props(menus.miIconWrap)}>
                  <RefreshCw size={14} strokeWidth={1.75} />
                </span>
                <span {...stylex.props(menus.miLabel)}>{t.share.newLink}</span>
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
                <span {...stylex.props(menus.miLabel)}>{t.share.disable}</span>
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
              passwordPlaceholder={t.share.password}
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
              <span {...stylex.props(menus.miLabel)}>{t.share.createLink}</span>
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
            <span {...stylex.props(menus.miLabel)}>{t.share.leave}</span>
          </button>
        </>
      )}
    </>
  );
}
