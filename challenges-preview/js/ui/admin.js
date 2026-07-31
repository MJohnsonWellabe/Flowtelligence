/**
 * admin.js — the Admin tab. This is the one part of the build that genuinely
 * functions, and it is the only writer to the store.
 *
 * The shape follows the admin pattern used in the golf model's dashboard: a
 * module-level draft, a single full repaint rather than surgical DOM updates,
 * and one delegated listener per event type reading data-action / data-field /
 * data-id off the nearest ancestor. Pure helpers stay separate from the DOM so
 * the behaviour is inspectable without a browser.
 *
 * Confirmation dialogs appear on delete and reset only, per the brief.
 */
import {
  assignScheduleDate, exportJSON, importJSON, removeBadge, removeChallenge,
  resetToSeed, setConfig, uniqueId, update, upsertBadge, upsertChallenge
} from '../store.js';
import { SCOPES, TIERS, PRODUCT_LABELS, formatNumber } from '../derive.js';
import { DEMO_TODAY } from '../demoData.js';
import { dateKey, monthGrid, monthLabel, shiftMonth, todayKey } from '../time.js';
import { confirmModal, esc } from './components.js';

const SECTIONS = [
  ['planner', 'Daily planner'],
  ['library', 'Challenge library'],
  ['badges', 'Badges'],
  ['rules', 'Bonus rules'],
  ['optimizer', 'Optimizer tuning'],
  ['agent', 'Agent state'],
  ['data', 'Data']
];

const METRICS = [
  'policies', 'premium', 'apps', 'clean_submits', 'cross_sell', 'product_lines',
  'producing_days', 'nigo_count', 'lifetime_premium', 'lifetime_policies',
  'consecutive_producing_months', 'tenure_months', 'persistency_24mo'
];
const PRODUCTS = ['MS', 'HI', 'D', 'STC', 'Preneed', 'any'];
const UNITS = ['policies', 'dollars', 'applications', 'days', 'months', 'percent'];
const STATUSES = ['locked', 'active', 'complete_unclaimed', 'claimed', 'expired'];
const RARITIES = ['common', 'rare', 'epic', 'legendary'];
const ICONS = ['flame', 'shield', 'star', 'platinum', 'calendar', 'chevron', 'anchor'];

/** View-local UI state. Not demo data, so deliberately outside the store. */
const ui = {
  section: 'planner',
  calMonth: DEMO_TODAY,
  editing: null,      // { kind: 'challenge'|'badge', draft: {...}, isNew: bool }
  confirming: null,   // { heading, body, confirmLabel, action, id }
  picking: null,      // date string — the assign picker
  dragId: null,
  status: ''
};

export function adminHTML(state) {
  return `
    <div class="admin-nav">${SECTIONS.map(([id, label]) =>
      `<button data-action="a-section" data-id="${id}" aria-pressed="${ui.section === id}">${esc(label)}</button>`
    ).join('')}</div>
    ${sectionHTML(state)}
    <div class="status-msg" role="status">${esc(ui.status)}</div>`;
}

/** Modals live above the panel, rendered by main.js into the overlay root. */
export function adminOverlayHTML(state) {
  if (ui.confirming) {
    return confirmModal({
      heading: ui.confirming.heading,
      body: ui.confirming.body,
      confirmLabel: ui.confirming.confirmLabel,
      confirmAction: 'a-confirm-yes',
      cancelAction: 'a-confirm-no',
      danger: true
    });
  }
  if (ui.picking) return pickerHTML(state);
  if (ui.editing) return ui.editing.kind === 'challenge' ? challengeEditorHTML(state) : badgeEditorHTML();
  return '';
}

function sectionHTML(state) {
  switch (ui.section) {
    case 'planner': return plannerHTML(state);
    case 'library': return libraryHTML(state);
    case 'badges': return badgesHTML(state);
    case 'rules': return rulesHTML(state);
    case 'optimizer': return optimizerHTML(state);
    case 'agent': return agentHTML(state);
    default: return dataHTML();
  }
}

// ---------------------------------------------------------------------------
// Daily planner
// ---------------------------------------------------------------------------

