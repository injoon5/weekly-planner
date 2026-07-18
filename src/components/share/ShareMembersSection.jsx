import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { X } from 'lucide-react';
import { UiSelect } from '../ui/UiSelect.jsx';
import { menus } from '../../styles/menus.js';
import { linkedId } from '../../lib/links.js';
import { displayRoleForMember } from '../../sharing/member-policy.js';
import { ROLE_OPTS } from './ShareSettingsFields.jsx';

export function MembersSection({ board, members, isOwner, onUpdateRole, onRemoveMember }) {
  if (!members.length) return null;

  return (
    <>
      <Separator {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap, menus.mcapStrong)}>멤버</div>
      {members.map((member) => {
        const userId = linkedId(member.user);
        const label =
          member.email || member.user?.email || userId?.slice?.(0, 8) || '멤버';
        const role = displayRoleForMember(board, member);
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
                  value={role}
                  xstyle={menus.memberRoleSelect}
                  onValueChange={(next) => void onUpdateRole(member.id, userId, next)}
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
                {role === 'editor' ? '편집' : '보기'}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
