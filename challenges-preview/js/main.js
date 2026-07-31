/**
 * main.js — the shell: sidebar, tab switching, theme, and one delegated
 * listener per event type for the whole route.
 *
 * Nothing here does routing in the URL sense; the brief asks for tab switching
 * and no more. Every repaint reads the store fresh, so an Admin edit shows up
 * on the other tabs the moment it lands.
 */
import { getState, load, subscribe, update } from './store.js';
import {
  redeemableIncentiveCount, unclaimedRewardCount, unreadMessageCount, formatNumber
} from './derive.js';
import { cloudArt, esc, noticeModal, rewardModal, sunIcon } from './ui/components.js';
import { incentivesHTML, messagesHTML, submissionsHTML } from './ui/staticTabs.js';
import { challengesHTML, setSelection, toggleScope } from './ui/challenges.js';
import { closePanel, openPanel } from './ui/optimizerPanel.js';
import {
  adminClick, adminDragStart, adminDrop, adminFileImport, adminHTML, adminInput,
  adminOverlayHTML, bindState
} from './ui/admin.js';
import { effectivePayout } from './derive.js';

const TABS = [
  ['submissions', 'My Submissions'],
  ['messages', 'Messages'],
  ['incentives', 'Incentives'],
  // The tab is "Rewards"; the individual items inside it are still challenges,
  // which is what the data model and the copy call them.
  ['challenges', 'Rewards'],
  ['admin', 'Admin']
];

const app = document.getElementById('app');
const overlayRoot = document.getElementById('overlay');
const panelRoot = document.getElementById('panel');

/** Shell-level overlay state: the reward celebration and its confirmation. */
let overlay = null;

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function badgeCounts(state) {
  return {
    messages: unreadMessageCount(state),
    incentives: redeemableIncentiveCount(state),
    challenges: unclaimedRewardCount(state)
  };
}

function sidebarHTML(state) {
  return `<aside class="sidebar">
    <div class="sidebar-brand">
      <div class="wordmark">wellabe<sup>®</sup></div>
      <div class="powered">Powered by <span class="gold-underline">MyEnroller</span></div>
    </div>

    <div class="sidebar-start">
      <h2>Start New Application</h2>
      <div class="field">
        <label for="state-field">State</label>
        <input id="state-field" value="IA" readonly>
      </div>
      <button class="btn block">Start new</button>
    </div>

    <div class="sidebar-art">${cloudArt()}</div>

    <div class="sidebar-foot">
      <button class="btn outline block">Quick Quote</button>
      <button class="btn block">Logout</button>
      <button class="theme-toggle" data-action="toggle-theme"
              aria-label="Switch to ${state.ui.theme === 'dark' ? 'light' : 'dark'} theme">
        <span class="sun">${sunIcon(20)}</span>
        ${state.ui.theme === 'dark' ? 'Light theme' : 'Dark theme'}
      </button>
      <div class="demo-marker">Demo data — not production reporting</div>
    </div>
  </aside>`;
}

function tabbarHTML(state) {
  const counts = badgeCounts(state);
  return `<div class="tabbar" role="tablist">${TABS.map(([id, label]) => {
    const n = counts[id];
    return `<button class="tab" role="tab" data-action="tab" data-id="${id}"
      aria-selected="${state.ui.activeTab === id}">
      ${esc(label)}${n ? `<span class="badge" aria-label="${n} new">${esc(formatNumber(n))}</span>` : ''}
    </button>`;
  }).join('')}</div>`;
}

function panelHTML(state) {
  switch (state.ui.activeTab) {
    case 'messages': return messagesHTML(state);
    case 'incentives': return incentivesHTML(state);
    case 'challenges': return challengesHTML(state);
    case 'admin': return adminHTML(state);
    default: return submissionsHTML(state);
  }
}

function render() {
  const state = getState();
  document.documentElement.dataset.theme = state.ui.theme;
  app.innerHTML = `${sidebarHTML(state)}
    <main class="main">
      ${tabbarHTML(state)}
      <div class="panel" role="tabpanel">${panelHTML(state)}</div>
    </main>`;
  renderOverlay();
}

/** Repaints everything except the active panel — used while typing in an Admin
 *  field, so the shell's badges and banner update without stealing the caret. */
function renderShellOnly() {
  const state = getState();
  const bar = app.querySelector('.tabbar');
  if (bar) bar.outerHTML = tabbarHTML(state);
  renderOverlay();
}

