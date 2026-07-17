import * as stylex from '@stylexjs/stylex';
import { Printer, X } from 'lucide-react';
import { editor } from '../styles/editor.js';
import { menus } from '../styles/menus.js';
import { planner } from '../styles/planner.js';
import { print } from '../styles/print.js';
import { ui } from '../styles/ui.js';
import { Sheet } from './ui/Sheet.jsx';
import { SwitchRow } from './ui/SwitchRow.jsx';

/**
 * Print setup sheet: configure name / date / time header fields, then print.
 * Dialog on desktop; swipeable drawer on mobile.
 */
export function PrintDialog({ open, onOpenChange, draft, onPatch, onPrint }) {
  return (
    <Sheet.Root open={open} onOpenChange={onOpenChange}>
      <Sheet.Portal>
        <Sheet.Backdrop {...stylex.props(editor.scrim)} />
        <Sheet.Viewport>
          <Sheet.Popup {...stylex.props(editor.dlg)}>
          <div {...stylex.props(editor.dhead)}>
            <Sheet.Title {...stylex.props(editor.dttl)}>인쇄</Sheet.Title>
            <Sheet.Close {...stylex.props(editor.icobtn)} aria-label="닫기">
              <X size={16} strokeWidth={2} />
            </Sheet.Close>
          </div>

          <p {...stylex.props(menus.mcap, print.cap)}>
            인쇄물에 들어갈 이름·날짜·시간을 정하세요. 비우면 빈 칸으로 나갑니다.
          </p>

          <SwitchRow
            label="이름 표시"
            checked={draft.showName}
            onChange={(v) => onPatch({ showName: v })}
            xstyle={print.switchRow}
          />
          {draft.showName && (
            <div {...stylex.props(menus.drow, print.fieldRow)}>
              <span {...stylex.props(menus.drowLabel)}>이름</span>
              <input
                {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                value={draft.name}
                maxLength={40}
                placeholder="빈 칸"
                aria-label="인쇄 이름"
                autoComplete="name"
                onChange={(e) => onPatch({ name: e.target.value })}
              />
            </div>
          )}

          <SwitchRow
            label="날짜 표시"
            checked={draft.showDate}
            onChange={(v) => onPatch({ showDate: v })}
            xstyle={print.switchRow}
          />
          {draft.showDate && (
            <>
              <div {...stylex.props(menus.drow, print.fieldRow)}>
                <span {...stylex.props(menus.drowLabel)}>시작</span>
                <input
                  type="date"
                  {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                  aria-label="인쇄 시작일"
                  value={draft.from}
                  max={draft.to || undefined}
                  onChange={(e) => onPatch({ from: e.target.value })}
                />
              </div>
              <div {...stylex.props(menus.drow, print.fieldRow)}>
                <span {...stylex.props(menus.drowLabel)}>종료</span>
                <input
                  type="date"
                  {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                  aria-label="인쇄 종료일"
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(e) => onPatch({ to: e.target.value })}
                />
              </div>
            </>
          )}

          <SwitchRow
            label="메모 표시"
            checked={draft.showMemos}
            onChange={(v) => onPatch({ showMemos: v })}
            xstyle={print.switchRow}
          />

          <SwitchRow
            label="시간 표시"
            checked={draft.showTime}
            onChange={(v) => onPatch({ showTime: v })}
            xstyle={print.switchRow}
          />
          {draft.showTime && (
            <div {...stylex.props(menus.drow, print.fieldRow)}>
              <span {...stylex.props(menus.drowLabel)}>시간</span>
              <input
                {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                value={draft.time}
                maxLength={40}
                placeholder="빈 칸 · 예: 3교시"
                aria-label="인쇄 시간"
                onChange={(e) => onPatch({ time: e.target.value })}
              />
            </div>
          )}

          <div {...stylex.props(editor.dfoot)}>
            <button
              type="button"
              {...stylex.props(planner.btn, ui.btnPrimary)}
              onClick={onPrint}
            >
              <Printer size={14} strokeWidth={1.75} />
              인쇄하기
            </button>
            <Sheet.Close {...stylex.props(planner.btn, ui.btnGhost)}>취소</Sheet.Close>
          </div>
          </Sheet.Popup>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
