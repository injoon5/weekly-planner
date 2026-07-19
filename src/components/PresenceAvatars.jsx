import * as stylex from '@stylexjs/stylex';
import { menus } from '../styles/menus.js';
import { planner } from '../styles/planner.js';
import { MenuPopover } from './ui/MenuPopover.jsx';
import { t } from '../strings.js';

function roleLabel(role) {
  return role === 'editor' ? t.share.roleEditor : t.share.roleViewer;
}

function AvatarStack({ peers, max }) {
  const shown = peers.slice(0, max);
  const extra = peers.length - shown.length;

  return (
    <span {...stylex.props(planner.presence)}>
      {shown.map((p) => (
        <span
          key={p.id}
          {...stylex.props(planner.presenceDot)}
          style={{ backgroundColor: p.color }}
        >
          {(p.name || '?').slice(0, 1).toUpperCase()}
        </span>
      ))}
      {extra > 0 && <span {...stylex.props(planner.presenceMore)}>+{extra}</span>}
    </span>
  );
}

/** Header avatar stack; clicking it opens the list of everyone in the room. */
export function PresenceAvatars({ peers, max = 4 }) {
  if (!peers?.length) return null;

  return (
    <MenuPopover
      width={220}
      trigger={
        <button
          {...stylex.props(planner.presenceBtn)}
          type="button"
          aria-label={t.a11y.presenceNames(peers.length)}
          title={t.a11y.presenceCount(peers.length)}
        >
          <AvatarStack peers={peers} max={max} />
        </button>
      }
    >
      <div {...stylex.props(menus.mcap, menus.mcapStrong, menus.mcapFirst)}>
        {t.a11y.presenceHeading(peers.length)}
      </div>
      {peers.map((p) => (
        <div key={p.id} {...stylex.props(planner.peerRow)}>
          <span
            {...stylex.props(planner.presenceDot, planner.peerRowDot)}
            style={{ backgroundColor: p.color }}
          >
            {(p.name || '?').slice(0, 1).toUpperCase()}
          </span>
          <span {...stylex.props(menus.memberName)} title={p.name}>
            {p.name}
          </span>
          <span {...stylex.props(menus.memberRoleText)}>{roleLabel(p.role)}</span>
        </div>
      ))}
    </MenuPopover>
  );
}
