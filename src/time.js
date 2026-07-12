import { DAY_MIN, DAY_ORIGIN, SLOT_MIN, SLOTS } from './config.js';

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const pad = n => String(n).padStart(2, '0');

/** Minutes from 06:00 → clock label (supports next-day wrap). */
export function fmt(m) {
  const a = ((m % DAY_MIN) + DAY_ORIGIN + DAY_MIN) % DAY_MIN;
  return pad(Math.floor(a / 60)) + ':' + pad(a % 60);
}

export function fmtOpt(m) {
  if (m === DAY_MIN) return '06:00';
  return (m >= 1080 ? '익일 ' : '') + fmt(m);
}

export function fmtDur(m) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return '30분';
  return r ? h + '시간 30분' : h + '시간';
}

export function dt(v) {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
}

export function fmtRange(a, b) {
  const parse = s => {
    const [y, m, d] = s.split('-').map(Number);
    return { y, m, d };
  };
  const format = (o, withYear) => (withYear ? o.y + '.' : '') + o.m + '.' + o.d;
  if (a && b) {
    const A = parse(a);
    const B = parse(b);
    return format(A, true) + ' – ' + format(B, A.y !== B.y);
  }
  if (a) return format(parse(a), true) + ' –';
  return '– ' + format(parse(b), true);
}

export function snapMin(m, max = DAY_MIN - SLOT_MIN) {
  return clamp(Math.round((+m || 0) / SLOT_MIN) * SLOT_MIN, 0, max);
}

export function snapDur(start, dur) {
  const d = clamp(Math.round((+dur || SLOT_MIN) / SLOT_MIN) * SLOT_MIN, SLOT_MIN, DAY_MIN - start);
  return d;
}

export function slotOf(min) {
  return min / SLOT_MIN;
}

export function minOf(slot) {
  return slot * SLOT_MIN;
}

export function nowOnGrid(date = new Date()) {
  let nowMin = date.getHours() * 60 + date.getMinutes() - DAY_ORIGIN;
  let nowDay = date.getDay();
  if (nowMin < 0) {
    nowMin += DAY_MIN;
    nowDay = (nowDay + 6) % 7;
  }
  return { nowMin, nowDay, todayDow: date.getDay() };
}

export { SLOT_MIN, SLOTS, DAY_MIN };
