import { Popover } from '@base-ui/react/popover';
import * as stylex from '@stylexjs/stylex';
import { menus } from '../../styles/menus.js';

/**
 * Header popover shell (Base UI Popover): invisible backdrop that swallows the
 * outside press, collision-aware positioning, focus + Escape handling.
 *
 * Two modes:
 *  - trigger mode: pass `trigger` (a ReactElement rendered as Popover.Trigger).
 *  - controlled mode: pass `open`/`onOpenChange` and an `anchor` element
 *    (used for the board menu, whose trigger lives inside the tab strip).
 */
export function MenuPopover({
  trigger,
  width = 232,
  align = 'end',
  open,
  onOpenChange,
  anchor,
  children,
}) {
  const controlled = open !== undefined;

  return (
    <Popover.Root {...(controlled ? { open, onOpenChange } : {})}>
      {trigger ? <Popover.Trigger render={trigger} /> : null}
      <Popover.Portal>
        <Popover.Backdrop {...stylex.props(menus.mscrim)} />
        <Popover.Positioner
          anchor={anchor}
          side="bottom"
          align={align}
          sideOffset={6}
          collisionPadding={8}
          collisionAvoidance={{ side: 'flip', align: 'shift' }}
          style={{ zIndex: 90 }}
        >
          <Popover.Popup
            data-ui-pop=""
            {...stylex.props(menus.pop)}
            style={{ width: `min(${width}px, calc(100vw - 16px))` }}
            // Pointer opens keep focus where it was (no surprise keyboard on
            // mobile when a menu leads with an input); keyboard opens use the
            // default focus handoff into the popup.
            initialFocus={(openType) => (openType === 'keyboard' ? null : false)}
          >
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
