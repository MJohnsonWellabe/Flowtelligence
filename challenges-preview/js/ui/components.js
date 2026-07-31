/**
 * components.js — the four repeating patterns from the screenshots, plus the
 * line-art illustrations and icons.
 *
 * Everything returns an HTML string. Views render by assigning innerHTML once
 * and then handling clicks through a single delegated listener on the app root,
 * which keeps event wiring out of the render path entirely.
 */

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// 1. Gold progress bar, with the fire treatment
// ---------------------------------------------------------------------------

/**
 * @param {object} o
 * @param {number} o.pct       0..1
 * @param {string} o.fraction  right-aligned inside the fill, e.g. "1/2"
 * @param {string} [o.caption] italic line beneath, e.g. "Sell: Critical Illness"
 * @param {boolean} [o.fire]   false renders the plain gold bar
 */
export function progressBar({ pct, fraction, caption, fire = true }) {
  const p = Math.max(0, Math.min(1, Number(pct) || 0));
  const classes = ['bar'];
  if (!fire) classes.push('plain');
  else classes.push(fireClass(p));
  if (p <= 0) classes.push('empty');
  if (p < 0.18) classes.push('narrow');

  return `
    <div>
      <div class="${classes.join(' ')}" style="--pct:${(p * 100).toFixed(2)};--intensity:${p.toFixed(2)}"
           role="progressbar" aria-valuenow="${Math.round(p * 100)}" aria-valuemin="0" aria-valuemax="100"
           aria-label="${esc(caption || fraction || 'progress')}">
        <div class="bar-fill">${fraction ? `<span class="bar-value">${esc(fraction)}</span>` : ''}</div>
        <div class="bar-flame"></div>
      </div>
      ${caption ? `<div class="bar-caption">${esc(caption)}</div>` : ''}
    </div>`;
}

/** Dull ember → gold → white-hot, with gold as the anchor through the middle. */
function fireClass(p) {
  if (p >= 1) return 'done';
  if (p <= 0) return 'ember';
  if (p < 0.25) return 'ember';
  if (p < 0.45) return 'low';
  if (p < 0.7) return 'mid';
  return 'high';
}

// ---------------------------------------------------------------------------
// 2. Trophy pair — outlined means unearned, gold-filled in a gold circle means
//    earned. One convention across the whole badge shelf.
// ---------------------------------------------------------------------------

export function trophy(earned, size = 34) {
  const body = earned
    ? `<path fill="currentColor" d="M6 3h12v2h4v3a5 5 0 0 1-4.6 5A6 6 0 0 1 13 16.9V19h4v2H7v-2h4v-2.1A6 6 0 0 1 6.6 13 5 5 0 0 1 2 8V5h4V3Zm0 4H4v1a3 3 0 0 0 2 2.8V7Zm12 0v3.8A3 3 0 0 0 20 8V7h-2Z"/>`
    : `<path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M6.8 3.8h10.4v6.4a5.2 5.2 0 0 1-10.4 0V3.8Zm0 1.9H3.9v2.1a3.6 3.6 0 0 0 2.9 3.5m10.4-5.6h2.9v2.1a3.6 3.6 0 0 1-2.9 3.5M12 15.6v3.5m-3.7 1.1h7.4"/>`;
  return `<span class="trophy ${earned ? 'earned' : 'locked'}">
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>
  </span>`;
}

// ---------------------------------------------------------------------------
// 3. Horizontal chip row
// ---------------------------------------------------------------------------

/**
 * @param {Array<{id:string,name:string,tags:Array<{text:string,kind:string}>}>} items
 * @param {string} selectedId
 * @param {string} action  the data-action the delegated handler listens for
 */
export function chipRow(items, selectedId, action) {
  if (items.length === 0) return '';
  return `<div class="chiprow" role="tablist">${items.map((i) => `
    <button class="chip" role="tab" aria-pressed="${i.id === selectedId}"
            data-action="${esc(action)}" data-id="${esc(i.id)}">
      <div class="chip-name">${esc(i.name)}</div>
      <div class="chip-tags">${(i.tags || []).map((t) =>
        `<span class="chip-tag ${esc(t.kind)}">${esc(t.text)}</span>`).join('')}</div>
    </button>`).join('')}</div>`;
}

// ---------------------------------------------------------------------------
// 4. Reward claim modal, and the small confirmation that follows it
// ---------------------------------------------------------------------------

/**
 * The completion celebration, rebuilt from the product's own Congratulations
 * panel: gold field, wellabe wordmark, headline, body copy naming the reward,
 * a solid blue primary button, the line-art cash stack on a white disc beneath
 * it, and a full-width blue "Got it, thanks!" bar flush to the bottom edge.
 */
export function rewardModal({ title, body, payout, xp, claimAction, dismissAction }) {
  return `<div class="scrim" data-action="${esc(dismissAction)}">
    <div class="modal reward-modal" role="dialog" aria-modal="true" aria-label="Challenge complete"
         data-action="stop">
      <div class="reward-body">
        <div class="wordmark">wellabe<sup>®</sup></div>
        <h2>Congratulations!</h2>
        <p>You have qualified to receive the <b>${esc(title)}</b> reward with a payout of
           <b>${esc(payout)}</b>.</p>
        <p>${esc(body)}</p>
        <p class="xp-line">${esc(xp)}</p>
        <button class="btn block" data-action="${esc(claimAction)}">Redeem now</button>
      </div>
      <div class="art-disc">${cashStack()}</div>
      <button class="got-it" data-action="${esc(dismissAction)}">Got it, thanks!</button>
    </div>
  </div>`;
}

