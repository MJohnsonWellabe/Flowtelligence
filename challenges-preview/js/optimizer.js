/**
 * optimizer.js — "Optimize my income today", as a deterministic scoring engine.
 *
 * No model call. This is a constrained optimization problem, not a language
 * problem: the answer is computable exactly from the store, and it has to be
 * instant, offline, and identical every time the button is pressed in front of
 * an audience. A model call would be slower, non-deterministic, worse at the
 * arithmetic, and would require an API key sitting in a client bundle on a
 * publicly reachable URL.
 *
 * The interface is deliberately narrow — `recommend(state)` in, a plain result
 * object out — so a model call could be swapped in behind it later without the
 * panel changing at all.
 *
 * The idea that makes this worth building: it ranks ACTIONS, not challenges.
 * One action advances several challenges at once, and the recommendation has to
 * reflect that combined value.
 */
import {
  bonusActive, effectivePayout, isComplete, meetsTier, progressFor, progressFraction,
  remainingUnits, todaysDaily, todaysDailyIncomplete, formatMoney, formatMoneyCompact,
  formatNumber, daysRemaining
} from './derive.js';

/**
 * Average submitted annualized premium per issued policy, by line. Fabricated,
 * like everything else here, but held in one place so the premium arithmetic on
 * every card ties back to a single number.
 */
const PREMIUM_PER_POLICY = { MS: 925, HI: 640, D: 310, STC: 1180 };

/** Mixed-line assumption for actions that are not product-specific. */
const MIXED_PREMIUM_PER_POLICY = 700;

const PRODUCT_NAMES = {
  MS: 'Medicare Supplement', HI: 'Hospital Indemnity', D: 'Dental', STC: 'Short Term Care'
};

// ---------------------------------------------------------------------------
// Candidate actions
//
// Each candidate carries `deltas`, a map of `metric|product` → units. A
// challenge is advanced by a candidate when the key it cares about is present:
// a challenge with product "any" reads `metric|any`, a product-specific one
// reads `metric|<product>`. Keeping both keys separate is what stops a single
// action from being counted twice against the same challenge.
// ---------------------------------------------------------------------------

function policyDeltas(product, n) {
  const premium = (PREMIUM_PER_POLICY[product] || MIXED_PREMIUM_PER_POLICY) * n;
  return {
    [`policies|${product}`]: n,
    'policies|any': n,
    'apps|any': n,
    'premium|any': premium,
    'producing_days|any': 1,
    'lifetime_premium|any': premium,
    'lifetime_policies|any': n,
    [`lifetime_policies|${product}`]: n
  };
}

