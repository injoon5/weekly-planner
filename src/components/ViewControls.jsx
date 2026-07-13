import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';

function SwitchRow({ label, checked, onChange }) {
  const [focused, setFocused] = useState(false);

  return (
    <label {...stylex.props(menus.mi)}>
      <span {...stylex.props(menus.miLabel, menus.miGrow)}>{label}</span>
      <span
        aria-hidden
        {...stylex.props(
          menus.switchTrack,
          checked && menus.switchTrackOn,
          focused && menus.switchTrackFocus,
        )}
      >
        <span {...stylex.props(menus.switchThumb, checked && menus.switchThumbOn)} />
      </span>
      <input
        type="checkbox"
        role="switch"
        {...stylex.props(menus.srOnly)}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        onFocus={(e) => setFocused(e.target.matches(':focus-visible'))}
        onBlur={() => setFocused(false)}
      />
    </label>
  );
}

export function ViewControls({ views }) {
  if (!views) return null;

  return (
    <>
      <div {...stylex.props(menus.mcap, menus.mcapStrong, menus.mcapFirst)}>보기</div>

      <SwitchRow
        label="주말 숨기기"
        checked={views.hideWeekend}
        onChange={views.setHideWeekend}
      />
      <SwitchRow label="촘촘하게" checked={views.compact} onChange={views.setCompact} />
      <SwitchRow label="메모 표시" checked={views.showMemos} onChange={views.setShowMemos} />

      <div {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap, menus.mcapStrong)}>색상 필터 · 이름</div>

      {views.palette.map((c) => {
        const on = !views.hiddenColors.includes(c);
        return (
          <div key={c} {...stylex.props(menus.drow, menus.colorRow)}>
            <button
              type="button"
              {...stylex.props(menus.swatch)}
              data-color={c}
              aria-pressed={on}
              aria-label={`${views.colorLabel(c)} ${on ? '숨기기' : '보이기'}`}
              title={on ? '숨기기' : '보이기'}
              onClick={() => views.toggleColor(c)}
            >
              <span {...stylex.props(menus.swatchDot, !on && menus.swatchDotOff)} />
            </button>
            {views.canRenameColors ? (
              <input
                {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                value={views.colorLabel(c)}
                maxLength={20}
                aria-label={`${c} 이름`}
                onChange={(e) => views.setColorLabel(c, e.target.value)}
              />
            ) : (
              <span {...stylex.props(menus.miLabel)}>{views.colorLabel(c)}</span>
            )}
          </div>
        );
      })}
    </>
  );
}
