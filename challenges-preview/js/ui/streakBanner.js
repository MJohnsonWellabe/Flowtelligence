/**
 * streakBanner.js — the streak banner and the level/tier/XP header strip.
 *
 * The banner is the first thing seen on load and the main entry point into the
 * career surface: clicking anywhere on it routes to the Challenges tab.
 */
import {
  bonusActive, bonusLabel, daysToBonus, effectivePayout, isBoosted, nearMissNudge,
  progressFraction, progressPct, todaysDaily, formatMoney, formatNumber, xpProgress
} from '../derive.js';
import { countdownLabel } from '../time.js';
import { esc, flameIcon, progressBar, rewardAmount } from './components.js';

export function streakBannerHTML(state) {
  const daily = todaysDaily(state);
  const streak = state.agent.streak;
  const active = bonusActive(state);
  const toGo = daysToBonus(state);
  const pct = Math.round((state.config.streakBonusMultiplier - 1) * 100);
  const nudge = nearMissNudge(state);

  const bonusChip = active
    ? `<span class="chip-flame">${flameIcon(12)}${esc(bonusLabel(state))}</span>`
    : `<span class="chip-flame" style="opacity:.75">${esc(
        toGo === 1
          ? `1 day to unlock +${pct}% on every daily reward`
          : `${toGo} days to unlock +${pct}% on every daily reward`
      )}</span>`;

  let right = '';
  let bar = '';
  if (daily) {
    const boosted = isBoosted(daily, state);
    right = `
      <span class="streak-today">Today: <b>${esc(daily.title)}</b></span>
      <span class="streak-today">${esc(progressFraction(daily, state).replace('/', ' of '))} ·
        ${rewardAmount({
          base: daily.baseReward,
          effective: effectivePayout(daily, state),
          boosted,
          bonusText: null,
          formatMoney
        })}
      </span>`;
    bar = progressBar({
      pct: progressPct(daily, state),
      fraction: progressFraction(daily, state),
      caption: countdownLabel(daily.endsAt) || undefined
    });
  } else {
    right = '<span class="streak-today">No daily assigned for today.</span>';
  }

  // A div rather than a <button>: the banner is clickable as a whole, but it
  // also contains the Optimize control, and interactive content nested inside a
  // button is invalid. The delegated handler resolves to the nearest
  // [data-action], so a click on Optimize never also fires the banner.
  return `
  <div class="streak-banner" role="button" tabindex="0" data-action="goto-challenges">
    <div class="streak-top">
      <span class="streak-count">${flameIcon(18)}${esc(formatNumber(streak.current))} day streak</span>
      ${bonusChip}
      <span class="streak-spacer"></span>
      ${right}
    </div>
    ${bar}
    ${nudge ? `<div class="nudge">${flameIcon(13)}<span>${esc(nudge.text)}</span></div>` : ''}
    <div class="actions">
      <span class="btn gold" data-action="open-optimizer" role="button" tabindex="0">Optimize my income today</span>
    </div>
  </div>`;
}

/** Level, XP to next level, and the tier badge — shown at the top of Challenges. */
export function headerStripHTML(state) {
  const a = state.agent;
  const pct = xpProgress(state);
  return `<div class="headerstrip">
    <div>
      <div style="font-size:22px;font-weight:700;line-height:1">Level ${esc(formatNumber(a.level))}</div>
      <div class="xp-text">${esc(a.name)}</div>
    </div>
    <span class="tier-badge">${esc(a.tier)}</span>
    <div class="xp-wrap">
      <div class="xp-track"><div class="xp-fill" style="width:${(pct * 100).toFixed(1)}%"></div></div>
      <div class="xp-text">${esc(formatNumber(a.xp))} / ${esc(formatNumber(a.xpToNextLevel))} XP ·
        ${esc(formatNumber(Math.max(0, a.xpToNextLevel - a.xp)))} to level ${esc(formatNumber(a.level + 1))}</div>
    </div>
    <span class="btn gold" data-action="open-optimizer" role="button" tabindex="0">Optimize my income today</span>
  </div>`;
}