function buildCandidates(state) {
  const w = state.config.effortWeights;
  const out = [];

  // Writing policies, by line. The dominant action in this book of business.
  Object.keys(PREMIUM_PER_POLICY).forEach((product) => {
    const sizes = product === 'D' ? [1, 2] : [1, 2, 3];
    sizes.forEach((n) => {
      out.push({
        id: `write-${product}-${n}`,
        family: `write-${product}`,
        label: `Write ${n} ${PRODUCT_NAMES[product]} ${n === 1 ? 'policy' : 'policies'}`,
        effort: n * w.policy,
        effortNote: `${n} ${n === 1 ? 'policy' : 'policies'}`,
        deltas: policyDeltas(product, n)
      });
    });
  });

  // Premium-primary: a mixed bag of business sized in dollars rather than count.
  [1000, 2000].forEach((amount) => {
    const policies = Math.max(1, Math.round(amount / MIXED_PREMIUM_PER_POLICY));
    out.push({
      id: `premium-${amount}`,
      family: 'premium',
      label: `Place ${formatMoney(amount, 0)} of submitted annualized premium`,
      effort: (amount / 500) * w.premiumPer500,
      effortNote: `about ${policies} ${policies === 1 ? 'policy' : 'policies'} of mixed business`,
      deltas: {
        'premium|any': amount,
        'policies|any': policies,
        'apps|any': policies,
        'producing_days|any': 1,
        'lifetime_premium|any': amount,
        'lifetime_policies|any': policies
      }
    });
  });

  // Applications through submit, without assuming they issue today.
  [2, 3].forEach((n) => {
    out.push({
      id: `apps-${n}`,
      family: 'apps',
      label: `Submit ${n} applications`,
      effort: n * w.application,
      effortNote: `${n} applications`,
      deltas: { 'apps|any': n, 'producing_days|any': 1 }
    });
  });

  // Quality actions.
  [1, 2].forEach((n) => {
    out.push({
      id: `clean-${n}`,
      family: 'clean',
      label: `Push ${n} ${n === 1 ? 'application' : 'applications'} through clean, nothing pended`,
      effort: n * w.cleanSubmit,
      effortNote: `${n} clean ${n === 1 ? 'submit' : 'submits'}`,
      deltas: { 'clean_submits|any': n, 'apps|any': n, 'producing_days|any': 1 }
    });
  });

  // Cross-sell: attach a second line to a client already in flight. Costs a
  // policy plus the attachment overhead — putting Dental on an in-flight client
  // still means writing the Dental policy, so charging only crossSell here
  // undercounts it badly enough to float sub-policy actions to rank 1.
  out.push({
    id: 'cross-1',
    family: 'cross',
    label: 'Attach a second product line to a client already in flight',
    effort: w.policy + w.crossSell,
    effortNote: 'one attachment',
    deltas: {
      'cross_sell|any': 1, 'cross_sell|D': 1,
      'policies|any': 1, 'policies|D': 1, 'product_lines|any': 1,
      'apps|any': 1, 'producing_days|any': 1,
      'premium|any': PREMIUM_PER_POLICY.D, 'lifetime_premium|any': PREMIUM_PER_POLICY.D,
      'lifetime_policies|any': 1, 'lifetime_policies|D': 1
    }
  });

  // Opening a new product line means writing a policy in it, so it costs a
  // policy plus the cross-sell overhead — not the overhead alone.
  [1, 2].forEach((n) => {
    out.push({
      id: `lines-${n}`,
      family: 'lines',
      label: `Write business in ${n} additional product ${n === 1 ? 'line' : 'lines'}`,
      effort: n * (w.policy + w.crossSell),
      effortNote: `${n} ${n === 1 ? 'policy' : 'policies'} in ${n === 1 ? 'a new line' : 'new lines'}`,
      deltas: {
        'product_lines|any': n,
        'policies|any': n, 'apps|any': n, 'producing_days|any': 1,
        'premium|any': MIXED_PREMIUM_PER_POLICY * n,
        'lifetime_premium|any': MIXED_PREMIUM_PER_POLICY * n,
        'lifetime_policies|any': n
      }
    });
  });

  return out;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Challenges an action taken today could actually move.
 *
 * The two exclusions that matter: a `locked` challenge has not opened yet, and
 * a daily other than the one the planner pinned to today belongs to a different
 * day. Without both, tomorrow's daily gets counted as cash available now.
 */
function openChallenges(state) {
  const today = todaysDaily(state);
  const todayId = today ? today.id : null;
  return state.challenges.filter((c) =>
    c.published !== false &&
    c.status === 'active' &&
    !c.inverse &&
    (c.scope !== 'daily' || c.id === todayId) &&
    meetsTier(c, state) &&
    !isComplete(c, state));
}

/**
 * How hard a challenge's deadline pushes on the ranking. A weekly closing
 * tomorrow has to outrank a monthly at the same completion with three weeks
 * left; a career track, which never closes, presses least of all.
 */
function urgency(challenge) {
  const d = daysRemaining(challenge.endsAt);
  if (!Number.isFinite(d)) return 0.6;
  return Math.max(1, Math.min(5, 1 + 2 / (d + 0.5)));
}

function deltaFor(candidate, challenge) {
  const key = `${challenge.metric}|${challenge.product === 'any' ? 'any' : challenge.product}`;
  return candidate.deltas[key] || 0;
}

/**
 * Evaluate one candidate against current state, ignoring any challenge already
 * satisfied by a higher-ranked recommendation. Returns null when the action
 * advances nothing worth reporting.
 */
function evaluate(candidate, state, satisfied) {
  const advances = [];
  let weighted = 0;
  let cashToday = 0;
  const completes = [];
  const daily = todaysDaily(state);

  openChallenges(state).forEach((c) => {
    if (satisfied.has(c.id)) return;
    const units = deltaFor(candidate, c);
    if (units <= 0) return;

    const remaining = remainingUnits(c, state);
    if (remaining <= 0) return;

    const delivered = Math.min(units, remaining);
    const payout = effectivePayout(c, state);
    const willComplete = units >= remaining;
    const value = willComplete ? payout : payout * (delivered / (Number(c.target) || 1));

    const completionWeight = state.config.optimizer.completionWeight ?? 1;
    weighted += value * urgency(c) * (willComplete ? completionWeight : 1);
    if (willComplete) {
      cashToday += payout;
      completes.push(c.id);
    }
    advances.push({
      challengeId: c.id,
      scope: c.scope,
      title: c.title,
      label: daily && c.id === daily.id ? "Today's daily" : c.title,
      current: compactFraction(c, state),
      delta: delivered,
      deltaText: c.unit === 'dollars' ? `+${formatMoneyCompact(delivered)}` : `+${formatNumber(delivered)}`,
      completes: willComplete,
      afterFraction: afterFraction(c, state, delivered),
      payout,
      value
    });
  });

  if (advances.length === 0) return null;

  const protectsStreak = !!daily && bonusActive(state) && completes.includes(daily.id);

  let score = weighted / Math.max(candidate.effort, 0.01);
  if (protectsStreak) score *= state.config.optimizer.streakProtectionMultiplier;

  // Rank completions first, then the biggest partial movers.
  advances.sort((a, b) => (Number(b.completes) - Number(a.completes)) || (b.value - a.value));

  return { candidate, advances, completes, cashToday, score, protectsStreak };
}

/** Prefer the size that closes the most challenges; break ties on cheapness. */
function betterSize(a, b) {
  if (a.completes.length !== b.completes.length) return a.completes.length > b.completes.length;
  if (Math.abs(a.candidate.effort - b.candidate.effort) > 1e-9) return a.candidate.effort < b.candidate.effort;
  return a.candidate.id < b.candidate.id;
}

function afterFraction(challenge, state, delivered) {
  const after = progressFor(challenge, state) + delivered;
  const t = Number(challenge.target) || 0;
  if (challenge.unit === 'dollars') return `${formatMoneyCompact(after)}/${formatMoneyCompact(t)}`;
  return `${formatNumber(after)}/${formatNumber(t)}`;
}

function compactFraction(challenge, state) {
  if (challenge.unit !== 'dollars') return progressFraction(challenge, state);
  return `${formatMoneyCompact(progressFor(challenge, state))}/${formatMoneyCompact(challenge.target)}`;
}

/**
 * One sentence explaining the rank, assembled from what the maths actually
 * found — a lead clause plus at most one supporting clause, and never the same
 * fact stated twice.
 */
function reasoning(result, rank, state) {
  // The card already carries a count-by-scope summary, so the reasoning must
  // not restate it — it explains the rank, not the arithmetic.
  const usedAdvanceCount = result.cashToday === 0;
  const lead = rank === 0
    ? (result.cashToday > 0
      ? 'Highest paying single action available'
      : 'Best return on effort available today')
    : (result.cashToday > 0
      ? `Clears ${formatMoney(result.cashToday)} on its own`
      : 'Closes nothing today, but it is the strongest move toward the targets still open');

  if (result.protectsStreak) return `${lead}, and it protects your streak bonus.`;

  const soonest = result.advances
    .filter((a) => a.completes && a.scope !== 'career')
    .map((a) => state.challenges.find((c) => c.id === a.challengeId))
    .filter(Boolean)
    .map((c) => ({ c, d: daysRemaining(c.endsAt) }))
    .sort((a, b) => a.d - b.d)[0];

  if (soonest && Number.isFinite(soonest.d) && soonest.d < 4) {
    const when = soonest.d < 1
      ? 'today'
      : `in ${Math.ceil(soonest.d)} ${Math.ceil(soonest.d) === 1 ? 'day' : 'days'}`;
    return `${lead}, and the ${soonest.c.scope} it closes ends ${when}.`;
  }
  if (!usedAdvanceCount && result.advances.length >= 4) {
    return `${lead}, and it moves ${result.advances.length} challenges at once.`;
  }
  return `${lead}.`;
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

/**
 * @param {object} state the whole store
 * @returns {{ streakWarning: object|null, headline: string, cards: object[], footer: string }}
 */
export function recommend(state) {
  const ceiling = state.config.optimizer.reachabilityCeiling;
  const wanted = Math.max(1, Math.round(state.config.optimizer.recommendationCount) || 3);

  // Reachability filter: anything that cannot plausibly be finished in one day
  // is not a today action, no matter what it would be worth.
  const candidates = buildCandidates(state).filter((c) => c.effort <= ceiling);

  const satisfied = new Set();
  const usedFamilies = new Set();
  const cards = [];

  for (let rank = 0; rank < wanted; rank += 1) {
    // Two-stage pick. Within a family (write MS ×1/×2/×3) the sizes are not
    // competitors — they are the same action done more or less. Value/effort
    // always favours the smallest size, which would recommend one policy when
    // three would close the weekly too, so the size is chosen by how many
    // challenges it closes and only then by cost. Families compete on the
    // brief's score: marginal value over effort.
    const reps = new Map();
    candidates.forEach((cand) => {
      if (usedFamilies.has(cand.family)) return;
      const evaluated = evaluate(cand, state, satisfied);
      if (!evaluated) return;
      const held = reps.get(cand.family);
      if (!held || betterSize(evaluated, held)) reps.set(cand.family, evaluated);
    });

    let best = null;
    reps.forEach((evaluated) => {
      // Deterministic tie-break so repeated presses never reorder.
      if (!best ||
          evaluated.score > best.score + 1e-9 ||
          (Math.abs(evaluated.score - best.score) <= 1e-9 && evaluated.candidate.id < best.candidate.id)) {
        best = evaluated;
      }
    });
    if (!best) break;

    usedFamilies.add(best.candidate.family);
    best.completes.forEach((id) => satisfied.add(id));

    // Rows worth spelling out are the ones that actually pay today; the rest
    // collapse to a single count-by-scope line, because the full listing was
    // drowning the number the panel exists to deliver. When nothing closes, the
    // single biggest mover is promoted to a row so the card is never bare — and
    // it is then excluded from the summary rather than counted twice.
    const completed = best.advances.filter((a) => a.completes);
    const rows = completed.length ? completed : best.advances.slice(0, 1);
    const shown = new Set(rows.map((a) => a.challengeId));
    const remaining = best.advances.filter((a) => !shown.has(a.challengeId));

    cards.push({
      rank: rank + 1,
      action: best.candidate.label,
      cashToday: best.cashToday,
      cashTodayText: formatMoney(best.cashToday),
      advances: best.advances,
      rows,
      alsoAdvancesText: scopeSummary(remaining),
      advancesMore: remaining.length,
      completesCount: best.completes.length,
      effort: best.candidate.effort,
      effortText: `Effort ${best.candidate.effort.toFixed(1)} · ${best.candidate.effortNote}`,
      protectsStreak: best.protectsStreak,
      reasoning: reasoning(best, rank, state)
    });
  }

  const total = cards.reduce((sum, c) => sum + c.cashToday, 0);
  const countWord = { 1: 'this one', 2: 'these two', 3: 'these three' }[cards.length] || `these ${cards.length}`;

  return {
    streakWarning: streakWarning(state),
    headline: total > 0
      ? `Do ${countWord} and you clear ${formatMoney(total)} today.`
      : `Do ${countWord} and you move ${cards.reduce((n, c) => n + c.advances.length, 0)} challenges forward today.`,
    total,
    cards,
    footer: 'Recalculated from your current progress · Updated just now'
  };
}

/** The amber block above the recommendations. Null when there is nothing at risk. */
export function streakWarning(state) {
  if (!bonusActive(state)) return null;
  if (!todaysDailyIncomplete(state)) return null;
  const pct = Math.round((state.config.streakBonusMultiplier - 1) * 100);
  return {
    days: state.agent.streak.current,
    text: `Your ${state.agent.streak.current} day streak ends tonight if you don't close today's challenge.`,
    subtext: `Losing it drops your daily rewards by ${pct}%.`
  };
}

/**
 * "also advances 2 monthlies, 1 weekly and 3 career goals" — the one-line
 * stand-in for everything an action moves without closing.
 */
function scopeSummary(partial) {
  if (partial.length === 0) return '';
  const names = {
    daily: ['daily', 'dailies'],
    weekly: ['weekly', 'weeklies'],
    monthly: ['monthly', 'monthlies'],
    career: ['career goal', 'career goals']
  };
  const counts = {};
  partial.forEach((a) => { counts[a.scope] = (counts[a.scope] || 0) + 1; });

  const parts = ['daily', 'weekly', 'monthly', 'career']
    .filter((s) => counts[s])
    .map((s) => `${counts[s]} ${names[s][counts[s] === 1 ? 0 : 1]}`);

  const phrase = parts.length === 1
    ? parts[0]
    : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `Also advances ${phrase}.`;
}

/** Exposed for the Admin optimizer-tuning screen, which shows what it is tuning. */
export const OPTIMIZER_INTERNALS = { PREMIUM_PER_POLICY, MIXED_PREMIUM_PER_POLICY };