function renderOverlay() {
  const state = getState();
  if (overlay && overlay.kind === 'reward') {
    const c = state.challenges.find((x) => x.id === overlay.id);
    if (!c) { overlay = null; overlayRoot.innerHTML = ''; return; }
    overlayRoot.innerHTML = rewardModal({
      title: c.title,
      body: 'Your reward is processed instantly and sent to the account we have on file for you.',
      payout: `$${effectivePayout(c, state).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      xp: `${formatNumber(c.xp)} XP will be added to your career total.`,
      claimAction: 'claim-reward',
      dismissAction: 'dismiss-reward'
    });
    return;
  }
  if (overlay && overlay.kind === 'claimed') {
    overlayRoot.innerHTML = noticeModal({
      heading: '',
      body: 'Your reward has been successfully redeemed.',
      closeAction: 'close-notice'
    });
    return;
  }
  overlayRoot.innerHTML = getState().ui.activeTab === 'admin' ? adminOverlayHTML(state) : '';
}

/**
 * The store publishes on every write, and the subscriber below is the single
 * place that repaints. `shellOnlyNext` lets Admin say "this next write is me
 * typing — repaint your chrome, not my form", which is what keeps focus and
 * caret position while a field is being edited.
 */
let shellOnly = false;

const api = {
  repaint: render,
  shellOnlyNext: () => { shellOnly = true; },
  goToTab: (id) => { update((s) => { s.ui.activeTab = id; }); }
};

// ---------------------------------------------------------------------------
// Events — one delegated listener per type, for the whole route
// ---------------------------------------------------------------------------

function handleAction(action, el) {
  const state = getState();

  switch (action) {
    case 'stop': return true;

    case 'tab':
      update((s) => { s.ui.activeTab = el.dataset.id; });
      return true;

    case 'goto-challenges':
      update((s) => { s.ui.activeTab = 'challenges'; });
      return true;

    case 'toggle-theme':
      update((s) => { s.ui.theme = s.ui.theme === 'dark' ? 'light' : 'dark'; });
      return true;

    case 'select-daily': case 'select-weekly': case 'select-monthly': case 'select-career':
      setSelection(action.replace('select-', ''), el.dataset.id);
      render();
      return true;

    case 'toggle-scope':
      toggleScope(el.dataset.id);
      render();
      return true;

    case 'select-incentive':
      update((s) => { s.incentives.selectedId = el.dataset.id; });
      return true;

    case 'open-optimizer':
      openPanel(panelRoot, state, null);
      return true;

    case 'close-optimizer':
      closePanel(panelRoot);
      return true;

    case 'open-reward':
      overlay = { kind: 'reward', id: el.dataset.id };
      renderOverlay();
      return true;

    case 'dismiss-reward':
      overlay = null;
      renderOverlay();
      return true;

    case 'claim-reward': {
      const id = overlay.id;
      update((s) => {
        const c = s.challenges.find((x) => x.id === id);
        if (!c) return;
        c.status = 'claimed';
        s.agent.xp += Number(c.xp) || 0;
        if (c.badgeId) {
          const b = s.badges.find((x) => x.id === c.badgeId);
          if (b && !b.earnedAt) b.earnedAt = new Date().toISOString().slice(0, 19);
        }
        s.history.push({ date: new Date().toISOString().slice(0, 10), challengeId: id, completedValue: c.target, claimed: true });
      });
      overlay = { kind: 'claimed' };
      renderOverlay();
      return true;
    }

    case 'close-notice':
      overlay = null;
      render();
      return true;

    default:
      if (state.ui.activeTab === 'admin') return adminClick(action, el, state, api);
      return false;
  }
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'stop') return;
  if (handleAction(action, el)) e.preventDefault();
});

// Elements given role="button" need keyboard parity with real buttons.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (panelRoot.innerHTML) { closePanel(panelRoot); return; }
    if (overlay) { overlay = null; renderOverlay(); return; }
    if (overlayRoot.innerHTML) { adminClick('a-cancel-edit', document.createElement('div'), getState(), api); }
    return;
  }
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('[data-action][role="button"], [data-action][tabindex]');
  if (!el || el.tagName === 'BUTTON') return;
  e.preventDefault();
  handleAction(el.dataset.action, el);
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (!el.dataset) return;
  if (getState().ui.activeTab === 'admin' || el.dataset.target === 'draft') adminInput(el, api);
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset && el.dataset.role === 'import' && el.files && el.files[0]) {
    adminFileImport(el.files[0], api);
    el.value = '';
    return;
  }
  if (!el.dataset) return;
  if (getState().ui.activeTab === 'admin' || el.dataset.target === 'draft') adminInput(el, api);
});

// Drag-and-drop for the Admin daily planner. Touch users get the tap-to-assign
// picker instead, which is the path that matters at 390px.
document.addEventListener('dragstart', (e) => {
  const el = e.target.closest ? e.target.closest('[data-drag]') : null;
  if (!el) return;
  adminDragStart(el);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
});
document.addEventListener('dragover', (e) => {
  const day = e.target.closest ? e.target.closest('[data-drop]') : null;
  if (!day) return;
  e.preventDefault();
  day.classList.add('dragover');
});
document.addEventListener('dragleave', (e) => {
  const day = e.target.closest ? e.target.closest('[data-drop]') : null;
  if (day) day.classList.remove('dragover');
});
document.addEventListener('drop', (e) => {
  const day = e.target.closest ? e.target.closest('[data-drop]') : null;
  if (!day) return;
  e.preventDefault();
  day.classList.remove('dragover');
  adminDrop(day.dataset.date, api);
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

load();
bindState(getState);
subscribe(() => {
  if (shellOnly) { shellOnly = false; renderShellOnly(); return; }
  render();
});
render();
