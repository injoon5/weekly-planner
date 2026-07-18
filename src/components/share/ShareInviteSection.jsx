import { useState } from 'react';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { UserPlus } from 'lucide-react';
import { UiSelect } from '../ui/UiSelect.jsx';
import { menus } from '../../styles/menus.js';
import { ui } from '../../styles/ui.js';
import { isOk } from '../../lib/command-result.js';
import { ROLE_OPTS } from './ShareSettingsFields.jsx';

export function InviteSection({ busy, refreshToken, onInvite, run }) {
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
        <span {...stylex.props(menus.miLabel)}>초대</span>
      </button>
    </>
  );
}
