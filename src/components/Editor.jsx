import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import * as stylex from '@stylexjs/stylex';
import { DAYS_KO, DAY_MIN, PALETTE, SLOT_MIN } from '../lib/config.js';
import { X } from 'lucide-react';
import { eventFields } from '../board/models.js';
import { fmtDur, fmtOpt } from '../lib/time.js';
import { HoldToConfirm } from './HoldToConfirm.jsx';
import { UiSelect } from './ui/UiSelect.jsx';
import { Sheet } from './ui/Sheet.jsx';
import { editor } from '../styles/editor.js';
import { planner } from '../styles/planner.js';
import { ui } from '../styles/ui.js';

/**
 * Draft-until-save editor (Dialog on desktop, Drawer on mobile).
 * Done / Enter → save. X / backdrop / Escape / Cancel / swipe → discard.
 * Delete → HoldToConfirm only.
 *
 * Mounts closed then opens so Base UI applies data-starting-style. Mounting
 * with open={true} skips the enter transition (useTransitionStatus only
 * marks "starting" on a closed→open flip).
 */
export function Editor({
  draft,
  isNew,
  closing,
  onSave,
  onCancel,
  onDelete,
  readOnly = false,
  colorLabel,
}) {
  const [local, setLocal] = useState(() => eventFields(draft));
  const [open, setOpen] = useState(false);
  const titleRef = useRef(null);

  useLayoutEffect(() => {
    setOpen(!closing);
  }, [closing]);

  const patch = (partial) => {
    setLocal((prev) => eventFields({ ...prev, ...partial }));
  };

  const startOpts = useMemo(() => {
    const opts = [];
    for (let s = 0; s < DAY_MIN; s += SLOT_MIN) {
      opts.push({ value: s, label: fmtOpt(s) });
    }
    return opts;
  }, []);

  const endOpts = useMemo(() => {
    const opts = [];
    for (let e = local.start + SLOT_MIN; e <= DAY_MIN; e += SLOT_MIN) {
      opts.push({ value: e, label: fmtOpt(e) });
    }
    return opts;
  }, [local.start]);

  return (
    <Sheet.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setOpen(false);
          onCancel();
        }
      }}
    >
      <Sheet.Portal>
        <Sheet.Backdrop {...stylex.props(editor.scrim)} />
        <Sheet.Viewport>
          <Sheet.Popup
            {...stylex.props(editor.dlg)}
            initialFocus={titleRef}
            onKeyDown={(e) => {
              if (readOnly) return;
              if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
                e.preventDefault();
                onSave(local);
              }
            }}
          >
          <div {...stylex.props(editor.dhead)}>
            <Sheet.Title {...stylex.props(editor.dttl)}>
              {readOnly ? '일정' : isNew ? '새 일정' : '일정 편집'}
            </Sheet.Title>
            <Sheet.Close {...stylex.props(editor.icobtn)} aria-label="닫기">
              <X size={16} strokeWidth={2} />
            </Sheet.Close>
          </div>

          <input
            ref={titleRef}
            {...stylex.props(editor.inpt, editor.inptTitle)}
            placeholder="제목"
            value={local.title}
            readOnly={readOnly}
            onInput={(e) => patch({ title: e.target.value })}
          />

          <div {...stylex.props(editor.field)}>
            <div {...stylex.props(editor.lrow)}>
              <span {...stylex.props(editor.lbl)}>색상</span>
            </div>
            <RadioGroup
              {...stylex.props(editor.swrow)}
              aria-label="색상"
              value={local.color}
              disabled={readOnly}
              onValueChange={(c) => patch({ color: c })}
            >
              {PALETTE.map((c) => (
                <Radio.Root
                  key={c}
                  value={c}
                  data-color={c}
                  data-ui-swatch=""
                  {...stylex.props(editor.sw)}
                  aria-label={(colorLabel ? colorLabel(c) : null) || '색상 ' + c}
                >
                  <i
                    data-ui-swatch-dot=""
                    {...stylex.props(editor.swDot, local.color === c && editor.swDotOn)}
                  />
                </Radio.Root>
              ))}
            </RadioGroup>
          </div>

          <div {...stylex.props(editor.field)}>
            <div {...stylex.props(editor.lrow)}>
              <span {...stylex.props(editor.lbl)}>요일</span>
            </div>
            <RadioGroup
              {...stylex.props(editor.dayrow)}
              aria-label="요일"
              value={local.day}
              disabled={readOnly}
              onValueChange={(d) => patch({ day: d })}
            >
              {DAYS_KO.map((k, d) => (
                <Radio.Root
                  key={d}
                  value={d}
                  {...stylex.props(
                    editor.dayb,
                    d === 0 && editor.daybSun,
                    d === 6 && editor.daybSat,
                    local.day === d && editor.daybOn,
                  )}
                >
                  {k}
                </Radio.Root>
              ))}
            </RadioGroup>
          </div>

          <div {...stylex.props(editor.field)}>
            <div {...stylex.props(editor.lrow)}>
              <span {...stylex.props(editor.lbl)}>시간</span>
              <span {...stylex.props(editor.ldur)}>{fmtDur(local.dur)}</span>
            </div>
            <div {...stylex.props(editor.timerow)}>
              <UiSelect
                ariaLabel="시작 시간"
                items={startOpts}
                value={local.start}
                disabled={readOnly}
                xstyle={[editor.timerowSelect, editor.timeTrigger]}
                onValueChange={(s) => {
                  patch({ start: s, dur: Math.min(local.dur, DAY_MIN - s) });
                }}
              />
              <span {...stylex.props(editor.arrow)}>→</span>
              <UiSelect
                ariaLabel="종료 시간"
                items={endOpts}
                value={local.start + local.dur}
                disabled={readOnly}
                xstyle={[editor.timerowSelect, editor.timeTrigger]}
                onValueChange={(e) => patch({ dur: e - local.start })}
              />
            </div>
          </div>

          <div {...stylex.props(editor.field)}>
            <div {...stylex.props(editor.lrow)}>
              <span {...stylex.props(editor.lbl)}>메모</span>
            </div>
            <textarea
              {...stylex.props(editor.inpt, editor.inptTextarea)}
              rows={2}
              placeholder="선택 사항"
              value={local.memo || ''}
              readOnly={readOnly}
              onInput={(e) => patch({ memo: e.target.value })}
            />
          </div>

          <div {...stylex.props(editor.dfoot)}>
            {readOnly ? (
              <>
                <span {...stylex.props(editor.sp)} />
                <Sheet.Close {...stylex.props(planner.btn, ui.btnPrimary)}>
                  닫기
                </Sheet.Close>
              </>
            ) : isNew ? (
              <Sheet.Close {...stylex.props(planner.btn, ui.btnGhost)}>취소</Sheet.Close>
            ) : (
              <HoldToConfirm
                {...stylex.props(planner.btn, planner.btnDanger)}
                onConfirm={onDelete}
                aria-label="일정 삭제 — 길게 눌러 확인"
              >
                삭제
              </HoldToConfirm>
            )}
            {!readOnly && (
              <>
                <span {...stylex.props(editor.sp)} />
                <button
                  type="button"
                  {...stylex.props(planner.btn, ui.btnPrimary)}
                  onClick={() => onSave(local)}
                >
                  {isNew ? '추가' : '완료'}
                </button>
              </>
            )}
          </div>
          </Sheet.Popup>
        </Sheet.Viewport>
      </Sheet.Portal>
    </Sheet.Root>
  );
}
