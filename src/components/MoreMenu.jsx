import { Popover } from '@base-ui/react/popover';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Download, Upload } from 'lucide-react';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';
import { t } from '../strings.js';

/** Extra actions for the header's ⋯ popover: JSON export/import + usage hints. */
export function MoreMenu({ onExport, onImport }) {
  return (
    <>
      <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onExport} />}>
        <span {...stylex.props(menus.miIconWrap)}>
          <Download size={14} strokeWidth={1.75} />
        </span>
        <span {...stylex.props(menus.miLabel)}>{t.transfer.exportJson}</span>
      </Popover.Close>
      {onImport && (
        <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onImport} />}>
          <span {...stylex.props(menus.miIconWrap)}>
            <Upload size={14} strokeWidth={1.75} />
          </span>
          <span {...stylex.props(menus.miLabel)}>{t.transfer.importJson}</span>
        </Popover.Close>
      )}
      <Separator {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap, ui.hintFine)}>{t.transfer.hint}</div>
      <div {...stylex.props(menus.mcap, ui.hintCoarse)}>{t.transfer.hintCoarse}</div>
    </>
  );
}
