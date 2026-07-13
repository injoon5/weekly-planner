import { Separator } from '@base-ui/react/separator';
import { Switch } from '@base-ui/react/switch';
import { Toggle } from '@base-ui/react/toggle';
import * as stylex from '@stylexjs/stylex';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';

function SwitchRow({ label, checked, onChange }) {
  return (
    <label {...stylex.props(menus.mi)}>
      <span {...stylex.props(menus.miLabel, menus.miGrow)}>{label}</span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className={(state) =>
          stylex.props(menus.switchTrack, state.checked && menus.switchTrackOn).className
        }
      >
        <Switch.Thumb
          className={(state) =>
            stylex.props(menus.switchThumb, state.checked && menus.switchThumbOn).className
          }
        />
      </Switch.Root>
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

      <Separator {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap, menus.mcapStrong)}>색상 필터 · 이름</div>

      {views.palette.map((c) => {
        const on = !views.hiddenColors.includes(c);
        return (
          <div key={c} {...stylex.props(menus.drow, menus.colorRow)}>
            <Toggle
              {...stylex.props(menus.swatch)}
              data-color={c}
              pressed={on}
              aria-label={`${views.colorLabel(c)} ${on ? '숨기기' : '보이기'}`}
              title={on ? '숨기기' : '보이기'}
              onPressedChange={() => views.toggleColor(c)}
            >
              <span {...stylex.props(menus.swatchDot, !on && menus.swatchDotOff)} />
            </Toggle>
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
