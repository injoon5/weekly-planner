import { Select } from '@base-ui/react/select';
import * as stylex from '@stylexjs/stylex';
import { Check, ChevronDown } from 'lucide-react';
import { colors } from '../../tokens.stylex.js';

const s = stylex.create({
  trigger: {
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    width: '100%',
    minWidth: 0,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: '8px',
    paddingBlock: '7px',
    paddingInline: '10px',
    backgroundColor: colors.field,
    color: colors.ink,
    fontSize: '12.5px',
    fontWeight: 550,
    fontFamily: 'inherit',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.45,
    textAlign: 'left',
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    transitionProperty: 'background-color, border-color, box-shadow',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    ':hover': {
      backgroundColor: colors.fieldH,
    },
    ':focus-visible': {
      backgroundColor: colors.paper,
      borderColor: colors.ink,
      boxShadow: '0 0 0 3px rgba(27,27,32,.07)',
    },
    ':disabled': {
      opacity: 0.55,
      cursor: 'default',
    },
  },

  value: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  icon: {
    display: 'flex',
    flexShrink: 0,
    color: colors.faint,
  },

  popup: {
    boxSizing: 'border-box',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    WebkitOverflowScrolling: 'touch',
    backgroundColor: colors.paper,
    borderRadius: '10px',
    padding: '4px',
    boxShadow: `0 0 0 1px ${colors.edge}, 0 4px 10px rgba(20,20,26,.08), 0 16px 40px -12px rgba(20,20,26,.30)`,
    outline: 'none',
  },

  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    minWidth: 'calc(var(--anchor-width) - 8px)',
    padding: '6px 8px 6px 9px',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: 550,
    letterSpacing: '-0.002em',
    fontVariantNumeric: 'tabular-nums',
    color: colors.ink,
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
  },

  itemText: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  indicator: {
    display: 'flex',
    flexShrink: 0,
    color: colors.ink,
  },
});

/**
 * Styled Base UI Select. `items` is [{ value, label }] (values may be numbers).
 * `xstyle` merges extra StyleX styles into the trigger (sizing variants).
 */
export function UiSelect({ items, value, onValueChange, ariaLabel, disabled, xstyle }) {
  return (
    <Select.Root items={items} value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        aria-label={ariaLabel}
        data-ui-select-trigger=""
        {...stylex.props(s.trigger, xstyle)}
      >
        <Select.Value {...stylex.props(s.value)} />
        <Select.Icon {...stylex.props(s.icon)}>
          <ChevronDown size={12} strokeWidth={1.75} />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          sideOffset={5}
          collisionPadding={8}
          style={{ zIndex: 110 }}
        >
          <Select.Popup data-ui-pop="" {...stylex.props(s.popup)}>
            <Select.List>
              {items.map((it) => (
                <Select.Item
                  key={it.value}
                  value={it.value}
                  data-ui-select-item=""
                  {...stylex.props(s.item)}
                >
                  <Select.ItemText {...stylex.props(s.itemText)}>{it.label}</Select.ItemText>
                  <Select.ItemIndicator {...stylex.props(s.indicator)}>
                    <Check size={13} strokeWidth={2} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
