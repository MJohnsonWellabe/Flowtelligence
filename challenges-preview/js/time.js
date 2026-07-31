/**
 * time.js — the demo clock and every date format used on screen.
 *
 * The walkthrough is set in June 2026. Rather than sprinkle fake dates through
 * the views, the whole build asks this module for "now" and gets a clock
 * anchored to DEMO_NOW that still ticks in real time. Countdowns therefore run
 * live during a demo, but the screens read identically whenever this is opened.
 */
import { DEMO_NOW } from './demoData.js';

const ANCHOR = new Date(DEMO_NOW).getTime();
const OPENED_AT = Date.now();

/** Milliseconds since the epoch, on the demo clock. */
export function now() {
  return ANCHOR + (Date.now() - OPENED_AT);
}

export function nowDate() {
  return new Date(now());
}

/** `2026-06-25` for the demo clock's current day. */
export function todayKey() {
  return dateKey(nowDate());
}

export function dateKey(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** `06/25/2026 12:16 PM` — the format used throughout the screenshots. */
export function formatDateTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${formatDate(d)} ${formatTime(d)}`;
}

export function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}/${d.getFullYear()}`;
}

export function formatTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  let h = d.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${suffix}`;
}

/**
 * The countdown line beside the clock icon: `Ends today at 4:00 PM`,
 * `Ends tomorrow at 11:59 PM`, `4 days left`, or `Ended`.
 */
export function countdownLabel(endsAt) {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return null;

  const ms = end.getTime() - now();
  if (ms <= 0) return 'Ended';

  const today = todayKey();
  const endKey = dateKey(end);
  if (endKey === today) {
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `Ends in ${mins} min`;
    return `Ends today at ${formatTime(end)}`;
  }

  const tomorrow = new Date(now() + 86400000);
  if (endKey === dateKey(tomorrow)) return `Ends tomorrow at ${formatTime(end)}`;

  const days = Math.ceil(ms / 86400000);
  if (days <= 14) return `${days} days left`;
  return `Ends ${formatDate(end)}`;
}

/** Fractional days remaining — the optimizer's expiry-urgency input. */
export function daysRemaining(endsAt) {
  if (!endsAt) return Infinity;
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return Infinity;
  return Math.max(0, (end - now()) / 86400000);
}

/** Every day in the month containing `dateKeyStr`, padded to whole weeks so a
 *  calendar grid lines up. Entries outside the month carry inMonth: false. */
export function monthGrid(dateKeyStr) {
  const [y, m] = dateKeyStr.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ key: dateKey(d), day: d.getDate(), inMonth: d.getMonth() === m - 1 });
    if (i >= 34 && d.getMonth() !== m - 1 && d > first) {
      // Stop after the last week that still contains a day of this month.
      const weekEnd = (i + 1) % 7 === 0;
      if (weekEnd && cells.slice(-7).every((c) => !c.inMonth)) {
        cells.length -= 7;
        break;
      }
    }
  }
  return cells;
}

export function monthLabel(dateKeyStr) {
  const [y, m] = dateKeyStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function shiftMonth(dateKeyStr, delta) {
  const [y, m] = dateKeyStr.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return dateKey(d);
}
