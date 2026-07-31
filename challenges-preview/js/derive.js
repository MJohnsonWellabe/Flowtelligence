/**
 * derive.js — everything computed from the store at render time.
 *
 * The rule this file exists to enforce: a boosted payout is NEVER stored. Only
 * `baseReward` lives in the store; the streak bonus is applied here, on every
 * read, against the current config. That is why unchecking "daily" in Admin's
 * scope control reverts every daily card instantly, and why weekly/monthly/
 * career cards can never accidentally render a bonus they are not entitled to.
 */
import { daysRemaining, todayKey } from './time.js';

export const TIERS = ['Rookie', 'Producer', 'Veteran', 'Elite', 'Legend'];

export const PRODUCT_LABELS = {
  MS: 'Medicare Supplement',
  HI: 'Hospital Indemnity',
  D: 'Dental',
  STC: 'Short Term Care',
  Preneed: 'Preneed',
  any: 'Any product'
};

export const SCOPES = ['daily', 'weekly', 'monthly', 'career'];

// ---------------------------------------------------------------------------
// The streak bonus
// ---------------------------------------------------------------------------

/** True when the agent's streak has reached the configured threshold. */
export function bonusActive(state) {
  return state.agent.streak.current >= state.config.streakBonusThresholdDays;
}

/** True only when the bonus is active AND this challenge's scope is allow-listed.
 *  A weekly card must never answer true unless Admin explicitly checked weekly. */
export function isBoosted(challenge, state) {
  return bonusActive(state) && state.config.streakBonusScopes.includes(challenge.scope);
}

/** The payout as rendered. Derived, never persisted. Rounded to cents so the
 *  arithmetic on an optimizer card sums exactly to the headline rather than to
 *  27.500000000000004. */
export function effectivePayout(challenge, state) {
  const base = Number(challenge.baseReward) || 0;
  if (!isBoosted(challenge, state)) return base;
  return Math.round(base * state.config.streakBonusMultiplier * 100) / 100;
}

/** `+10% on dailies` / `+10% on dailies, weeklies` — the header indicator. */
export function bonusLabel(state) {
  const pct = Math.round((state.config.streakBonusMultiplier - 1) * 100);
  const names = { daily: 'dailies', weekly: 'weeklies', monthly: 'monthlies', career: 'career' };
  const scopes = state.config.streakBonusScopes.map((s) => names[s] || s);
  if (scopes.length === 0) return `+${pct}%`;
  return `+${pct}% on ${listPhrase(scopes)}`;
}

export function daysToBonus(state) {
  return Math.max(0, state.config.streakBonusThresholdDays - state.agent.streak.current);
}

