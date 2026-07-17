import * as stylex from '@stylexjs/stylex';
import { colors } from './tokens.stylex.js';

// The print sheet reuses the popover menu styles (menus.mi / mcap / drow), but
// those are tuned for a 6px-padded popover where labels ride a 9px text rail.
// Inside this 16px-padded dialog that rail lands 9px right of the title and
// footer, leaving a ragged left edge. These overrides pull the caption, switch
// rows and field rows back onto the title rail and tighten the vertical grouping
// so each switch reads as attached to the field it reveals.
export const print = stylex.create({
  // Intro caption on the title rail; a touch larger than dense-menu fine print.
  cap: {
    paddingInline: 0,
    paddingTop: '2px',
    paddingBottom: '11px',
    fontSize: '11.5px',
    lineHeight: 1.5,
    color: colors.faint,
  },

  // Switch row keeps its full-row tap target and hover, but stretches out ±9px
  // so the label sits on the title rail and the toggle lands on the dialog's
  // right edge — flush with the date/time inputs below it. `menus.mi` pins
  // width:100%, so the box also needs the extra 18px to reach that right edge
  // instead of only sliding left.
  switchRow: {
    marginInline: '-9px',
    width: 'calc(100% + 18px)',
    borderRadius: '8px',
  },

  // Revealed field row: label on the title rail, input flush to the right rail.
  // Keep a small gap below the switch hover target so the highlight doesn't clip
  // into the input.
  fieldRow: {
    paddingLeft: 0,
    paddingRight: 0,
    marginTop: '4px',
  },
});
