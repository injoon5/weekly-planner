import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { PEER_COLORS, peerColor } from '../hooks/useBoardPresence.js';
import { account } from '../styles/account.js';
import { ui } from '../styles/ui.js';
import { Card } from './AccountCard.jsx';

/** Presence color strip — always one line; soft edge fades when clipped. */
function ColorSwatches({ activeColor, autoColor, onPick }) {
  const rowRef = useRef(null);
  const [fade, setFade] = useState({ left: false, right: false });

  const updateFade = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setFade((f) => (f.left === left && f.right === right ? f : { left, right }));
  }, []);

  useLayoutEffect(() => {
    updateFade();
  }, [updateFade]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(updateFade);
    ro.observe(row);
    return () => ro.disconnect();
  }, [updateFade]);

  // Vertical wheel → sideways scroll when the strip overflows (narrow windows).
  const onWheel = (e) => {
    const el = rowRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
    el.scrollLeft += e.deltaY;
  };

  const fadeStyle =
    fade.left && fade.right
      ? account.swatchesFadeBoth
      : fade.left
        ? account.swatchesFadeLeft
        : fade.right
          ? account.swatchesFadeRight
          : null;

  return (
    <div
      ref={rowRef}
      {...stylex.props(account.swatches, fadeStyle)}
      role="group"
      aria-labelledby="account-color-label"
      onScroll={updateFade}
      onWheel={onWheel}
    >
      <button
        type="button"
        {...stylex.props(account.swatch, account.swatchAuto, !activeColor && account.swatchOn)}
        aria-pressed={!activeColor}
        title="이메일에서 자동으로 정해진 색"
        onClick={() => onPick(null)}
      >
        <span {...stylex.props(account.swatchAutoDot)} style={{ backgroundColor: autoColor }} />
        자동
      </button>
      {PEER_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          {...stylex.props(account.swatch, activeColor === c && account.swatchOn)}
          style={{ backgroundColor: c }}
          aria-pressed={activeColor === c}
          aria-label={`아바타 색 ${c}`}
          onClick={() => onPick(c)}
        />
      ))}
    </div>
  );
}

export function ProfileCard({ index, user, settings, saveSettings }) {
  const [name, setName] = useState(settings?.displayName || '');
  const savedName = settings?.displayName || '';
  const dirty = name.trim() !== savedName;

  const emailName = user.email ? user.email.split('@')[0] : '손님';
  const autoColor = peerColor(user?.email || '');
  const activeColor = PEER_COLORS.includes(settings?.presenceColor)
    ? settings.presenceColor
    : null;

  // Preview follows the draft, so the avatar reacts while typing.
  const previewName = name.trim() || savedName || emailName;
  const previewColor = activeColor || autoColor;

  return (
    <Card index={index}>
      <div {...stylex.props(account.profileHead)}>
        <span
          {...stylex.props(account.avatar)}
          aria-hidden="true"
          style={{ backgroundColor: previewColor }}
        >
          {previewName.slice(0, 1).toUpperCase()}
        </span>
        <div {...stylex.props(account.profileMeta)}>
          <h2 {...stylex.props(account.profileName)}>{previewName}</h2>
          <span {...stylex.props(account.profileEmail)}>{user.email || '게스트 계정'}</span>
        </div>
      </div>
      <p {...stylex.props(account.cardHint)}>
        이름과 색은 함께 보는 사람들에게 아바타와 커서로 표시돼요.
      </p>

      <form
        {...stylex.props(account.row)}
        onSubmit={(e) => {
          e.preventDefault();
          if (dirty) void saveSettings({ displayName: name.trim() }, '이름을 저장했어요');
        }}
      >
        <label {...stylex.props(account.rowLabel)} htmlFor="account-name">
          표시 이름
        </label>
        <div {...stylex.props(account.rowControl)}>
          <input
            id="account-name"
            {...stylex.props(ui.input, ui.inputSm)}
            placeholder={emailName}
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            {...stylex.props(ui.btn, ui.btnPlain, account.rowBtn)}
            disabled={!dirty}
          >
            저장
          </button>
        </div>
      </form>

      <div {...stylex.props(account.row)}>
        <span {...stylex.props(account.rowLabel)} id="account-color-label">
          내 색
        </span>
        <ColorSwatches
          activeColor={activeColor}
          autoColor={autoColor}
          onPick={(c) => void saveSettings({ presenceColor: c }, '색을 바꿨어요')}
        />
      </div>
    </Card>
  );
}
