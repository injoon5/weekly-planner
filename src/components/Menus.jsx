import { Popover } from '@base-ui/react/popover';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Download, Upload, LogOut, Mail } from 'lucide-react';
import { menus } from '../styles/menus.js';

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
      <div {...stylex.props(menus.mcap, menus.hintFine)}>
        빈 칸을 클릭하거나 드래그해 일정을 만들고, 블록을 끌어 옮기거나 위·아래 가장자리로 길이를 조절할 수
        있어요. 모든 변경은 계정에 실시간 동기화됩니다.
      </div>
      <div {...stylex.props(menus.mcap, menus.hintCoarse)}>
        빈 칸을 탭해 일정을 추가하고, 블록을 길게 눌러 옮길 수 있어요. 모든 변경은 계정에 실시간
        동기화됩니다.
      </div>
    </>
  );
}

export function UserMenu({ email, isGuest, onUpgrade, onSignOut }) {
  return (
    <>
      <div {...stylex.props(menus.mcap, menus.mcapFirst)}>
        {isGuest ? '게스트' : email || '계정'}
      </div>
      {isGuest && onUpgrade && (
        <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onUpgrade} />}>
          <span {...stylex.props(menus.miIconWrap)}>
            <Mail size={14} strokeWidth={1.75} />
          </span>
          <span {...stylex.props(menus.miLabel)}>이메일로 계정 남기기</span>
        </Popover.Close>
      )}
      <Popover.Close render={<button {...stylex.props(menus.mi, menus.miRed)} onClick={onSignOut} />}>
        <span {...stylex.props(menus.miIconWrap)}>
          <LogOut size={14} strokeWidth={1.75} />
        </span>
        <span {...stylex.props(menus.miLabel)}>로그아웃</span>
      </Popover.Close>
    </>
  );
}