function listPhrase(items) {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

/**
 * Current progress for a challenge.
 *
 * Three career metrics read straight off agent state rather than off the
 * challenge, so editing lifetime totals in Admin's agent editor moves the
 * career bars live — which is the whole point of that editor.
 */
export function progressFor(challenge, state) {
  const a = state.agent;
  if (challenge.scope === 'career') {
    if (challenge.metric === 'lifetime_premium') return a.lifetimePremium;
    if (challenge.metric === 'lifetime_policies' && challenge.product === 'any') return a.lifetimePolicies;
    if (challenge.metric === 'tenure_months') return a.tenureMonths;
  }
  return Number(challenge.progress) || 0;
}

/** 0..1. Inverse challenges (Zero NIGO) fill on clean days elapsed, not on a
 *  count climbing toward a target — a bar that fills as you *avoid* something. */
export function progressPct(challenge, state) {
  if (challenge.inverse) {
    const span = Number(challenge.daysInPeriod) || 1;
    return clamp01((Number(challenge.daysClean) || 0) / span);
  }
  const target = Number(challenge.target) || 0;
  if (target <= 0) return 0;
  return clamp01(progressFor(challenge, state) / target);
}

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

/** Units still needed. Infinity for challenges no single action can close. */
export function remainingUnits(challenge, state) {
  if (challenge.inverse) return Infinity;
  return Math.max(0, (Number(challenge.target) || 0) - progressFor(challenge, state));
}

export function isComplete(challenge, state) {
  if (challenge.status === 'claimed' || challenge.status === 'complete_unclaimed') return true;
  if (challenge.inverse) return false;
  return progressPct(challenge, state) >= 1;
}

/** The `1/2` shown inside the fill, and the `$22,400 / $30,000` long form. */
export function progressFraction(challenge, state) {
  if (challenge.inverse) return `${challenge.daysClean}/${challenge.daysInPeriod}`;
  const p = progressFor(challenge, state);
  const t = Number(challenge.target) || 0;
  if (challenge.unit === 'dollars') return `${formatMoney(p, 0)}/${formatMoney(t, 0)}`;
  return `${formatNumber(p)}/${formatNumber(t)}`;
}

// ---------------------------------------------------------------------------
// Scope views
// ---------------------------------------------------------------------------

/** Published challenges in a scope, most-advanced first within their status. */
export function challengesInScope(state, scope) {
  return state.challenges.filter((c) => c.scope === scope && c.published !== false);
}

/** The daily the planner has pinned to today, if any. */
export function todaysDaily(state) {
  const key = todayKey();
  const entry = state.schedule.find((e) => e.date === key);
  if (entry) {
    const c = state.challenges.find((x) => x.id === entry.challengeId);
    if (c) return c;
  }
  return state.challenges.find((c) => c.scope === 'daily' && c.status === 'active') || null;
}

export function todaysDailyIncomplete(state) {
  const d = todaysDaily(state);
  return !!d && !isComplete(d, state);
}

/** Drives the red superscript on the Challenges tab. */
export function unclaimedRewardCount(state) {
  return state.challenges.filter((c) => c.status === 'complete_unclaimed' && c.published !== false).length;
}

export function unreadMessageCount(state) {
  return state.messages.filter((m) => m.unread).length;
}

export function redeemableIncentiveCount(state) {
  return (state.incentives.items || []).filter((i) => i.rewardAvailable).length;
}

// ---------------------------------------------------------------------------
// Level, XP, tier
// ---------------------------------------------------------------------------

export function tierIndex(tier) {
  const i = TIERS.indexOf(tier);
  return i < 0 ? 0 : i;
}

/** Tier gating: a challenge above the agent's tier is browsable but locked. */
export function meetsTier(challenge, state) {
  if (!challenge.tierRequirement) return true;
  return tierIndex(state.agent.tier) >= tierIndex(challenge.tierRequirement);
}

export function xpProgress(state) {
  const { xp, xpToNextLevel } = state.agent;
  if (!xpToNextLevel) return 0;
  return clamp01(xp / xpToNextLevel);
}

// ---------------------------------------------------------------------------
// Near-miss nudge
// ---------------------------------------------------------------------------

/**
 * The nudge shown in the streak banner.
 *
 * The brief's rule is "75% or higher on any challenge". Applied literally that
 * picks challenges 9 or 22 units from done, which reads as noise rather than a
 * nudge. So a challenge one unit from closing also qualifies regardless of
 * percentage, and candidates are ranked daily → weekly → monthly → career and
 * then by units remaining. That surfaces the genuinely actionable one.
 */
export function nearMissNudge(state) {
  const order = { daily: 0, weekly: 1, monthly: 2, career: 3 };
  const threshold = state.config.nudgeThreshold ?? 0.75;

  const candidates = state.challenges
    .filter((c) => c.published !== false && c.status === 'active' && !c.inverse && !isComplete(c, state))
    .map((c) => ({ c, remaining: remainingUnits(c, state), pct: progressPct(c, state) }))
    .filter((x) => x.remaining > 0 && (x.pct >= threshold || x.remaining <= 1))
    .sort((a, b) => (order[a.c.scope] - order[b.c.scope]) || (a.remaining - b.remaining));

  if (candidates.length === 0) return null;
  const { c, remaining } = candidates[0];
  const noun = unitNoun(c, remaining);
  const where = c.scope === 'daily' ? "today's challenge" : `“${c.title}”`;
  const amount = c.unit === 'dollars' ? formatMoney(remaining, 0) : formatNumber(remaining);
  const lead = remaining === 1 && c.unit !== 'dollars' ? 'One more' : `${amount} more`;
  return { challengeId: c.id, text: `${lead} ${noun} closes out ${where}.` };
}

function unitNoun(challenge, count) {
  const plural = count !== 1;
  if (challenge.unit === 'dollars') return 'in premium';
  if (challenge.unit === 'days') return plural ? 'producing days' : 'producing day';
  if (challenge.unit === 'months') return plural ? 'months' : 'month';
  if (challenge.unit === 'applications') return plural ? 'applications' : 'application';
  const product = challenge.product && challenge.product !== 'any' ? `${PRODUCT_LABELS[challenge.product]} ` : '';
  return `${product}${plural ? 'policies' : 'policy'}`;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatMoney(n, decimals) {
  const value = Number(n) || 0;
  const d = decimals === undefined ? (Number.isInteger(value) ? 0 : 2) : decimals;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

export function formatNumber(n) {
  return (Number(n) || 0).toLocaleString('en-US');
}

/** `$684.2K`, `$1M` — for the tight two-column rows in the optimizer panel,
 *  where `$684,200/$1,000,000` will not fit on a phone. */
export function formatMoneyCompact(n) {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1000000) return `$${trimZero(v / 1000000)}M`;
  if (Math.abs(v) >= 10000) return `$${trimZero(v / 1000)}K`;
  return formatMoney(v, 0);
}

function trimZero(n) {
  return String(Math.round(n * 10) / 10);
}

export function formatXP(n) {
  return `${formatNumber(n)} XP`;
}

export { daysRemaining };