export function confirmModal({ heading, body, confirmLabel, confirmAction, cancelAction, danger }) {
  return `<div class="scrim" data-action="${esc(cancelAction)}">
    <div class="modal confirm" role="dialog" aria-modal="true" data-action="stop">
      <h3>${esc(heading)}</h3>
      <p>${esc(body)}</p>
      <div class="row">
        <button class="btn ghost" data-action="${esc(cancelAction)}">Cancel</button>
        <button class="btn ${danger ? 'danger' : ''}" data-action="${esc(confirmAction)}">${esc(confirmLabel)}</button>
      </div>
    </div>
  </div>`;
}

/** The small grey confirmation shown after a reward is claimed. */
export function noticeModal({ heading, body, closeAction }) {
  return `<div class="scrim" data-action="${esc(closeAction)}">
    <div class="modal confirm" role="dialog" aria-modal="true" data-action="stop">
      <h3>${esc(heading)}</h3>
      <p>${esc(body)}</p>
      <div class="row"><button class="btn" data-action="${esc(closeAction)}">Close</button></div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Smaller repeating conventions
// ---------------------------------------------------------------------------

export function countdown(label, urgent) {
  if (!label) return '';
  return `<span class="countdown ${urgent ? 'urgent' : ''}">${clockIcon()}${esc(label)}</span>`;
}

/** `First « 1 2 3 4 » Last`. Decorative, per the brief. */
export function pager(active = 1, pages = 4) {
  const nums = Array.from({ length: pages }, (_, i) => i + 1)
    .map((n) => `<span class="${n === active ? 'on' : ''}">${n}</span>`).join('');
  return `<div class="pager" aria-hidden="true"><span>First</span><span>«</span>${nums}<span>»</span><span>Last</span></div>`;
}

/** Chevrons flanking a content area, as in the screenshots. Decorative. */
export function flanked(inner) {
  return `<div class="flanked">
    <button class="flank" aria-hidden="true" tabindex="-1">${chevron('left')}</button>
    <div class="flanked-body">${inner}</div>
    <button class="flank" aria-hidden="true" tabindex="-1">${chevron('right')}</button>
  </div>`;
}

/** The reward amount. Boosted renders base struck through beside the boosted
 *  figure; unboosted renders a plain amount with no strikethrough and no chip —
 *  a scope that cannot receive the bonus must never show a bonus affordance. */
export function rewardAmount({ base, effective, boosted, bonusText, formatMoney }) {
  if (!boosted) {
    return `<span class="reward"><span class="amount">${esc(formatMoney(base))}</span></span>`;
  }
  return `<span class="reward">
    <span class="base-struck">${esc(formatMoney(base))}</span>
    <span class="amount boosted">${esc(formatMoney(effective))}</span>
  </span>${bonusText ? ` <span class="chip-flame">${flameIcon(11)}${esc(bonusText)}</span>` : ''}`;
}

// ---------------------------------------------------------------------------
// Icons and line art. Thin grey stroke, no fill — matching the cloud in the
// sidebar of the screenshots.
// ---------------------------------------------------------------------------

export function flameIcon(size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2c.7 3.2-1.2 4.6-2.6 6.1C7.9 9.7 6.5 11.2 6.5 14a5.5 5.5 0 0 0 11 0c0-2.2-1-3.6-2-5-.4 1-1 1.7-1.8 2 .6-2.6-.4-6.4-1.7-9Z"/>
  </svg>`;
}

export function clockIcon(size = 13) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/>
    <path d="M12 7v5.2l3.4 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
  </svg>`;
}

export function chevron(dir, size = 18) {
  const d = dir === 'left' ? 'M15 5 8 12l7 7' : 'M9 5l7 7-7 7';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="${d}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function sunIcon(size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <path d="M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>
    </g>
  </svg>`;
}

/** The sidebar clouds — thin grey stroke, no fill. */
export function cloudArt() {
  return `<svg viewBox="0 0 240 130" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M28 44c-7 0-12-5-12-11s5-11 12-11c2-8 9-13 17-13 9 0 16 6 18 14 6 1 10 6 10 12 0 6-5 11-12 11H28Z"/>
      <path d="M36 30c2-3 6-5 10-4"/>
      <path d="M96 92c-11 0-19-8-19-18s8-18 19-18c4-12 15-20 28-20 15 0 27 11 29 25 10 2 17 10 17 20 0 11-9 19-21 19H96Z"/>
      <path d="M112 68c3-5 9-8 15-7"/>
      <path d="M188 44c-5 0-9-4-9-9s4-9 9-9c2-6 7-10 13-10 7 0 13 5 14 12"/>
    </g>
  </svg>`;
}

/** The cash-stack illustration inside the reward panel. Same line-art style:
 *  banded bills stacked with a coin resting against them. */
export function cashStack() {
  return `<svg viewBox="0 0 220 120" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="30" y="72" width="160" height="30" rx="4"/>
      <path d="M30 82h160"/>
      <rect x="38" y="52" width="144" height="24" rx="4"/>
      <path d="M96 52v24M124 52v24"/>
      <rect x="46" y="34" width="128" height="22" rx="4"/>
      <ellipse cx="110" cy="45" rx="15" ry="8"/>
      <circle cx="152" cy="82" r="17" fill="none"/>
      <path d="M152 73v18M147.5 77h6.5a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6.5"/>
      <path d="M60 88h10M78 88h5"/>
    </g>
  </svg>`;
}
