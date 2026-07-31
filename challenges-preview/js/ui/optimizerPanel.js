/**
 * optimizerPanel.js — the slide-over for "Optimize my income today".
 *
 * The panel is pure presentation: every number it shows comes from
 * optimizer.recommend(), which is recomputed on each open so the panel always
 * reflects the current store, including anything just changed in Admin.
 *
 * The brief 600–900ms computing state is a presentation choice, not a real
 * wait — the engine returns in well under a millisecond. It exists so the
 * reveal reads as a calculation rather than a page swap.
 */
import { recommend } from '../optimizer.js';
import { formatMoney } from '../derive.js';
import { esc, flameIcon } from './components.js';

const COMPUTE_MS = 700;

/** Rows beyond this collapse into a summary line, so a card stays readable on a
 *  phone without hiding that the action moves more than is listed. */
const MAX_ROWS = 6;

let timer = null;

export function openPanel(root, state, onClose) {
  render(root, computingHTML());
  clearTimeout(timer);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const result = recommend(state);
  timer = setTimeout(() => render(root, resultHTML(result)), reduced ? 0 : COMPUTE_MS);

  return () => {
    clearTimeout(timer);
    if (onClose) onClose();
  };
}

export function closePanel(root) {
  clearTimeout(timer);
  root.innerHTML = '';
}

function render(root, inner) {
  root.innerHTML = `<div class="slideover-scrim" data-action="close-optimizer">
    <aside class="slideover" role="dialog" aria-modal="true" aria-label="Optimize my income today" data-action="stop">
      <div class="slideover-head">
        <div>
          <h3 style="font-size:18px">Optimize my income today</h3>
          <div style="font-size:12px;color:var(--text-soft)">Computed in your browser from your current progress</div>
        </div>
        <button class="icon-btn" data-action="close-optimizer" aria-label="Close">×</button>
      </div>
      ${inner}
    </aside>
  </div>`;
}

function computingHTML() {
  return `<div class="computing">
    <div class="spinner"></div>
    Working through every challenge you can still move today…
  </div>`;
}

function resultHTML(r) {
  return `<div class="slideover-body">
    ${r.streakWarning ? `<div class="notice amber" style="margin-bottom:16px">
      <div style="font-weight:700">⚠ ${esc(r.streakWarning.text)}</div>
      <div>${esc(r.streakWarning.subtext)}</div>
    </div>` : ''}

    <h2 style="font-size:20px;margin-bottom:14px">${esc(r.headline)}</h2>

    ${r.cards.map(cardHTML).join('')}

    ${r.cards.length === 0 ? '<div class="notice">Nothing is reachable today at the current reachability ceiling.</div>' : ''}

    <div style="font-size:12px;color:var(--text-soft);margin-top:6px">${esc(r.footer)}</div>
  </div>`;
}

function cardHTML(c) {
  const shown = c.advances.slice(0, MAX_ROWS);
  const hidden = c.advances.length - shown.length;

  return `<div class="rec">
    <div class="rec-head">
      <span class="rec-rank">${c.rank}</span>
      <div style="min-width:0">
        <div class="rec-action">${esc(c.action)}</div>
        <div class="rec-sub">
          <span class="cash">${esc(c.cashTodayText)} today</span>
          ${c.advancesMore > 0 ? ` · advances ${c.advancesMore} more ${c.advancesMore === 1 ? 'challenge' : 'challenges'}` : ''}
          ${c.protectsStreak ? ` <span class="chip-flame">${flameIcon(11)}protects streak</span>` : ''}
        </div>
      </div>
    </div>

    <table class="rec-rows">
      <tbody>${shown.map((a) => `
        <tr class="${a.completes ? 'done' : ''}">
          <td class="c-name">${esc(a.label)}</td>
          <td class="c-prog">${esc(a.completes ? a.afterFraction : a.current)}</td>
          <td class="c-delta">${a.completes
            ? `COMPLETE&nbsp;&nbsp;${esc(formatMoney(a.payout))}`
            : esc(a.deltaText)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    ${hidden > 0 ? `<div class="rec-more">and ${hidden} more ${hidden === 1 ? 'challenge' : 'challenges'} advanced</div>` : ''}

    <div class="rec-why">${esc(c.reasoning)}</div>
    <div class="rec-effort">${esc(c.effortText)}</div>
  </div>`;
}
