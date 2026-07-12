import { useRef, useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { DAYS_KO, DAY_MIN, PALETTE, SLOT_MIN } from '../config.js';
import { X } from 'lucide-react';
import { eventFields } from '../models.js';
import { fmtDur, fmtOpt } from '../time.js';
import { HoldToConfirm } from './HoldToConfirm.jsx';
import { editor } from '../styles/editor.js';
import { planner } from '../styles/planner.js';

/**
 * Draft-until-save editor.
 * Done / Enter → save. X / scrim / Escape / Cancel → discard.
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
  const [swHov, setSwHov] = useState(null);
  const [swActive, setSwActive] = useState(null);
  const ref = useRef();

  useEffect(() => {
    const input = ref.current && ref.current.querySelector('input');
    if (input) input.focus();
  }, []);

  const patch = (partial) => {
    setLocal((prev) => eventFields({ ...prev, ...partial }));
  };

  const startOpts = [];
  for (let s = 0; s < DAY_MIN; s += SLOT_MIN) {
    startOpts.push(
      <option key={s} value={s}>
        {fmtOpt(s)}
      </option>,
    );
  }
  const endOpts = [];
  for (let e = local.start + SLOT_MIN; e <= DAY_MIN; e += SLOT_MIN) {
    endOpts.push(
      <option key={e} value={e}>
        {fmtOpt(e)}
      </option>,
    );
  }

  return (
    <div
      {...stylex.props(editor.scrim, closing && editor.scrimOut, editor.scrimBottom)}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        {...stylex.props(editor.dlg, closing && editor.dlgOut)}
        role="dialog"
        aria-modal="true"
        aria-label={readOnly ? '일정' : isNew ? '새 일정' : '일정 편집'}
        ref={ref}
        onKeyDown={(e) => {
          if (readOnly) return;
          if (
            e.key === 'Enter' &&
            e.target.tagName !== 'TEXTAREA' &&
            e.target.tagName !== 'BUTTON'
          ) {
            e.preventDefault();
            onSave(local);
          }
        }}
      >
        <div {...stylex.props(editor.dhead)}>
          <span {...stylex.props(editor.dttl)}>
            {readOnly ? '일정' : isNew ? '새 일정' : '일정 편집'}
          </span>
          <button {...stylex.props(editor.icobtn)} aria-label="닫기" onClick={onCancel}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <input
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
          <div {...stylex.props(editor.swrow)}>
            {PALETTE.map((c) => (
              <button
                key={c}
                {...stylex.props(editor.sw)}
                data-color={c}
                disabled={readOnly}
                aria-label={(colorLabel ? colorLabel(c) : null) || '색상 ' + c}
                aria-pressed={local.color === c}
                onClick={() => !readOnly && patch({ color: c })}
                onMouseEnter={() => setSwHov(c)}
                onMouseLeave={() => setSwHov(null)}
                onMouseDown={() => setSwActive(c)}
                onMouseUp={() => setSwActive(null)}
              >
                <i
                  {...stylex.props(
                    editor.swDot,
                    swHov === c && editor.swDotHov,
                    swActive === c && editor.swDotActive,
                    local.color === c && editor.swDotOn,
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div {...stylex.props(editor.field)}>
          <div {...stylex.props(editor.lrow)}>
            <span {...stylex.props(editor.lbl)}>요일</span>
          </div>
          <div {...stylex.props(editor.dayrow)}>
            {DAYS_KO.map((k, d) => (
              <button
                key={d}
                {...stylex.props(
                  editor.dayb,
                  d === 0 && editor.daybSun,
                  d === 6 && editor.daybSat,
                  local.day === d && editor.daybOn,
                )}
                aria-pressed={local.day === d}
                disabled={readOnly}
                onClick={() => patch({ day: d })}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div {...stylex.props(editor.field)}>
          <div {...stylex.props(editor.lrow)}>
            <span {...stylex.props(editor.lbl)}>시간</span>
            <span {...stylex.props(editor.ldur)}>{fmtDur(local.dur)}</span>
          </div>
          <div {...stylex.props(editor.timerow)}>
            <select
              {...stylex.props(editor.inpt, editor.inptSelect, editor.timerowSelect)}
              aria-label="시작 시간"
              value={local.start}
              disabled={readOnly}
              onChange={(e) => {
                const s = +e.target.value;
                patch({ start: s, dur: Math.min(local.dur, DAY_MIN - s) });
              }}
            >
              {startOpts}
            </select>
            <span {...stylex.props(editor.arrow)}>→</span>
            <select
              {...stylex.props(editor.inpt, editor.inptSelect, editor.timerowSelect)}
              aria-label="종료 시간"
              value={local.start + local.dur}
              disabled={readOnly}
              onChange={(e) => patch({ dur: +e.target.value - local.start })}
            >
              {endOpts}
            </select>
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
              <button
                type="button"
                {...stylex.props(planner.btn, planner.btnPrimary)}
                onClick={onCancel}
              >
                닫기
              </button>
            </>
          ) : isNew ? (
            <button type="button" {...stylex.props(planner.btn, planner.btnGhost)} onClick={onCancel}>
              취소
            </button>
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
      </div>
    </div>
  );
}
