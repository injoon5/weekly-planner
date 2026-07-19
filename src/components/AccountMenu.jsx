import { useState } from 'react';
import { Popover } from '@base-ui/react/popover';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { useNavigate } from '@tanstack/react-router';
import { CircleUserRound, LogOut, Settings2, UserPlus } from 'lucide-react';
import { db } from '../db/instant.js';
import { menus } from '../styles/menus.js';
import { planner } from '../styles/planner.js';
import { ui } from '../styles/ui.js';
import { UpgradeDialog } from './UpgradeDialog.jsx';
import { MenuPopover } from './ui/MenuPopover.jsx';
import { t } from '../strings.js';

function UserMenu({ email, isGuest, onUpgrade, onAccount, onSignOut }) {
  return (
    <>
      {isGuest ? (
        <>
          <div {...stylex.props(menus.mcap, menus.mcapFirst)}>
            {t.account_menu.guestMode}
          </div>
          <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onUpgrade} />}>
            <span {...stylex.props(menus.miIconWrap)}>
              <UserPlus size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>{t.account_menu.createAccount}</span>
          </Popover.Close>
          <Separator {...stylex.props(menus.mdiv)} />
        </>
      ) : (
        email && <div {...stylex.props(menus.mcap, menus.mcapFirst)}>{email}</div>
      )}
      <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onAccount} />}>
        <span {...stylex.props(menus.miIconWrap)}>
          <Settings2 size={14} strokeWidth={1.75} />
        </span>
        <span {...stylex.props(menus.miLabel)}>{t.account_menu.accountSettings}</span>
      </Popover.Close>
      <Popover.Close render={<button {...stylex.props(menus.mi, menus.miRed)} onClick={onSignOut} />}>
        <span {...stylex.props(menus.miIconWrap)}>
          <LogOut size={14} strokeWidth={1.75} />
        </span>
        <span {...stylex.props(menus.miLabel)}>{t.account_menu.signOut}</span>
      </Popover.Close>
    </>
  );
}

/**
 * Header account cluster: guest upgrade CTA, the account popover menu, and
 * the upgrade dialog the two can open.
 */
export function AccountMenu({ user }) {
  const auth = db.useAuth();
  const navigate = useNavigate();
  const isGuest = Boolean(auth.user?.isGuest);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <>
      {isGuest && (
        <button
          {...stylex.props(planner.btn, ui.btnPlain)}
          type="button"
          onClick={() => setUpgradeOpen(true)}
        >
          <UserPlus size={14} strokeWidth={1.75} />
          <span {...stylex.props(planner.btnLabelHide)}>{t.account_menu.createAccount}</span>
        </button>
      )}
      <MenuPopover
        trigger={
          <button
            {...stylex.props(planner.ibtn)}
            type="button"
            title={user.email || (isGuest ? t.a11y.guest : t.a11y.account)}
            aria-label={t.a11y.accountMenu}
          >
            <CircleUserRound size={15} strokeWidth={1.75} />
          </button>
        }
      >
        <UserMenu
          email={user.email}
          isGuest={isGuest}
          onUpgrade={() => setUpgradeOpen(true)}
          onAccount={() => void navigate({ to: '/account' })}
          onSignOut={() => db.auth.signOut()}
        />
      </MenuPopover>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
