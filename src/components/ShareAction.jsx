import { lazy, Suspense, useLayoutEffect, useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Share2, X } from 'lucide-react';
import { db } from '../db/instant.js';
import { findMemberForUser } from '../sharing/member-policy.js';
import { menus } from '../styles/menus.js';
import { planner } from '../styles/planner.js';
import { Sheet } from './ui/sheet.js';

const SharePanel = lazy(() =>
  import('./SharePanel.jsx').then((m) => ({ default: m.SharePanel })),
);

/** Share sheet trigger; hidden unless the user owns the board or is a member. */
export function ShareAction({ board, user, isOwner }) {
  const auth = db.useAuth();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const myMembership = useMemo(
    () => findMemberForUser(board?.members, user?.id),
    [board, user],
  );

  useLayoutEffect(() => {
    setShown(open);
  }, [open]);

  const shareDetail = db.useQuery(
    open && board?.id
      ? {
          boards: {
            $: { where: { id: board.id } },
            members: { user: {} },
            shares: {},
            editors: {},
          },
        }
      : null,
  );
  const richBoard = shareDetail.data?.boards?.[0]
    ? { ...board, ...shareDetail.data.boards[0] }
    : board;

  if (!isOwner && !myMembership) return null;

  return (
    <>
      <button
        {...stylex.props(planner.ibtn)}
        type="button"
        aria-label="공유"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Share2 size={15} strokeWidth={1.75} />
      </button>

      <Sheet.Root
        open={shown}
        onOpenChange={(next) => {
          setShown(next);
          if (!next) setOpen(false);
        }}
      >
        <Sheet.Portal>
          <Sheet.Backdrop {...stylex.props(menus.shareSheetScrim)} />
          <Sheet.Viewport>
            <Sheet.Popup {...stylex.props(menus.shareSheet)}>
              <div {...stylex.props(menus.shareSheetBody)}>
              <header {...stylex.props(menus.shareSheetHead)}>
                <Sheet.Title {...stylex.props(menus.shareSheetTitle)}>공유</Sheet.Title>
                <Sheet.Close {...stylex.props(menus.shareSheetClose)} aria-label="닫기">
                  <X size={17} strokeWidth={1.9} />
                </Sheet.Close>
              </header>
              {open ? (
                <Suspense fallback={<div {...stylex.props(planner.boot)}>불러오는 중…</div>}>
                  <SharePanel
                    board={richBoard}
                    isOwner={isOwner}
                    user={user}
                    refreshToken={auth.user?.refresh_token}
                    myMembershipId={myMembership?.id}
                  />
                </Suspense>
              ) : null}
              </div>
            </Sheet.Popup>
          </Sheet.Viewport>
        </Sheet.Portal>
      </Sheet.Root>
    </>
  );
}
