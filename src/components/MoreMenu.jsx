import { Popover } from '@base-ui/react/popover';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Download, Upload } from 'lucide-react';
import { menus } from '../styles/menus.js';
import { ui } from '../styles/ui.js';

/** Extra actions for the header ⋯ menu: JSON export/import + short usage hint. */
export function MoreMenu({ onExport, onImport }) {
  return (
    <>
      <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onExport} />}>
        <span {...stylex.props(menus.miIconWrap)}>
          <Download size={14} strokeWidth={1.75} />
        </span>
        <span {...stylex.props(menus.miLabel)}>JSON 내보내기</span>
      </Popover.Close>
      {onImport && (
        <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onImport} />}>
          <span {...stylex.props(menus.miIconWrap)}>
            <Upload size={14} strokeWidth={1.75} />
          </span>
          <span {...stylex.props(menus.miLabel)}>JSON 가져오기</span>
        </Popover.Close>
      )}
      <Separator {...stylex.props(menus.mdiv)} />
      <div {...stylex.props(menus.mcap, ui.hintFine)}>
        빈 칸을 드래그해 일정을 만들고, 블록을 끌어 옮기거나 가장자리로 길이를 조절하세요.
      </div>
      <div {...stylex.props(menus.mcap, ui.hintCoarse)}>
        빈 칸을 탭해 추가하고, 블록을 길게 눌러 옮길 수 있어요.
      </div>
    </>
  );
}