function plannerHTML(state) {
  const cells = monthGrid(ui.calMonth);
  const byDate = new Map(state.schedule.map((e) => [e.date, e.challengeId]));
  const title = new Map(state.challenges.map((c) => [c.id, c.title]));
  const today = todayKey();
  const dailies = state.challenges.filter((c) => c.scope === 'daily');

  return `<div class="admin-card">
    <h3>Daily planner</h3>
    <div class="sub">Drag a challenge from the library onto a date, or tap a date to pick one.
      Tapping an assigned date clears it. Days with no assignment show no challenge.</div>

    <div class="section-head" style="margin:0 0 10px">
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn ghost sm" data-action="a-cal-prev">‹</button>
        <b>${esc(monthLabel(ui.calMonth))}</b>
        <button class="btn ghost sm" data-action="a-cal-next">›</button>
      </div>
      <span class="hint">${esc(formatNumber(cells.filter((c) => c.inMonth && !byDate.has(c.key)).length))} unassigned days</span>
    </div>

    <div class="cal">
      ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<div class="dow">${d}</div>`).join('')}
      ${cells.map((c) => {
        const id = byDate.get(c.key);
        return `<button class="cal-day ${c.inMonth ? '' : 'out'} ${c.key === today ? 'today' : ''} ${id ? '' : 'unassigned'}"
          data-action="a-day" data-date="${esc(c.key)}" data-drop="1">
          <div class="d">${c.day}</div>
          ${id ? `<div class="assigned">${esc(title.get(id) || id)}</div>` : ''}
        </button>`;
      }).join('')}
    </div>
  </div>

  <div class="admin-card">
    <h3>Challenge library</h3>
    <div class="sub">Drag onto a date above.</div>
    ${dailies.map((c) => `
      <div class="libitem" draggable="true" data-drag="${esc(c.id)}">
        <span class="scope-pip">daily</span>
        <span class="grow"><span class="t ${c.published === false ? 'unpub' : ''}">${esc(c.title)}</span></span>
        <span class="scope-pip">$${esc(formatNumber(c.baseReward))}</span>
      </div>`).join('') || '<div class="notice">No daily challenges in the library.</div>'}
  </div>`;
}

function pickerHTML(state) {
  const dailies = state.challenges.filter((c) => c.scope === 'daily');
  return `<div class="scrim" data-action="a-pick-cancel">
    <div class="modal editor" role="dialog" aria-modal="true" data-action="stop">
      <h3>Assign a daily to ${esc(ui.picking)}</h3>
      ${dailies.map((c) => `
        <div class="libitem" data-action="a-assign" data-date="${esc(ui.picking)}" data-id="${esc(c.id)}"
             style="cursor:pointer">
          <span class="grow"><span class="t">${esc(c.title)}</span></span>
          <span class="scope-pip">$${esc(formatNumber(c.baseReward))}</span>
        </div>`).join('')}
      <div class="actions">
        <button class="btn ghost" data-action="a-clear-day" data-date="${esc(ui.picking)}">Clear this day</button>
        <button class="btn ghost" data-action="a-pick-cancel">Cancel</button>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Challenge library CRUD
// ---------------------------------------------------------------------------

function libraryHTML(state) {
  return `<div class="admin-card">
    <h3>Challenge library</h3>
    <div class="sub">Every schema field is editable, including base reward, XP, target, product and tier requirement.</div>
    <div class="actions" style="margin:0 0 14px">
      <button class="btn sm" data-action="a-new-challenge">New challenge</button>
    </div>
    ${SCOPES.map((scope) => {
      const list = state.challenges.filter((c) => c.scope === scope);
      if (list.length === 0) return '';
      return `<h4 style="font-size:13px;color:var(--text-mid);margin:14px 0 7px;text-transform:uppercase;letter-spacing:.05em">${esc(scope)}</h4>
        ${list.map((c) => `
          <div class="libitem">
            <span class="grow">
              <span class="t ${c.published === false ? 'unpub' : ''}">${esc(c.title)}${c.published === false ? ' (unpublished)' : ''}</span>
              <span class="scope-pip">${esc(c.metric)} · ${esc(c.product)} · target ${esc(formatNumber(c.target))} ·
                $${esc(formatNumber(c.baseReward))} · ${esc(formatNumber(c.xp))} XP · ${esc(c.status)}</span>
            </span>
            <button class="btn ghost sm" data-action="a-edit" data-id="${esc(c.id)}">Edit</button>
            <button class="btn ghost sm" data-action="a-dup" data-id="${esc(c.id)}">Duplicate</button>
            <button class="btn ghost sm" data-action="a-toggle-pub" data-id="${esc(c.id)}">${c.published === false ? 'Publish' : 'Unpublish'}</button>
            <button class="btn ghost sm" data-action="a-del" data-id="${esc(c.id)}">Delete</button>
          </div>`).join('')}`;
    }).join('')}
  </div>`;
}

