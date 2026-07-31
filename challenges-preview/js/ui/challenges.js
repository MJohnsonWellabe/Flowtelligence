/**
 * challenges.js — the Challenges tab: Daily, Weekly, Monthly, Career, Feats.
 *
 * Every payout on this surface is derived through derive.js, never read from a
 * stored boosted figure. That is what makes the acceptance criteria hold: at
 * streak 8 the daily cards drop their strikethrough and their bonus chip while
 * weekly, monthly and career cards render byte-identical to streak 12.
 */
import {
  bonusActive, bonusLabel, challengesInScope, daysToBonus, effectivePayout, isBoosted,
  isComplete, meetsTier, progressFraction, progressPct, todaysDaily, PRODUCT_LABELS,
  formatMoney, formatNumber
} from '../derive.js';
import { countdownLabel, daysRemaining } from '../time.js';
import { chipRow, countdown, esc, flameIcon, progressBar, rewardAmount, trophy } from './components.js';
import { headerStripHTML } from './streakBanner.js';

const MILESTONES = [5, 10, 30, 100];

/** Which chip is selected in each scope. View-local: this is presentation
 *  state, not demo data, so it deliberately does not live in the store. */
const selection = { daily: null, weekly: null, monthly: null, career: null };

export function setSelection(scope, id) {
  if (scope in selection) selection[scope] = id;
}

export function challengesHTML(state) {
  return `
    ${headerStripHTML(state)}
    ${scopeBlock(state, 'daily', 'Daily')}
    ${scopeBlock(state, 'weekly', 'Weekly')}
    ${scopeBlock(state, 'monthly', 'Monthly')}
    ${scopeBlock(state, 'career', 'Career')}
    ${featsBlock(state)}`;
}

// ---------------------------------------------------------------------------

function scopeBlock(state, scope, heading) {
  const all = challengesInScope(state, scope);
  if (all.length === 0) {
    return `<section class="scope-block">
      <div class="section-head"><h3>${esc(heading)}</h3></div>
      <div class="notice">No published ${esc(scope)} challenges.</div>
    </section>`;
  }

  const ordered = orderForScope(state, scope, all);
  const chosenId = selection[scope] && ordered.some((c) => c.id === selection[scope])
    ? selection[scope]
    : ordered[0].id;
  const chosen = ordered.find((c) => c.id === chosenId);

  const chips = ordered.map((c) => ({
    id: c.id,
    name: c.title,
    tags: chipTags(c, state)
  }));

  // Every challenge in the scope gets a card, with the chip-selected one first
  // and outlined. Showing only the selected card would hide most of the fire
  // bars, and seeing the whole range at once — dull ember through full burn —
  // is the point of this surface.
  const rest = ordered.filter((c) => c.id !== chosenId);

  return `<section class="scope-block">
    <div class="section-head">
      <h3>${esc(heading)}</h3>
      <span class="hint">${esc(scopeHint(state, scope, ordered))}</span>
    </div>
    ${chipRow(chips, chosenId, `select-${scope}`)}
    ${scope === 'daily'
      ? `<div class="streak-block">${cardHTML(chosen, state, true)}${streakBlockHTML(state)}</div>
         ${rest.length ? `<div class="cardgrid two" style="margin-top:16px">${rest.map((c) => cardHTML(c, state)).join('')}</div>` : ''}`
      : `<div class="cardgrid two">${cardHTML(chosen, state, true)}${rest.map((c) => cardHTML(c, state)).join('')}</div>`}
  </section>`;
}

/** Today's daily first; otherwise unclaimed rewards, then live, then done. */
function orderForScope(state, scope, list) {
  const today = todaysDaily(state);
  const rank = (c) => {
    if (scope === 'daily' && today && c.id === today.id) return 0;
    if (c.status === 'complete_unclaimed') return 1;
    if (c.status === 'active') return 2;
    if (c.status === 'locked') return 3;
    return 4;
  };
  return [...list].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
}

function chipTags(c, state) {
  const tags = [];
  if (c.status === 'complete_unclaimed') tags.push({ text: 'Reward Available', kind: 'reward' });
  else if (c.status === 'active') tags.push({ text: 'Active', kind: 'active' });
  else if (c.status === 'claimed') tags.push({ text: 'Claimed', kind: 'muted' });
  else if (c.status === 'locked') tags.push({ text: 'Upcoming', kind: 'muted' });
  if (!meetsTier(c, state)) tags.push({ text: `${c.tierRequirement} only`, kind: 'muted' });
  return tags;
}

function scopeHint(state, scope, list) {
  if (scope === 'career') return 'Always visible · lifetime progress';
  const live = list.filter((c) => c.status === 'active').length;
  return `${live} active`;
}

// ---------------------------------------------------------------------------
// The challenge card
// ---------------------------------------------------------------------------

