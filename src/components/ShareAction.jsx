import { useMemo } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Share2 } from 'lucide-react';
import { db } from '../db/instant.js';
import { findMemberForUser } from '../sharing/member-policy.js';
import { planner } from '../styles/planner.js';
import { SharePanel } from './SharePanel.jsx';
import { MenuPopover } from './ui/MenuPopover.jsx';

/** Share popover trigger; hidden unless the user owns the board or is a member. */
export function ShareAction({ board, user, isOwner }) {
  const auth = db.useAuth();
  const myMembership = useMemo(
    () => findMemberForUser(board?.members, user?.id),
    [board, user],
  );

  if (!isOwner && !myMembership) return null;

  return (
    <MenuPopover
      width={264}
      trigger={
        <button {...stylex.props(planner.ibtn)} type="button" aria-label="공유">
          <Share2 size={15} strokeWidth={1.75} />
        </button>
      }
    >
      <SharePanel
        board={board}
        isOwner={isOwner}
        user={user}
        refreshToken={auth.user?.refresh_token}
        myMembershipId={myMembership?.id}
      />
    </MenuPopover>
  );
}
