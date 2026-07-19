import { Popover } from '@base-ui/react/popover';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Download, Upload } from 'lucide-react';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';
import { t } from '../strings.js';
import { MenuItemBody } from './ui/MenuItemBody.jsx';

/** Extra actions for the header's ⋯ popover: JSON export/import + usage hints. */
export function MoreMenu({ onExport, onImport }) {
  return (
    <>
      <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onExport} />}>
        <MenuItemBody icon={Download} label={t.transfer.exportJson} />
      </Popover.Close>
      {onImport && (
        <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onImport} />}>
          <MenuItemBody icon={Upload} label={t.transfer.importJson} />
        </Popover.Close>
      )}
      <Separator {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap, ui.hintFine)}>{t.transfer.hint}</div>
      <div {...stylex.props(menus.mcap, ui.hintCoarse)}>{t.transfer.hintCoarse}</div>
    </>
  );
}