function cardHTML(c, state, selected = false) {
  if (!c) return '';
  const pct = progressPct(c, state);
  const complete = isComplete(c, state);
  const unclaimed = c.status === 'complete_unclaimed';
  const boosted = isBoosted(c, state);
  const locked = !meetsTier(c, state) || c.status === 'locked';
  // A finished challenge has no time left to report — showing a red "Ended"
  // beside a claimed reward reads as a failure rather than a completion.
  const live = c.status === 'active' || c.status === 'complete_unclaimed' || c.status === 'locked';
  const ends = live ? countdownLabel(c.endsAt) : null;
  const urgent = live && Number.isFinite(daysRemaining(c.endsAt)) && daysRemaining(c.endsAt) < 1;

  return `<article class="card ${complete ? 'is-complete' : ''} ${locked ? 'is-locked' : ''} ${selected ? 'is-selected' : ''}">
    <div class="card-head">
      <div style="min-width:0">
        <h4 class="card-title">${esc(c.title)}</h4>
        <div class="card-desc">${esc(c.description)}</div>
      </div>
      ${unclaimed ? `<button class="btn gold sm" data-action="open-reward" data-id="${esc(c.id)}">Claim reward</button>` : ''}
    </div>

    <div class="card-meta">
      <span class="tag">${esc(PRODUCT_LABELS[c.product] || c.product)}</span>
      <span class="tag xp">${esc(formatNumber(c.xp))} XP</span>
      ${c.tierRequirement ? `<span class="tag locked">${esc(c.tierRequirement)}+</span>` : ''}
      ${ends ? countdown(ends, urgent) : ''}
    </div>

    <div class="card-bar">${progressBar({
      pct,
      fraction: progressFraction(c, state),
      caption: captionFor(c)
    })}</div>

    <div class="card-foot">
      ${rewardAmount({
        base: c.baseReward,
        effective: effectivePayout(c, state),
        boosted,
        bonusText: boosted ? `+${Math.round((state.config.streakBonusMultiplier - 1) * 100)}% streak bonus` : null,
        formatMoney
      })}
      <span class="hint" style="font-size:12px;color:var(--text-soft)">
        ${complete ? (c.status === 'claimed' ? 'Claimed' : 'Complete — reward waiting') : `${Math.round(pct * 100)}% complete`}
      </span>
    </div>
  </article>`;
}

/** The italic line beneath the bar — `Sell: Medicare Supplement`. */
function captionFor(c) {
  if (c.inverse) return 'Hold: zero NIGO';
  if (c.metric === 'premium' || c.metric === 'lifetime_premium') return 'Submit: annualized premium';
  if (c.metric === 'clean_submits') return 'Submit: clean applications';
  if (c.metric === 'apps') return 'Submit: applications';
  if (c.metric === 'product_lines') return 'Sell: distinct product lines';
  if (c.metric === 'producing_days') return 'Produce: consecutive days';
  if (c.metric === 'consecutive_producing_months') return 'Produce: consecutive months';
  if (c.metric === 'tenure_months') return 'Hold: months appointed';
  if (c.metric === 'persistency_24mo') return 'Hold: 24-month persistency';
  if (c.metric === 'cross_sell') return 'Attach: additional product line';
  return `Sell: ${PRODUCT_LABELS[c.product] || c.product}`;
}

// ---------------------------------------------------------------------------
// Streak block, beside the daily card
// ---------------------------------------------------------------------------

function streakBlockHTML(state) {
  const s = state.agent.streak;
  const active = bonusActive(state);
  const pct = Math.round((state.config.streakBonusMultiplier - 1) * 100);
  const toGo = daysToBonus(state);
  const milestone = MILESTONES.includes(s.current);

  return `<article class="card">
    <h4 class="card-title">Your streak</h4>
    <div class="stat-row" style="margin-top:14px">
      <div class="stat"><div class="v">${esc(formatNumber(s.current))}</div><div class="k">Current streak</div></div>
      <div class="stat"><div class="v">${esc(formatNumber(s.best))}</div><div class="k">Best streak</div></div>
      <div class="stat"><div class="v">${esc(formatNumber(s.freezesRemaining))}</div>
        <div class="k">of ${esc(formatNumber(state.config.streakFreezesPerMonth))} freezes left</div></div>
    </div>

    <div style="margin-top:16px">
      <div class="k" style="font-size:12px;color:var(--text-mid)">Last 7 days</div>
      <div class="dots">${s.last7Days.map((done, i) => {
        const isToday = i === s.last7Days.length - 1;
        return `<span class="dot ${done ? 'on' : ''} ${isToday && !done ? 'today' : ''}"
          title="${isToday ? 'Today' : `${s.last7Days.length - i} days ago`}">${done ? '✓' : (isToday ? '·' : '—')}</span>`;
      }).join('')}</div>
    </div>

    ${milestone ? `<div class="notice gold" style="margin-top:16px">
      ${flameIcon(13)} <b>${esc(formatNumber(s.current))} day milestone.</b>
      ${s.current === state.config.streakBonusThresholdDays
        ? `Your daily rewards are now worth ${pct}% more.`
        : 'Keep it going.'}
    </div>` : ''}

    <div class="notice ${active ? 'gold' : ''}" style="margin-top:12px">
      ${active
        ? `<b>${esc(bonusLabel(state))} is live.</b> Breaking your streak drops your daily rewards by ${pct}%.`
        : `<b>${esc(toGo === 1 ? '1 day' : `${toGo} days`)} to unlock +${pct}% on every daily reward.</b>
           Weekly, monthly and career rewards are never boosted.`}
    </div>

    <div style="margin-top:12px;font-size:12px;color:var(--text-soft)">
      A missed day automatically consumes a streak freeze while any remain.
    </div>
  </article>`;
}

// ---------------------------------------------------------------------------
// Feats — the badge shelf
// ---------------------------------------------------------------------------

function featsBlock(state) {
  const earned = state.badges.filter((b) => b.earnedAt).length;
  return `<section class="scope-block">
    <div class="section-head">
      <h3>Feats</h3>
      <span class="hint">${esc(formatNumber(earned))} of ${esc(formatNumber(state.badges.length))} earned ·
        locked feats stay browsable</span>
    </div>
    <div class="shelf">${state.badges.map((b) => `
      <div class="feat ${b.earnedAt ? 'earned' : ''}">
        ${trophy(!!b.earnedAt, 34)}
        <div class="name">${esc(b.name)}</div>
        <div class="cond">${esc(b.earnedAt ? b.description : b.condition)}</div>
        <div class="rarity">${esc(b.earnedAt ? 'Earned' : b.rarity)}</div>
      </div>`).join('')}
    </div>
  </section>`;
}
