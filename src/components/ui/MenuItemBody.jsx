import * as stylex from '@stylexjs/stylex';
import { menus } from '../../styles/menus.js';

/**
 * The icon + label pair inside a menu row. The clickable wrapper varies by
 * caller (a plain `<button {...menus.mi}>`, a `Popover.Close render={…}`, a
 * `HoldToConfirm`), so this renders only the inner content those wrappers share.
 *
 * @param {{ icon: import('lucide-react').LucideIcon, label: import('react').ReactNode }} props
 */
export function MenuItemBody({ icon: Icon, label }) {
  return (
    <>
      <span {...stylex.props(menus.miIconWrap)}>
        <Icon size={14} strokeWidth={1.75} />
      </span>
      <span {...stylex.props(menus.miLabel)}>{label}</span>
    </>
  );
}
