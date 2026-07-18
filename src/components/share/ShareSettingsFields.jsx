import * as stylex from '@stylexjs/stylex';
import { UiSelect } from '../ui/UiSelect.jsx';
import { menus } from '../../styles/menus.js';
import { ui } from '../../styles/ui.js';

const MODE_OPTS = [
  { value: 'open', label: '공개 링크' },
  { value: 'password', label: '비밀번호' },
];

export const ROLE_OPTS = [
  { value: 'viewer', label: '보기' },
  { value: 'editor', label: '편집' },
];

export function ShareSettingsFields({
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