function challengeEditorHTML(state) {
  const d = ui.editing.draft;
  const f = (label, field, value, type = 'text') => `
    <div class="field"><label>${esc(label)}</label>
      <input type="${type}" data-field="${esc(field)}" data-target="draft" value="${esc(value ?? '')}"></div>`;
  const sel = (label, field, value, options, labels) => `
    <div class="field"><label>${esc(label)}</label>
      <select data-field="${esc(field)}" data-target="draft">
        ${options.map((o) => `<option value="${esc(o)}" ${String(value) === String(o) ? 'selected' : ''}>${esc(labels ? labels(o) : o)}</option>`).join('')}
      </select></div>`;

  return `<div class="scrim" data-action="a-cancel-edit">
    <div class="modal editor" role="dialog" aria-modal="true" data-action="stop">
      <h3>${ui.editing.isNew ? 'New challenge' : 'Edit challenge'}</h3>
      <div class="grid2">
        ${f('ID', 'id', d.id)}
        ${sel('Scope', 'scope', d.scope, SCOPES)}
        ${f('Title', 'title', d.title)}
        ${f('Description', 'description', d.description)}
        ${sel('Metric', 'metric', d.metric, METRICS)}
        ${sel('Product', 'product', d.product, PRODUCTS, (p) => PRODUCT_LABELS[p] || p)}
        ${f('Target', 'target', d.target, 'number')}
        ${sel('Unit', 'unit', d.unit, UNITS)}
        ${f('Progress', 'progress', d.progress, 'number')}
        ${f('Base reward ($)', 'baseReward', d.baseReward, 'number')}
        ${f('XP', 'xp', d.xp, 'number')}
        ${f('Badge ID', 'badgeId', d.badgeId)}
        ${sel('Tier requirement', 'tierRequirement', d.tierRequirement || '', ['', ...TIERS])}
        ${sel('Status', 'status', d.status, STATUSES)}
        ${f('Starts at', 'startsAt', d.startsAt)}
        ${f('Ends at', 'endsAt', d.endsAt)}
      </div>
      <div class="checkrow" style="margin-top:12px">
        <label><input type="checkbox" data-field="published" data-target="draft" ${d.published !== false ? 'checked' : ''}> Published</label>
      </div>
      <div class="actions">
        <button class="btn" data-action="a-save">Save</button>
        <button class="btn ghost" data-action="a-cancel-edit">Cancel</button>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Badge CRUD
// ---------------------------------------------------------------------------

function badgesHTML(state) {
  return `<div class="admin-card">
    <h3>Badges</h3>
    <div class="sub">The feat shelf. Clearing "Earned at" returns a badge to its locked, browsable state.</div>
    <div class="actions" style="margin:0 0 14px">
      <button class="btn sm" data-action="a-new-badge">New badge</button>
    </div>
    ${state.badges.map((b) => `
      <div class="libitem">
        <span class="grow">
          <span class="t">${esc(b.name)}</span>
          <span class="scope-pip">${esc(b.rarity)} · ${esc(b.earnedAt ? `earned ${b.earnedAt}` : b.condition)}</span>
        </span>
        <button class="btn ghost sm" data-action="a-edit-badge" data-id="${esc(b.id)}">Edit</button>
        <button class="btn ghost sm" data-action="a-dup-badge" data-id="${esc(b.id)}">Duplicate</button>
        <button class="btn ghost sm" data-action="a-del-badge" data-id="${esc(b.id)}">Delete</button>
      </div>`).join('')}
  </div>`;
}

function badgeEditorHTML() {
  const d = ui.editing.draft;
  const f = (label, field, value) => `
    <div class="field"><label>${esc(label)}</label>
      <input data-field="${esc(field)}" data-target="draft" value="${esc(value ?? '')}"></div>`;
  return `<div class="scrim" data-action="a-cancel-edit">
    <div class="modal editor" role="dialog" aria-modal="true" data-action="stop">
      <h3>${ui.editing.isNew ? 'New badge' : 'Edit badge'}</h3>
      <div class="grid2">
        ${f('ID', 'id', d.id)}
        ${f('Name', 'name', d.name)}
        ${f('Description', 'description', d.description)}
        ${f('Unlock condition', 'condition', d.condition)}
        <div class="field"><label>Icon</label>
          <select data-field="icon" data-target="draft">
            ${ICONS.map((i) => `<option ${d.icon === i ? 'selected' : ''}>${esc(i)}</option>`).join('')}
          </select></div>
        <div class="field"><label>Rarity</label>
          <select data-field="rarity" data-target="draft">
            ${RARITIES.map((r) => `<option ${d.rarity === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}
          </select></div>
        ${f('Earned at (blank = locked)', 'earnedAt', d.earnedAt)}
      </div>
      <div class="actions">
        <button class="btn" data-action="a-save">Save</button>
        <button class="btn ghost" data-action="a-cancel-edit">Cancel</button>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Bonus rules
// ---------------------------------------------------------------------------

function rulesHTML(state) {
  const c = state.config;
  return `<div class="admin-card">
    <h3>Streak bonus rules</h3>
    <div class="sub">Changing any of these updates every displayed payout immediately, with no refresh.</div>
    <div class="grid2">
      <div class="field"><label>Threshold (days)</label>
        <input type="number" min="0" data-field="streakBonusThresholdDays" data-target="config" value="${esc(c.streakBonusThresholdDays)}"></div>
      <div class="field"><label>Multiplier (1.10 = +10%)</label>
        <input type="number" step="0.01" min="1" data-field="streakBonusMultiplier" data-target="config" value="${esc(c.streakBonusMultiplier)}"></div>
      <div class="field"><label>Streak freezes per month</label>
        <input type="number" min="0" data-field="streakFreezesPerMonth" data-target="config" value="${esc(c.streakFreezesPerMonth)}"></div>
      <div class="field"><label>Near-miss nudge threshold (0–1)</label>
        <input type="number" step="0.05" min="0" max="1" data-field="nudgeThreshold" data-target="config" value="${esc(c.nudgeThreshold)}"></div>
    </div>

    <h4 style="margin:16px 0 8px;font-size:13px">Scopes the bonus applies to</h4>
    <div class="checkrow">${SCOPES.map((s) => `
      <label><input type="checkbox" data-scope="${s}" ${c.streakBonusScopes.includes(s) ? 'checked' : ''}> ${esc(s)}</label>`).join('')}
    </div>
    <div class="sub" style="margin-top:10px">Defaults to daily only. Weekly, monthly and career cards show no
      strikethrough and no bonus chip unless their scope is checked here.</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Optimizer tuning
// ---------------------------------------------------------------------------

function optimizerHTML(state) {
  const o = state.config.optimizer;
  const w = state.config.effortWeights;
  return `<div class="admin-card">
    <h3>Optimizer tuning</h3>
    <div class="sub">Changing any of these reorders the recommendations the next time the panel opens.</div>
    <div class="grid2">
      <div class="field"><label>Streak protection multiplier</label>
        <input type="number" step="0.1" data-field="streakProtectionMultiplier" data-target="optimizer" value="${esc(o.streakProtectionMultiplier)}"></div>
      <div class="field"><label>Reachability ceiling (effort)</label>
        <input type="number" step="0.1" data-field="reachabilityCeiling" data-target="optimizer" value="${esc(o.reachabilityCeiling)}"></div>
      <div class="field"><label>Recommendations returned</label>
        <input type="number" min="1" max="8" data-field="recommendationCount" data-target="optimizer" value="${esc(o.recommendationCount)}"></div>
      <div class="field"><label>Completion weight</label>
        <input type="number" step="0.1" min="1" data-field="completionWeight" data-target="optimizer" value="${esc(o.completionWeight)}"></div>
    </div>

    <h4 style="margin:16px 0 8px;font-size:13px">Effort weights</h4>
    <div class="grid2">
      ${[['policy', 'One policy'], ['premiumPer500', '$500 of premium'], ['application', 'One application'],
         ['cleanSubmit', 'One clean submit'], ['quote', 'One quote'], ['crossSell', 'One cross-sell attachment']]
        .map(([k, label]) => `
        <div class="field"><label>${esc(label)}</label>
          <input type="number" step="0.1" min="0.1" data-field="${k}" data-target="effort" value="${esc(w[k])}"></div>`).join('')}
    </div>
    <div class="sub" style="margin-top:10px">The quote weight is inert until a challenge uses a quote metric —
      none of the seeded challenges do.</div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Agent state + presets
// ---------------------------------------------------------------------------

function agentHTML(state) {
  const a = state.agent;
  return `<div class="admin-card">
    <h3>Presets</h3>
    <div class="sub">One click each.</div>
    <div class="actions" style="margin-top:0">
      <button class="btn" data-action="a-preset-approaching">Approaching bonus (streak 8)</button>
      <button class="btn" data-action="a-preset-active">Bonus active (streak 12)</button>
      <button class="btn outline" data-action="a-preview">Preview as agent</button>
    </div>
  </div>

  <div class="admin-card">
    <h3>Agent state</h3>
    <div class="sub">Lifetime totals drive the matching career bars directly, so editing them here moves those bars.</div>
    <div class="grid2">
      <div class="field"><label>Name</label><input data-field="name" data-target="agent" value="${esc(a.name)}"></div>
      <div class="field"><label>Tier</label>
        <select data-field="tier" data-target="agent">
          ${TIERS.map((t) => `<option ${a.tier === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
        </select></div>
      <div class="field"><label>Level</label><input type="number" data-field="level" data-target="agent" value="${esc(a.level)}"></div>
      <div class="field"><label>XP</label><input type="number" data-field="xp" data-target="agent" value="${esc(a.xp)}"></div>
      <div class="field"><label>XP to next level</label><input type="number" data-field="xpToNextLevel" data-target="agent" value="${esc(a.xpToNextLevel)}"></div>
      <div class="field"><label>Tenure (months)</label><input type="number" data-field="tenureMonths" data-target="agent" value="${esc(a.tenureMonths)}"></div>
      <div class="field"><label>Lifetime premium ($)</label><input type="number" data-field="lifetimePremium" data-target="agent" value="${esc(a.lifetimePremium)}"></div>
      <div class="field"><label>Lifetime policies</label><input type="number" data-field="lifetimePolicies" data-target="agent" value="${esc(a.lifetimePolicies)}"></div>
      <div class="field"><label>Current streak</label><input type="number" data-field="current" data-target="streak" value="${esc(a.streak.current)}"></div>
      <div class="field"><label>Best streak</label><input type="number" data-field="best" data-target="streak" value="${esc(a.streak.best)}"></div>
      <div class="field"><label>Freezes remaining</label><input type="number" data-field="freezesRemaining" data-target="streak" value="${esc(a.streak.freezesRemaining)}"></div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Data — export / import / reset
// ---------------------------------------------------------------------------

function dataHTML() {
  return `<div class="admin-card">
    <h3>Export / import</h3>
    <div class="sub">Export the whole store to a file and import it back — this is how a configured demo moves between machines.</div>
    <div class="actions" style="margin-top:0">
      <button class="btn" data-action="a-export">Export JSON</button>
      <label class="btn outline" style="cursor:pointer">
        Import JSON<input type="file" accept="application/json,.json" data-role="import" style="display:none">
      </label>
    </div>
  </div>

  <div class="admin-card">
    <h3>Reset</h3>
    <div class="sub">Restores the seeded demo exactly as shipped. Your theme choice is kept.</div>
    <div class="actions" style="margin-top:0">
      <button class="btn danger" data-action="a-reset">Reset to seed</button>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function newChallenge() {
  return {
    id: uniqueId('challenge-new'), scope: 'daily', title: 'New challenge', description: '',
    metric: 'policies', product: 'any', target: 1, unit: 'policies', progress: 0,
    baseReward: 25, xp: 100, badgeId: null, tierRequirement: null,
    startsAt: `${DEMO_TODAY}T08:00:00`, endsAt: `${DEMO_TODAY}T16:00:00`,
    status: 'active', published: true
  };
}

export function newBadge() {
  return {
    id: uniqueId('badge-new'), name: 'New feat', description: '', condition: 'Unlock condition',
    icon: 'flame', rarity: 'common', earnedAt: null
  };
}

/** Numbers arrive from inputs as strings; coerce the numeric schema fields. */
function coerce(field, raw) {
  const numeric = new Set(['target', 'progress', 'baseReward', 'xp', 'level', 'xpToNextLevel',
    'tenureMonths', 'lifetimePremium', 'lifetimePolicies', 'current', 'best', 'freezesRemaining',
    'streakBonusThresholdDays', 'streakBonusMultiplier', 'streakFreezesPerMonth', 'nudgeThreshold',
    'streakProtectionMultiplier', 'reachabilityCeiling', 'recommendationCount', 'completionWeight',
    'policy', 'premiumPer500', 'application', 'cleanSubmit', 'quote', 'crossSell']);
  if (!numeric.has(field)) return raw === '' ? null : raw;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// Event handling
// ---------------------------------------------------------------------------

/**
 * @returns {boolean} true when the action belonged to Admin and was handled.
 * `api` supplies the shell-level operations Admin needs: repaint and tab switch.
 */
export function adminClick(action, el, state, api) {
  const id = el.dataset.id;
  const date = el.dataset.date;

  switch (action) {
    case 'a-section': ui.section = id; ui.status = ''; break;
    case 'a-cal-prev': ui.calMonth = shiftMonth(ui.calMonth, -1); break;
    case 'a-cal-next': ui.calMonth = shiftMonth(ui.calMonth, 1); break;

    case 'a-day': {
      const assigned = state.schedule.find((e) => e.date === date);
      if (assigned) {
        assignScheduleDate(date, null);
        ui.status = `Cleared ${date}.`;
      } else {
        ui.picking = date;
      }
      break;
    }
    case 'a-assign':
      assignScheduleDate(date, id);
      ui.picking = null;
      ui.status = `Assigned to ${date}.`;
      break;
    case 'a-clear-day':
      assignScheduleDate(date, null);
      ui.picking = null;
      ui.status = `Cleared ${date}.`;
      break;
    case 'a-pick-cancel': ui.picking = null; break;

    case 'a-new-challenge': ui.editing = { kind: 'challenge', draft: newChallenge(), isNew: true }; break;
    case 'a-edit': {
      const c = state.challenges.find((x) => x.id === id);
      if (c) ui.editing = { kind: 'challenge', draft: { ...c }, isNew: false, originalId: c.id };
      break;
    }
    case 'a-dup': {
      const c = state.challenges.find((x) => x.id === id);
      if (c) {
        upsertChallenge({ ...c, id: uniqueId(`${c.id}-copy`), title: `${c.title} (copy)`, published: false });
        ui.status = 'Duplicated as an unpublished copy.';
      }
      break;
    }
    case 'a-toggle-pub': {
      const c = state.challenges.find((x) => x.id === id);
      if (c) {
        upsertChallenge({ ...c, published: c.published === false });
        ui.status = c.published === false ? 'Published.' : 'Unpublished.';
      }
      break;
    }
    case 'a-del': {
      const c = state.challenges.find((x) => x.id === id);
      ui.confirming = {
        heading: 'Delete this challenge?',
        body: `“${c ? c.title : id}” will be removed from the library and from any date it is assigned to.`,
        confirmLabel: 'Delete', action: 'del-challenge', id
      };
      break;
    }

    case 'a-new-badge': ui.editing = { kind: 'badge', draft: newBadge(), isNew: true }; break;
    case 'a-edit-badge': {
      const b = state.badges.find((x) => x.id === id);
      if (b) ui.editing = { kind: 'badge', draft: { ...b }, isNew: false, originalId: b.id };
      break;
    }
    case 'a-dup-badge': {
      const b = state.badges.find((x) => x.id === id);
      if (b) {
        upsertBadge({ ...b, id: uniqueId(`${b.id}-copy`), name: `${b.name} (copy)`, earnedAt: null });
        ui.status = 'Duplicated.';
      }
      break;
    }
    case 'a-del-badge': {
      const b = state.badges.find((x) => x.id === id);
      ui.confirming = {
        heading: 'Delete this badge?',
        body: `“${b ? b.name : id}” will be removed from the feat shelf.`,
        confirmLabel: 'Delete', action: 'del-badge', id
      };
      break;
    }

    case 'a-save': {
      const d = ui.editing.draft;
      if (ui.editing.kind === 'challenge') {
        if (ui.editing.originalId && ui.editing.originalId !== d.id) removeChallenge(ui.editing.originalId);
        upsertChallenge(d);
      } else {
        if (ui.editing.originalId && ui.editing.originalId !== d.id) removeBadge(ui.editing.originalId);
        upsertBadge(d);
      }
      ui.editing = null;
      ui.status = 'Saved.';
      break;
    }
    case 'a-cancel-edit': ui.editing = null; break;

    case 'a-confirm-yes': {
      const { action: what, id: target } = ui.confirming;
      ui.confirming = null;
      if (what === 'del-challenge') { removeChallenge(target); ui.status = 'Deleted.'; }
      else if (what === 'del-badge') { removeBadge(target); ui.status = 'Deleted.'; }
      else if (what === 'reset') { resetToSeed(); ui.status = 'Reset to seed.'; }
      break;
    }
    case 'a-confirm-no': ui.confirming = null; break;

    case 'a-preset-approaching':
      update((s) => { s.agent.streak.current = 8; });
      ui.status = 'Streak set to 8 — the bonus is off and the unlock nudge shows.';
      break;
    case 'a-preset-active':
      update((s) => { s.agent.streak.current = 12; });
      ui.status = 'Streak set to 12 — the bonus is live.';
      break;
    case 'a-preview': api.goToTab('submissions'); return true;

    case 'a-export': downloadJSON(); ui.status = 'Exported.'; break;
    case 'a-reset':
      ui.confirming = {
        heading: 'Reset to seed?',
        body: 'Every edit you have made — challenges, badges, rules, agent state — will be discarded.',
        confirmLabel: 'Reset', action: 'reset'
      };
      break;

    default: return false;
  }
  api.repaint();
  return true;
}

/** Live-edit handler for every input and select inside Admin. */
export function adminInput(el, api) {
  const target = el.dataset.target;
  const field = el.dataset.field;

  // Every path below writes to the store while an Admin control has focus. A
  // full repaint would rebuild that control mid-keystroke and take the caret
  // with it, so the shell is told to repaint only its own chrome and leave the
  // Admin DOM standing.
  if (el.dataset.scope) {
    const scope = el.dataset.scope;
    api.shellOnlyNext();
    setConfig({
      streakBonusScopes: el.checked
        ? SCOPES.filter((s) => s === scope || currentScopes().includes(s))
        : currentScopes().filter((s) => s !== scope)
    });
    return true;
  }

  if (!target || !field) return false;

  const value = el.type === 'checkbox' ? el.checked : coerce(field, el.value);

  if (target === 'draft') {
    // The draft is not in the store at all, so nothing repaints until save.
    ui.editing.draft[field] = value;
    return true;
  }

  api.shellOnlyNext();
  switch (target) {
    case 'config': setConfig({ [field]: value }); break;
    case 'optimizer': update((s) => { s.config.optimizer[field] = value; }); break;
    case 'effort': update((s) => { s.config.effortWeights[field] = value; }); break;
    case 'agent': update((s) => { s.agent[field] = value; }); break;
    case 'streak': update((s) => { s.agent.streak[field] = value; }); break;
    default: return false;
  }
  return true;
}

let scopesRef = null;
export function bindState(getState) { scopesRef = getState; }
function currentScopes() {
  return scopesRef ? [...scopesRef().config.streakBonusScopes] : ['daily'];
}

export function adminFileImport(file, api) {
  const reader = new FileReader();
  reader.onload = () => {
    const res = importJSON(String(reader.result));
    ui.status = res.ok ? 'Imported.' : res.error;
    api.repaint();
  };
  reader.onerror = () => { ui.status = 'Could not read that file.'; api.repaint(); };
  reader.readAsText(file);
}

export function adminDragStart(el) { ui.dragId = el.dataset.drag; }
export function adminDrop(date, api) {
  if (!ui.dragId) return;
  assignScheduleDate(date, ui.dragId);
  ui.status = `Assigned to ${date}.`;
  ui.dragId = null;
  api.repaint();
}

function downloadJSON() {
  const blob = new Blob([exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `challenges-preview-${dateKey(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
