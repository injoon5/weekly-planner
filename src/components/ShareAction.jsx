import { lazy, Suspense, useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Share2 } from 'lucide-react';
import { db } from '../db/instant.js';
import { findMemberForUser } from '../sharing/member-policy.js';
import { planner } from '../styles/planner.js';
import { MenuPopover } from './ui/MenuPopover.jsx';
import { t } from '../strings.js';

const SharePanel = lazy(() =>
  import('./SharePanel.jsx').then((m) => ({ default: m.SharePanel })),
);

/** Share popover trigger; hidden unless the user owns the board or is a member. */
export function ShareAction({ board, user, isOwner }) {
  const auth = db.useAuth();
  const [open, setOpen] = useState(false);
  const myMembership = useMemo(
    () => findMemberForUser(board?.members, user?.id),
    [board, user],
  );

  // When open, hydrate shares + nested member users (not on the always-on detail query).
  const shareDetail = db.useQuery(
    open && board?.id
      ? {
          boards: {
            $: { where: { id: board.id } },
            members: { user: {} },
            shares: {},
          },
        }
      : null,
  );
  const richBoard = shareDetail.data?.boards?.[0]
    ? { ...board, ...shareDetail.data.boards[0] }
    : board;

  if (!isOwner && !myMembership) return null;

  return (
    <MenuPopover
      width={264}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button {...stylex.props(planner.ibtn)} type="button" aria-label={t.a11y.share}>
          <Share2 size={15} strokeWidth={1.75} />
        </button>
      }
    >
      {open ? (
        <Suspense fallback={<div {...stylex.props(planner.boot)}>{t.common.loading}</div>}>
          <SharePanel
            board={richBoard}
            isOwner={isOwner}
            user={user}
            refreshToken={auth.user?.refresh_token}
            myMembershipId={myMembership?.id}
          />
        </Suspense>
      ) : null}
    </MenuPopover>
  );
}
