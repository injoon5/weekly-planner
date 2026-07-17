import { Popover } from '@base-ui/react/popover';
import { Separator } from '@base-ui/react/separator';
import * as stylex from '@stylexjs/stylex';
import { Download, Upload, LogOut, Settings2, UserPlus } from 'lucide-react';
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

export function UserMenu({ email, isGuest, onUpgrade, onAccount, onSignOut }) {
  return (
    <>
      {isGuest ? (
        <>
          <div {...stylex.props(menus.mcap, menus.mcapFirst)}>
            게스트 모드 · 아직 저장되지 않았어요
          </div>
          <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onUpgrade} />}>
            <span {...stylex.props(menus.miIconWrap)}>
              <UserPlus size={14} strokeWidth={1.75} />
            </span>
            <span {...stylex.props(menus.miLabel)}>계정 만들기</span>
          </Popover.Close>
          <Separator {...stylex.props(menus.mdiv)} />
        </>
      ) : (
        email && <div {...stylex.props(menus.mcap, menus.mcapFirst)}>{email}</div>
      )}
      {onAccount && (
        <Popover.Close render={<button {...stylex.props(menus.mi)} onClick={onAccount} />}>
          <span {...stylex.props(menus.miIconWrap)}>
            <Settings2 size={14} strokeWidth={1.75} />
          </span>
          <span {...stylex.props(menus.miLabel)}>계정 설정</span>
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
