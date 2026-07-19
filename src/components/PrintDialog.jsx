import { t } from '../strings.js';
import * as stylex from '@stylexjs/stylex';
import { Printer, X } from 'lucide-react';
import { editor } from '../styles/editor.js';
import { menus } from '../styles/menus.js';
import { planner } from '../styles/planner.js';
import { print } from '../styles/print.js';
import { ui } from '../styles/ui.js';
import { Sheet } from './ui/sheet.js';
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
            <Sheet.Title {...stylex.props(editor.dttl)}>{t.print.title}</Sheet.Title>
            <Sheet.Close {...stylex.props(editor.icobtn)} aria-label={t.common.close}>
              <X size={16} strokeWidth={2} />
            </Sheet.Close>
          </div>

          <p {...stylex.props(menus.mcap, print.cap)}>
            {t.print.hint}
          </p>

          <SwitchRow
            label={t.print.showName}
            checked={draft.showName}
            onChange={(v) => onPatch({ showName: v })}
            xstyle={print.switchRow}
          />
          {draft.showName && (
            <div {...stylex.props(menus.drow, print.fieldRow)}>
              <span {...stylex.props(menus.drowLabel)}>{t.print.name}</span>
              <input
                {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                value={draft.name}
                maxLength={40}
                placeholder={t.print.blank}
                aria-label={t.print.printName}
                autoComplete="name"
                onChange={(e) => onPatch({ name: e.target.value })}
              />
            </div>
          )}

          <SwitchRow
            label={t.print.showDate}
            checked={draft.showDate}
            onChange={(v) => onPatch({ showDate: v })}
            xstyle={print.switchRow}
          />
          {draft.showDate && (
            <>
              <div {...stylex.props(menus.drow, print.fieldRow)}>
                <span {...stylex.props(menus.drowLabel)}>{t.print.start}</span>
                <input
                  type="date"
                  {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                  aria-label={t.print.printStart}
                  value={draft.from}
                  max={draft.to || undefined}
                  onChange={(e) => onPatch({ from: e.target.value })}
                />
              </div>
              <div {...stylex.props(menus.drow, print.fieldRow)}>
                <span {...stylex.props(menus.drowLabel)}>{t.print.end}</span>
                <input
                  type="date"
                  {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                  aria-label={t.print.printEnd}
                  value={draft.to}
                  min={draft.from || undefined}
                  onChange={(e) => onPatch({ to: e.target.value })}
                />
              </div>
            </>
          )}

          <SwitchRow
            label={t.print.showMemos}
            checked={draft.showMemos}
            onChange={(v) => onPatch({ showMemos: v })}
            xstyle={print.switchRow}
          />

          <SwitchRow
            label={t.print.showTime}
            checked={draft.showTime}
            onChange={(v) => onPatch({ showTime: v })}
            xstyle={print.switchRow}
          />
          {draft.showTime && (
            <div {...stylex.props(menus.drow, print.fieldRow)}>
              <span {...stylex.props(menus.drowLabel)}>{t.print.time}</span>
              <input
                {...stylex.props(ui.input, ui.inputSm, menus.drowInput)}
                value={draft.time}
                maxLength={40}
                placeholder={t.print.timePlaceholder}
                aria-label={t.print.printTime}
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
              {t.print.doPrint}
            </button>
            <Sheet.Close {...stylex.props(planner.btn, ui.btnGhost)}>{t.common.cancel}</Sheet.Close>
          </div>
          </Sheet.Popup>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
