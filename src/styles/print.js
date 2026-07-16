import * as stylex from '@stylexjs/stylex';
import { colors } from '../tokens.stylex.js';

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

  // Switch row keeps its full-row tap target and hover, but shifts left so the
  // label sits on the title rail and the toggle lands on the dialog's right
  // edge; the hover rectangle then bleeds to an even, small inset.
  switchRow: {
    marginInline: '-9px',
    borderRadius: '8px',
  },

  // Revealed field row: label on the title rail, input flush to the right rail,
  // nudged up so it groups with the switch above it.
  fieldRow: {
    paddingLeft: 0,
    paddingRight: 0,
    marginTop: '-3px',
  },
});
