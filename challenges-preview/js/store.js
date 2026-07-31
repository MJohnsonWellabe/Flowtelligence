/**
 * store.js — the single source of truth.
 *
 * The streak banner, the Challenges tab, the optimizer and Admin all read from
 * here and nowhere else, which is what keeps them from diverging. Admin is the
 * only surface that writes; every write publishes to subscribers, so an edit in
 * Admin repaints the other tabs with no refresh.
 *
 * Persistence is one namespaced localStorage key. Seed on first load, hard
 * reset back to seed on demand, export/import as JSON to move a configured
 * demo between machines.
 */
import { seedState } from './demoData.js';

const KEY = 'flowtelligence.challengesPreview.v1';

let state = null;
const listeners = new Set();

/** Fills in anything a stored payload is missing, so a store written by an
 *  earlier pass of this prototype still loads instead of throwing. */
function normalize(loaded) {
  const seed = seedState();
  if (!loaded || typeof loaded !== 'object') return seed;
  return {
    version: seed.version,
    config: { ...seed.config, ...(loaded.config || {}),
      effortWeights: { ...seed.config.effortWeights, ...((loaded.config || {}).effortWeights || {}) },
      optimizer: { ...seed.config.optimizer, ...((loaded.config || {}).optimizer || {}) } },
    agent: { ...seed.agent, ...(loaded.agent || {}),
      streak: { ...seed.agent.streak, ...((loaded.agent || {}).streak || {}) } },
    challenges: Array.isArray(loaded.challenges) ? loaded.challenges : seed.challenges,
    badges: Array.isArray(loaded.badges) ? loaded.badges : seed.badges,
    schedule: Array.isArray(loaded.schedule) ? loaded.schedule : seed.schedule,
    history: Array.isArray(loaded.history) ? loaded.history : seed.history,
    submissions: Array.isArray(loaded.submissions) ? loaded.submissions : seed.submissions,
    messages: Array.isArray(loaded.messages) ? loaded.messages : seed.messages,
    incentives: loaded.incentives || seed.incentives,
    ui: { ...seed.ui, ...(loaded.ui || {}) }
  };
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    // Private-browsing or a full quota. The demo keeps working in memory; only
    // surviving a refresh is lost, so this is worth a console note and nothing
    // more intrusive.
    console.warn('[challenges-preview] could not persist store:', err);
  }
}

export function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw) {
    try {
      state = normalize(JSON.parse(raw));
    } catch {
      state = seedState();
    }
  } else {
    state = seedState();
  }
  persist();
  return state;
}

export function getState() {
  if (!state) load();
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function publish() {
  persist();
  listeners.forEach((fn) => fn(state));
}

/**
 * The only write path. `mutator` receives the live state and edits it in place;
 * anything it returns is ignored. Every caller goes through here so no write can
 * skip persistence or leave a subscriber stale.
 */
export function update(mutator) {
  if (!state) load();
  mutator(state);
  publish();
  return state;
}

/** Convenience for the very common "patch config" case. */
export function setConfig(patch) {
  return update((s) => { Object.assign(s.config, patch); });
}

export function setAgent(patch) {
  return update((s) => { Object.assign(s.agent, patch); });
}

export function setStreak(patch) {
  return update((s) => { Object.assign(s.agent.streak, patch); });
}

export function getChallenge(id) {
  return getState().challenges.find((c) => c.id === id) || null;
}

export function upsertChallenge(challenge) {
  return update((s) => {
    const i = s.challenges.findIndex((c) => c.id === challenge.id);
    if (i >= 0) s.challenges[i] = challenge;
    else s.challenges.push(challenge);
  });
}

export function removeChallenge(id) {
  return update((s) => {
    s.challenges = s.challenges.filter((c) => c.id !== id);
    s.schedule = s.schedule.filter((e) => e.challengeId !== id);
  });
}

export function upsertBadge(badge) {
  return update((s) => {
    const i = s.badges.findIndex((b) => b.id === badge.id);
    if (i >= 0) s.badges[i] = badge;
    else s.badges.push(badge);
  });
}

export function removeBadge(id) {
  return update((s) => { s.badges = s.badges.filter((b) => b.id !== id); });
}

/** Pin a challenge to a date in the daily planner. `challengeId` null clears. */
export function assignScheduleDate(date, challengeId) {
  return update((s) => {
    s.schedule = s.schedule.filter((e) => e.date !== date);
    if (challengeId) s.schedule.push({ date, challengeId });
    s.schedule.sort((a, b) => a.date.localeCompare(b.date));
  });
}

export function resetToSeed() {
  const theme = state && state.ui ? state.ui.theme : 'light';
  state = seedState();
  state.ui.theme = theme; // a reset should not fight the reviewer's theme choice
  publish();
  return state;
}

export function exportJSON() {
  return JSON.stringify(getState(), null, 2);
}

/** Returns { ok, error }. A bad file must not wipe a configured demo. */
export function importJSON(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.challenges)) {
    return { ok: false, error: 'That JSON is not a challenges-preview export.' };
  }
  state = normalize(parsed);
  publish();
  return { ok: true };
}

/** Uniqueness helper for Admin's create/duplicate actions. */
export function uniqueId(base) {
  const existing = new Set(getState().challenges.map((c) => c.id).concat(getState().badges.map((b) => b.id)));
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
