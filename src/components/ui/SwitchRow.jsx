import { Switch } from '@base-ui/react/switch';
import * as stylex from '@stylexjs/stylex';
import { menus } from '../../styles/menus.js';

export function SwitchRow({ label, checked, onChange }) {
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
