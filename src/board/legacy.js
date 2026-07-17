import { LEGACY_KEY, LEGACY_KEY1 } from '../lib/config.js';
import { boardFields, eventFields } from './models.js';
import { dt } from '../lib/time.js';

export function readJson(key) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function seedEvents() {
  const E = [];
  const add = (day, title, start, dur, color, memo = '') =>
    E.push(eventFields({ day, title, start, dur, color, memo }));

  for (const d of [1, 2, 3, 4, 5]) {
    add(d, '기상 · 준비', 30, 60, 'amber');
    add(d, '등교', 90, 30, 'graphite');
    add(d, '오전 수업', 150, 240, 'sky');
    add(d, '점심', 390, 60, 'green');
    add(d, '오후 수업', 450, 180, 'sky');
    add(d, '저녁', 690, 60, 'green');
  }
  for (const d of [1, 3, 5]) {
    add(d, '야간 자율학습', 750, 180, 'violet', '수학 문제집 → 영어 단어');
    add(d, '복습 · 오답노트', 960, 90, 'pink');
  }
  for (const d of [2, 4]) {
    add(d, '수학 학원', 750, 180, 'coral');
    add(d, '학원 숙제', 960, 60, 'amber');
  }
  add(6, '주말 자습', 240, 180, 'teal', '국어 모의고사 풀기');
  add(6, '운동', 540, 90, 'green');
  add(6, '영어 학원', 660, 120, 'coral');
  add(0, '휴식', 240, 120, 'amber');
  add(0, '주간 계획 정리', 840, 60, 'sky', '다음 주 목표 세우기');
  add(0, '독서', 900, 60, 'pink');
  for (let d = 0; d < 7; d++) add(d, '취침', 1080, 360, 'graphite');
  return E;
}

export function normBoards(json) {
  if (Array.isArray(json)) {
    return [boardFields({ name: '가져온 시간표', events: json.map(eventFields) })];
  }
  if (json && Array.isArray(json.boards)) {
    return json.boards.flatMap((b, i) => {
      if (!b || typeof b !== 'object') return [];
      return [
        boardFields(
          { ...b, from: dt(b.from), to: dt(b.to), events: b.events },
          '가져온 시간표 ' + (i + 1),
        ),
      ];
    });
  }
  if (json && Array.isArray(json.events)) {
    return [
      boardFields(
        { name: json.name, from: dt(json.from), to: dt(json.to), events: json.events },
        '가져온 시간표',
      ),
    ];
  }
  return null;
}

export function readLegacyBoards() {
  const v2 = readJson(LEGACY_KEY);
  if (v2 && Array.isArray(v2.boards) && v2.boards.length) {
    return v2.boards.map(b =>
      boardFields({
        name: typeof b.name === 'string' ? b.name : '시간표',
        from: dt(b.from),
        to: dt(b.to),
        events: b.events,
      }),
    );
  }
  const v1 = readJson(LEGACY_KEY1);
  if (Array.isArray(v1) && v1.length) {
    return [boardFields({ name: '내 시간표', events: v1 })];
  }
  return null;
}
