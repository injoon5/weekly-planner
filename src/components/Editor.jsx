import { useMemo, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import * as stylex from '@stylexjs/stylex';
import { DAYS_KO, DAY_MIN, PALETTE, SLOT_MIN } from '../config.js';
import { X } from 'lucide-react';
import { eventFields } from '../models.js';
import { fmtDur, fmtOpt } from '../time.js';
import { HoldToConfirm } from './HoldToConfirm.jsx';
import { UiSelect } from './ui/UiSelect.jsx';
import { editor } from '../styles/editor.js';
import { planner } from '../styles/planner.js';

/**
 * Draft-until-save editor (Base UI Dialog).
 * Done / Enter → save. X / backdrop / Escape / Cancel → discard.
 * Delete → HoldToConfirm only.
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
  const titleRef = useRef(null);

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
    <Dialog.Root
      open={!closing}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop data-ui-dialog-backdrop="" {...stylex.props(editor.scrim)} />
        <Dialog.Popup
          data-ui-dialog=""
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
            <Dialog.Title {...stylex.props(editor.dttl)}>
              {readOnly ? '일정' : isNew ? '새 일정' : '일정 편집'}
            </Dialog.Title>
            <Dialog.Close {...stylex.props(editor.icobtn)} aria-label="닫기">
              <X size={16} strokeWidth={2} />
            </Dialog.Close>
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
                <Dialog.Close {...stylex.props(planner.btn, planner.btnPrimary)}>
                  닫기
                </Dialog.Close>
              </>
            ) : isNew ? (
              <Dialog.Close {...stylex.props(planner.btn, planner.btnGhost)}>취소</Dialog.Close>
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
                  {...stylex.props(planner.btn, planner.btnPrimary)}
                  onClick={() => onSave(local)}
                >
                  {isNew ? '추가' : '완료'}
                </button>
              </>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
