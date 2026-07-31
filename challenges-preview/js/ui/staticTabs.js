/**
 * staticTabs.js — My Submissions, Messages and Incentives.
 *
 * These three are deliberately inert, per the brief. The filter pills do not
 * filter, pagination does not paginate, rows do not open, threads do not open,
 * and Redeem now does nothing. The only live thing on My Submissions is the
 * streak banner at the top, which reads from the store like everything else.
 */
import { esc, chipRow, clockIcon, countdown, flanked, pager, progressBar, trophy } from './components.js';
import { streakBannerHTML } from './streakBanner.js';
import { countdownLabel } from '../time.js';

export function submissionsHTML(state) {
  return `
    ${streakBannerHTML(state)}

    <div class="section-head">
      <div class="pills" role="group" aria-label="Filter (decorative)">
        <button class="pill on">Incomplete</button>
        <button class="pill">Pending</button>
        <button class="pill">Complete</button>
      </div>
      <span class="hint">Demo data · filters are not wired</span>
    </div>

    <div class="table-wrap">
      <table class="table">
        <thead><tr>
          <th>Applicant</th><th>State</th><th>Products</th>
          <th>Date Started</th><th>Last Updated</th><th>Current Step</th>
        </tr></thead>
        <tbody>${state.submissions.map((s) => `
          <tr>
            <td>${esc(s.applicant)}</td>
            <td>${esc(s.state)}</td>
            <td>${esc(s.products)}</td>
            <td>${esc(s.dateStarted)}</td>
            <td>${esc(s.lastUpdated)}</td>
            <td>${esc(s.currentStep)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${pager(1, 4)}`;
}

export function messagesHTML(state) {
  return `
    <div class="section-head">
      <h3>Messages</h3>
      <span class="hint">Demo data · threads do not open</span>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>From</th><th>Subject</th><th>Received</th></tr></thead>
        <tbody>${state.messages.map((m) => `
          <tr>
            <td>${esc(m.from)}</td>
            <td>
              <div style="font-weight:${m.unread ? 700 : 400}">${esc(m.subject)}</div>
              <div style="font-size:12px;color:var(--text-soft);white-space:normal;max-width:520px">${esc(m.preview)}</div>
            </td>
            <td>${esc(m.date)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${pager(1, 2)}`;
}

export function incentivesHTML(state) {
  const inc = state.incentives;
  const selected = inc.items.find((i) => i.id === inc.selectedId) || inc.items[0];

  const chips = inc.items.map((i) => ({
    id: i.id,
    name: i.name,
    tags: [
      { text: i.status === 'active' ? 'Active' : 'Ended', kind: i.status === 'active' ? 'active' : 'muted' },
      ...(i.rewardAvailable ? [{ text: 'Reward Available', kind: 'reward' }] : [])
    ]
  }));

  // Layout mirrors the product: description card with countdown and the gold
  // "Application progress" bar on the left, the two trophy columns on the right.
  const body = `
    <div class="inc-grid">
      <div class="card">
        <h3 class="card-title">${esc(selected.name)}</h3>
        <p class="card-desc" style="white-space:normal">“${esc(selected.description)}”</p>
        <div class="card-meta" style="justify-content:center">
          ${countdown(countdownLabel(selected.endsAt), false)}
        </div>
        <div class="inc-progress-label">Application progress</div>
        ${progressBar({
          pct: selected.progressPct,
          fraction: selected.progressFraction,
          caption: selected.progressCaption,
          fire: false
        })}
      </div>

      <div class="card">
        <div class="trophy-cols">
          <div class="trophy-col">
            <h4>Incentive details</h4>
            ${trophy(false, 44)}
            <div class="value">${esc(selected.cashReward)}</div>
            <div class="cap">cash reward</div>
          </div>
          <div class="trophy-col">
            <h4>Your payout</h4>
            ${trophy(selected.rewardAvailable, 44)}
            <div class="value">${esc(selected.redeemed)}</div>
            <div class="cap">redeemed so far</div>
            <button class="btn sm" ${selected.rewardAvailable ? '' : 'disabled'}>Redeem now</button>
          </div>
        </div>
      </div>
    </div>`;

  return `
    <div class="section-head">
      <h3>Incentives</h3>
      <span class="hint">Demo data · nothing here is wired</span>
    </div>
    <div class="chiprow-wrap">
      ${chipRow(chips, selected.id, 'select-incentive')}
      <span class="chiprow-clock" aria-hidden="true">${clockIcon(20)}</span>
    </div>
    ${flanked(body)}

    <div class="section-head"><h3>Qualified applications</h3></div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th>Applicant name</th><th>Product</th><th>Date submitted</th><th>Date redeemed</th></tr></thead>
        <tbody>${inc.qualified.map((q) => `
          <tr>
            <td>${esc(q.applicant)}</td><td>${esc(q.product)}</td>
            <td>${esc(q.submitted)}</td><td>${esc(q.redeemed)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    ${pager(1, 3)}`;
}
