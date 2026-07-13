import { useEffect, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Switch } from '@base-ui/react/switch';
import * as stylex from '@stylexjs/stylex';
import { Printer, X } from 'lucide-react';
import { defaultPrintPrefs, readPrintPrefs, writePrintPrefs } from '../print-prefs.js';
import { editor } from '../styles/editor.js';
import { menus } from '../styles/menus.js';
import { planner } from '../styles/planner.js';
import { ui } from '../styles/ui.js';

function SwitchRow({ label, checked, onChange }) {
  return (
    <label {...stylex.props(menus.mi)}>
      <span {...stylex.props(menus.miLabel, menus.miGrow)}>{label}</span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className={(state) =>
          stylex.props(menus.switchTrack, state.checked && menus.switchTrackOn).className
        }
      >
        <Switch.Thumb
          className={(state) =>
            stylex.props(menus.switchThumb, state.checked && menus.switchThumbOn).className
          }
        />
      </Switch.Root>
    </label>
  );
}

function openDraft(board) {
  const stored = readPrintPrefs(board);
  // Dates follow the active board each time; name/time/toggles stick on device.
  return {
    ...defaultPrintPrefs(board),
    ...stored,
    from: board?.from || '',
    to: board?.to || '',
  };
}

/**
 * Print setup sheet: configure name / date / time header fields, then print.
 * Works as a centered dialog on desktop and a bottom sheet on mobile.
 */
export function PrintDialog({ open, onOpenChange, board, onPrintPrefs }) {
  const [draft, setDraft] = useState(() => openDraft(board));

  useEffect(() => {
    if (!open) return;
    setDraft(openDraft(board));
  }, [open, board?.id, board?.from, board?.to]);

  const patch = (partial) => setDraft((prev) => ({ ...prev, ...partial }));

  const runPrint = () => {
    writePrintPrefs(draft);
    onPrintPrefs?.(draft);
    onOpenChange(false);
    // Let the dialog finish closing so mobile Safari doesn't print the sheet.
    requestAnimationFrame(() => {
      setTimeout(() => window.print(), 50);
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop data-ui-dialog-backdrop="" {...stylex.props(editor.scrim)} />
        <Dialog.Popup data-ui-dialog="" {...stylex.props(editor.dlg)}>
          <div {...stylex.props(editor.dhead)}>
            <Dialog.Title {...stylex.props(editor.dttl)}>인쇄</Dialog.Title>
            <Dialog.Close {...stylex.props(editor.icobtn)} aria-label="닫기">
              <X size={16} strokeWidth={2} />
            </Dialog.Close>
          </div>

          <p {...stylex.props(menus.mcap, menus.mcapFirst)}>
            인쇄물에 들어갈 이름·날짜·시간을 정하세요. 비우면 빈 칸으로 나갑니다.
          </p>

          <SwitchRow
            label="이름 표시"
            checked={draft.showName}
            onChange={(v) => patch({ showName: v })}
          />
          {draft.showName && (
            <div {...stylex.props(menus.drow)}>
              <span {...stylex.props(menus.drowLabel)}>이름</span>
              <input
                {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                value={draft.name}
                maxLength={40}
                placeholder="빈 칸"
                aria-label="인쇄 이름"
                autoComplete="name"
                onChange={(e) => patch({ name: e.target.value.slice(0, 40) })}
              />
            </div>
          )}

          <SwitchRow
            label="날짜 표시"
            checked={draft.showDate}
            onChange={(v) => patch({ showDate: v })}
          />
          {draft.showDate && (
            <>
              <div {...stylex.props(menus.drow)}>
                <span {...stylex.props(menus.drowLabel)}>시작</span>
                <input
                  type="date"
                  {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                  aria-label="인쇄 시작일"
                  value={draft.from}
                  max={draft.to || undefined}
                  onChange={(e) => patch({ from: e.target.value })}
                />
              </div>
              <div {...stylex.props(menus.drow)}>
                <span {...stylex.props(menus.drowLabel)}>종료</span>
                <input
                  type="date"
                  {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                  aria-label="인쇄 종료일"
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(e) => patch({ to: e.target.value })}
                />
              </div>
            </>
          )}

          <SwitchRow
            label="시간 표시"
            checked={draft.showTime}
            onChange={(v) => patch({ showTime: v })}
          />
          {draft.showTime && (
            <div {...stylex.props(menus.drow)}>
              <span {...stylex.props(menus.drowLabel)}>시간</span>
              <input
                {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                value={draft.time}
                maxLength={40}
                placeholder="빈 칸 · 예: 3교시"
                aria-label="인쇄 시간"
                onChange={(e) => patch({ time: e.target.value.slice(0, 40) })}
              />
            </div>
          )}

          <div {...stylex.props(editor.dfoot)}>
            <button
              type="button"
              {...stylex.props(planner.btn, planner.btnPrimary)}
              onClick={runPrint}
            >
              <Printer size={14} strokeWidth={1.75} />
              인쇄하기
            </button>
            <Dialog.Close {...stylex.props(planner.btn, planner.btnGhost)}>취소</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
