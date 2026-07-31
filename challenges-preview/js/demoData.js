/**
 * demoData.js — the single seed for the Challenges / Career Mode wireframe.
 *
 * Everything on screen originates here. The store (store.js) copies this into
 * localStorage on first load; "Reset to seed" in Admin copies it again. Nothing
 * in this file is real: every applicant, dollar, and date is fabricated for an
 * internal design review.
 *
 * Demo clock: the walkthrough is set in June 2026, so the whole build reads its
 * "now" from DEMO_NOW rather than the wall clock. See time.js — the clock still
 * ticks (countdowns are live), it is just anchored to the demo date so the
 * screens look identical whenever this is opened.
 */

/** Anchor for every relative date in the demo. Thursday, 25 June 2026. */
export const DEMO_NOW = '2026-06-25T12:16:00';

/** Today's date key. Kept as a literal so the daily planner and the schedule
 *  agree even if a reviewer opens this months from now. */
export const DEMO_TODAY = '2026-06-25';

// ---------------------------------------------------------------------------
// Config — every knob Admin can turn.
// ---------------------------------------------------------------------------

const config = {
  streakBonusThresholdDays: 10,
  streakBonusMultiplier: 1.1,
  streakBonusScopes: ['daily'],
  streakFreezesPerMonth: 2,
  /** A challenge at or above this fraction surfaces a near-miss nudge. */
  nudgeThreshold: 0.75,
  effortWeights: {
    policy: 1.0,
    premiumPer500: 1.0,
    application: 0.6,
    cleanSubmit: 0.3,
    quote: 0.2,
    crossSell: 0.4
  },
  optimizer: {
    streakProtectionMultiplier: 3.0,
    reachabilityCeiling: 4.0,
    recommendationCount: 3,
    // How much more a closed challenge is worth than the same nominal value
    // accrued as partial progress. Partial progress is only potential — the
    // cash lands when the challenge closes — so without this the ranking puts
    // high-premium actions that close nothing above ones that pay out today.
    completionWeight: 2.0
  }
};

// ---------------------------------------------------------------------------
// Agent — mid-flight, per the demo brief: streak 12, best 21, level 14,
// Veteran, one freeze left, bonus active.
// ---------------------------------------------------------------------------

const agent = {
  id: 'agt-40118',
  name: 'Dana Whitfield',
  tier: 'Veteran',
  level: 14,
  xp: 41850,
  xpToNextLevel: 46000,
  tenureMonths: 41,
  lifetimePremium: 684200,
  lifetimePolicies: 3180,
  streak: {
    current: 12,
    best: 21,
    lastCompletedDate: '2026-06-24',
    freezesRemaining: 1,
    // 19th → 25th June. Today (last entry) is still open — the agent is 1 of 2
    // on the daily, which is what arms the amber streak warning.
    last7Days: [true, true, true, true, true, true, false]
  }
};

// ---------------------------------------------------------------------------
// Challenges.
//
// The progress spread is deliberate — the point of the demo is seeing the fire
// bar across its whole range in one screenful:
//   0%      producing-days (weekly), STC volume (monthly)
//   20-45%  weekly premium 42%, product lines 33%, Ten Thousand 32%
//   60-85%  weekly MS 70%, monthly premium 75%, monthly policies 78% (near miss)
//   100%    weekly clean submits + two past dailies, all claimed
//   100%    monthly Hospital Indemnity, UNCLAIMED — this is the one that puts a
//           badge on the Challenges tab and fires the Congratulations modal
// Career sits partially filled throughout; nothing on it is at zero.
// ---------------------------------------------------------------------------

const WEEK_START = '2026-06-22T00:00:00';
const WEEK_END = '2026-06-28T23:59:59';
const MONTH_START = '2026-06-01T00:00:00';
const MONTH_END = '2026-06-30T23:59:59';

/** A daily runs 8am → 4pm on its scheduled day, which is where the
 *  "Ends today at 4:00 PM" countdown in the screenshots comes from. */
function daily(id, date, title, description, metric, product, target, unit, baseReward, xp, progress, status) {
  return {
    id,
    scope: 'daily',
    title,
    description,
    metric,
    product,
    target,
    unit,
    progress,
    baseReward,
    xp,
    badgeId: null,
    tierRequirement: null,
    startsAt: `${date}T08:00:00`,
    endsAt: `${date}T16:00:00`,
    status,
    published: true
  };
}

const dailies = [
  daily('d-ms-2', '2026-06-25', 'Write 2 Medicare Supplement policies',
    'Two issued Medicare Supplement applications before the 4:00 close.',
    'policies', 'MS', 2, 'policies', 25, 100, 1, 'active'),

  daily('d-stc-1', '2026-06-24', 'Write 1 Short Term Care policy',
    'One Short Term Care application submitted and clean.',
    'policies', 'STC', 1, 'policies', 30, 120, 1, 'claimed'),

  daily('d-clean-1', '2026-06-23', 'One clean submit, zero pended items',
    'A single application through to submit with nothing pended.',
    'clean_submits', 'any', 1, 'applications', 15, 60, 1, 'claimed'),

  daily('d-dental-attach', '2026-06-22', 'Attach Dental to any policy',
    'Add a Dental line to any application in flight.',
    'cross_sell', 'D', 1, 'policies', 20, 80, 1, 'claimed'),

  daily('d-premium-1k', '2026-06-21', '$1,000 submitted annualized premium',
    'A thousand dollars of submitted annualized premium in one day.',
    'premium', 'any', 1000, 'dollars', 30, 120, 1000, 'claimed'),

  daily('d-hi-1', '2026-06-20', 'Write 1 Hospital Indemnity policy',
    'One Hospital Indemnity application submitted.',
    'policies', 'HI', 1, 'policies', 20, 80, 1, 'claimed'),

  daily('d-apps-3', '2026-06-19', 'Submit 3 applications before noon',
    'Three applications through submit before the noon cutoff.',
    'apps', 'any', 3, 'applications', 35, 150, 3, 'claimed'),

  daily('d-crosssell-2', '2026-06-26', 'Cross-sell: two product lines, one client',
    'One client, two distinct product lines on the same day.',
    'cross_sell', 'any', 1, 'policies', 50, 200, 0, 'locked')
];

const weeklies = [
  {
    id: 'w-ms-10', scope: 'weekly', title: '10 Medicare Supplement policies',
    description: 'Ten issued Medicare Supplement policies this week.',
    metric: 'policies', product: 'MS', target: 10, unit: 'policies', progress: 7,
    baseReward: 150, xp: 500, badgeId: null, tierRequirement: null,
    startsAt: WEEK_START, endsAt: WEEK_END, status: 'active', published: true
  },
  {
    id: 'w-premium-7500', scope: 'weekly', title: '$7,500 submitted premium',
    description: 'Seventy-five hundred in submitted annualized premium this week.',
    metric: 'premium', product: 'any', target: 7500, unit: 'dollars', progress: 3150,
    baseReward: 200, xp: 650, badgeId: null, tierRequirement: null,
    startsAt: WEEK_START, endsAt: WEEK_END, status: 'active', published: true
  },
  {
    id: 'w-lines-3', scope: 'weekly', title: 'Sell in three product lines',
    description: 'Write business in three distinct product lines this week.',
    metric: 'product_lines', product: 'any', target: 3, unit: 'policies', progress: 1,
    baseReward: 175, xp: 600, badgeId: null, tierRequirement: null,
    startsAt: WEEK_START, endsAt: WEEK_END, status: 'active', published: true
  },
  {
    id: 'w-clean-5', scope: 'weekly', title: '5 clean submits, no NIGO',
    description: 'Five applications submitted clean with nothing returned.',
    metric: 'clean_submits', product: 'any', target: 5, unit: 'applications', progress: 5,
    baseReward: 125, xp: 450, badgeId: null, tierRequirement: null,
    startsAt: WEEK_START, endsAt: WEEK_END, status: 'claimed', published: true
  },
  {
    id: 'w-producing-5', scope: 'weekly', title: 'Five straight producing days',
    description: 'Write business on five consecutive days.',
    metric: 'producing_days', product: 'any', target: 5, unit: 'days', progress: 0,
    baseReward: 100, xp: 400, badgeId: null, tierRequirement: null,
    startsAt: WEEK_START, endsAt: WEEK_END, status: 'active', published: true
  }
];

const monthlies = [
  {
    id: 'm-premium-30k', scope: 'monthly', title: '$30,000 submitted premium',
    description: 'Thirty thousand in submitted annualized premium for June.',
    metric: 'premium', product: 'any', target: 30000, unit: 'dollars', progress: 22400,
    baseReward: 1000, xp: 2500, badgeId: null, tierRequirement: null,
    startsAt: MONTH_START, endsAt: MONTH_END, status: 'active', published: true
  },
  {
    id: 'm-policies-40', scope: 'monthly', title: '40 policies issued',
    description: 'Forty issued policies across every product line.',
    metric: 'policies', product: 'any', target: 40, unit: 'policies', progress: 31,
    baseReward: 750, xp: 2000, badgeId: null, tierRequirement: null,
    startsAt: MONTH_START, endsAt: MONTH_END, status: 'active', published: true
  },
  {
    id: 'm-hi-15', scope: 'monthly', title: '15 Hospital Indemnity policies',
    description: 'Fifteen Hospital Indemnity policies issued in June.',
    metric: 'policies', product: 'HI', target: 15, unit: 'policies', progress: 15,
    baseReward: 600, xp: 1800, badgeId: 'b-hi-month', tierRequirement: null,
    startsAt: MONTH_START, endsAt: MONTH_END, status: 'complete_unclaimed', published: true
  },
  {
    id: 'm-nigo-0', scope: 'monthly', title: 'Zero NIGO for the month',
    description: 'Close June without a single not-in-good-order return.',
    metric: 'nigo_count', product: 'any', target: 0, unit: 'days', progress: 0,
    // An inverse metric: you are not filling a bar toward a target, you are
    // holding a streak of clean days. daysClean drives the fill; target 0 is the
    // NIGO ceiling. See derive.js progressFor().
    inverse: true, daysClean: 25, daysInPeriod: 30,
    baseReward: 500, xp: 1500, badgeId: null, tierRequirement: null,
    startsAt: MONTH_START, endsAt: MONTH_END, status: 'active', published: true
  },
  {
    id: 'm-stc-10', scope: 'monthly', title: '10 Short Term Care policies',
    description: 'Ten Short Term Care policies issued in June.',
    metric: 'policies', product: 'STC', target: 10, unit: 'policies', progress: 0,
    baseReward: 650, xp: 1900, badgeId: null, tierRequirement: 'Veteran',
    startsAt: MONTH_START, endsAt: MONTH_END, status: 'active', published: true
  }
];

/** Career challenges never expire and never take the streak bonus. Progress for
 *  the three agent-linked metrics is derived from agent state at render time
 *  (derive.js), so editing lifetime totals in Admin moves these bars live. */
const career = [
  {
    id: 'c-million', scope: 'career', title: 'Million Dollar Producer',
    description: 'One million dollars of lifetime submitted premium.',
    metric: 'lifetime_premium', product: 'any', target: 1000000, unit: 'dollars', progress: 684200,
    baseReward: 5000, xp: 10000, badgeId: 'b-million', tierRequirement: null,
    startsAt: null, endsAt: null, status: 'active', published: true
  },
  {
    id: 'c-ten-thousand', scope: 'career', title: 'Ten Thousand',
    description: 'Ten thousand lifetime policies placed.',
    metric: 'lifetime_policies', product: 'any', target: 10000, unit: 'policies', progress: 3180,
    baseReward: 10000, xp: 20000, badgeId: 'b-ten-thousand', tierRequirement: null,
    startsAt: null, endsAt: null, status: 'active', published: true
  },
  {
    id: 'c-long-run', scope: 'career', title: 'The Long Run',
    description: 'Twelve consecutive producing months.',
    metric: 'consecutive_producing_months', product: 'any', target: 12, unit: 'months', progress: 9,
    baseReward: 2500, xp: 6000, badgeId: 'b-long-run', tierRequirement: null,
    startsAt: null, endsAt: null, status: 'active', published: true
  },
  {
    id: 'c-hi-century', scope: 'career', title: 'Hospital Indemnity Century',
    description: 'One hundred lifetime Hospital Indemnity policies.',
    metric: 'lifetime_policies', product: 'HI', target: 100, unit: 'policies', progress: 78,
    baseReward: 1500, xp: 4000, badgeId: 'b-hi-century', tierRequirement: null,
    startsAt: null, endsAt: null, status: 'active', published: true
  },
  {
    id: 'c-five-year', scope: 'career', title: 'Five Year Veteran',
    description: 'Sixty months appointed and producing.',
    metric: 'tenure_months', product: 'any', target: 60, unit: 'months', progress: 41,
    baseReward: 2000, xp: 5000, badgeId: 'b-five-year', tierRequirement: null,
    startsAt: null, endsAt: null, status: 'active', published: true
  },
  {
    id: 'c-book', scope: 'career', title: 'Book of Business',
    description: 'Hold 85% twenty-four-month persistency.',
    metric: 'persistency_24mo', product: 'any', target: 85, unit: 'percent', progress: 79,
    baseReward: 3000, xp: 7500, badgeId: 'b-book', tierRequirement: 'Elite',
    startsAt: null, endsAt: null, status: 'active', published: true
  }
];

const challenges = [...dailies, ...weeklies, ...monthlies, ...career];

// ---------------------------------------------------------------------------
// Badges — the feat shelf. Unearned feats stay browsable with their unlock
// condition visible; this is the discovery surface for the whole career track.
// ---------------------------------------------------------------------------

const badges = [
  { id: 'b-first-week', name: 'First Week', description: 'Complete seven daily challenges.', condition: 'Complete 7 dailies', icon: 'flame', rarity: 'common', earnedAt: '2026-02-14T16:04:00' },
  { id: 'b-streak-10', name: 'Ten Day Burn', description: 'Hold a ten day streak.', condition: 'Reach a 10 day streak', icon: 'flame', rarity: 'common', earnedAt: '2026-05-02T15:22:00' },
  { id: 'b-streak-21', name: 'Three Week Run', description: 'Hold a twenty-one day streak.', condition: 'Reach a 21 day streak', icon: 'flame', rarity: 'rare', earnedAt: '2026-06-01T16:00:00' },
  { id: 'b-clean-sweep', name: 'Clean Sweep', description: 'A full week with no NIGO.', condition: '5 clean submits in one week', icon: 'shield', rarity: 'common', earnedAt: '2026-06-19T14:38:00' },
  { id: 'b-hi-month', name: 'Indemnity Fifteen', description: 'Fifteen Hospital Indemnity policies in a month.', condition: '15 HI policies in one month', icon: 'shield', rarity: 'rare', earnedAt: null },
  { id: 'b-cross-liner', name: 'Cross Liner', description: 'Four product lines in a single week.', condition: 'Sell 4 product lines in one week', icon: 'star', rarity: 'rare', earnedAt: null },
  { id: 'b-million', name: 'Million Dollar Producer', description: 'A million dollars of lifetime premium.', condition: '$1,000,000 lifetime premium', icon: 'flame', rarity: 'legendary', earnedAt: null },
  { id: 'b-ten-thousand', name: 'Ten Thousand', description: 'Ten thousand lifetime policies.', condition: '10,000 lifetime policies', icon: 'platinum', rarity: 'legendary', earnedAt: null },
  { id: 'b-long-run', name: 'The Long Run', description: 'Twelve consecutive producing months.', condition: '12 consecutive producing months', icon: 'calendar', rarity: 'epic', earnedAt: null },
  { id: 'b-hi-century', name: 'Hospital Indemnity Century', description: 'One hundred lifetime HI policies.', condition: '100 lifetime HI policies', icon: 'shield', rarity: 'epic', earnedAt: null },
  { id: 'b-five-year', name: 'Five Year Veteran', description: 'Sixty months appointed.', condition: '60 months appointed', icon: 'chevron', rarity: 'epic', earnedAt: null },
  { id: 'b-book', name: 'Book of Business', description: 'Eighty-five percent persistency at 24 months.', condition: '85% 24-month persistency', icon: 'anchor', rarity: 'legendary', earnedAt: null }
];

/** Daily planner assignments. Admin edits this; the Challenges tab reads the
 *  entry whose date is DEMO_TODAY to decide which daily is live. */
const schedule = dailies.map((d) => ({ date: d.startsAt.slice(0, 10), challengeId: d.id }));

const history = dailies
  .filter((d) => d.status === 'claimed')
  .map((d) => ({ date: d.startsAt.slice(0, 10), challengeId: d.id, completedValue: d.target, claimed: true }));

// ---------------------------------------------------------------------------
// Static demo content for the shell tabs. None of this is interactive.
// ---------------------------------------------------------------------------

const submissions = [
  ['Margaret Ellison', 'IA', 'MS', '06/25/2026 11:42 AM', '06/25/2026 12:08 PM', 'Payment'],
  ['Raymond Ochoa', 'IA', 'MS,D', '06/25/2026 10:15 AM', '06/25/2026 11:51 AM', 'Signature'],
  ['Deloris Hartman', 'NE', 'HI', '06/25/2026 09:37 AM', '06/25/2026 10:02 AM', 'Applicant'],
  ['Curtis Vandenberg', 'IA', 'STC,MS,HI,D', '06/24/2026 03:55 PM', '06/25/2026 09:14 AM', 'Replacement'],
  ['Yolanda Pierce', 'MO', 'MS', '06/24/2026 02:21 PM', '06/24/2026 04:47 PM', 'Quote'],
  ['Alvin Brackett', 'IA', 'D', '06/24/2026 01:09 PM', '06/24/2026 01:44 PM', 'Email'],
  ['Rosalind Mayfield', 'NE', 'MS,HI', '06/24/2026 11:30 AM', '06/24/2026 12:55 PM', 'Insurance Information'],
  ['Kenneth Ruiz', 'IA', 'STC', '06/23/2026 04:12 PM', '06/24/2026 08:40 AM', 'Guaranteed Issue'],
  ['Bernadine Kowalski', 'MO', 'MS,D', '06/23/2026 02:48 PM', '06/23/2026 03:31 PM', 'Payment'],
  ['Hollis Trent', 'IA', 'HI,D', '06/23/2026 10:56 AM', '06/23/2026 02:02 PM', 'Signature'],
  ['Marlene Foxworth', 'NE', 'MS', '06/23/2026 09:04 AM', '06/23/2026 09:39 AM', 'Applicant'],
  ['Dwight Ferrara', 'IA', 'MS,STC', '06/22/2026 03:33 PM', '06/23/2026 08:17 AM', 'Quote'],
  ['Estelle Nakamura', 'MO', 'HI', '06/22/2026 01:27 PM', '06/22/2026 02:58 PM', 'Replacement'],
  ['Gerald Winslow', 'IA', 'MS,HI,D', '06/22/2026 11:11 AM', '06/22/2026 12:40 PM', 'Insurance Information'],
  ['Priscilla Vaughn', 'NE', 'D', '06/22/2026 08:52 AM', '06/22/2026 09:26 AM', 'Email'],
  ['Norman Delacroix', 'IA', 'STC,HI', '06/19/2026 04:40 PM', '06/22/2026 08:05 AM', 'Payment'],
  ['Lucille Abernathy', 'MO', 'MS', '06/19/2026 02:14 PM', '06/19/2026 03:49 PM', 'Guaranteed Issue'],
  ['Franklin Ostrander', 'IA', 'MS,D', '06/19/2026 12:03 PM', '06/19/2026 01:35 PM', 'Signature'],
  ['Wanda Castellano', 'NE', 'HI,D', '06/19/2026 10:22 AM', '06/19/2026 11:07 AM', 'Applicant'],
  ['Theodore Blackwood', 'IA', 'MS,STC,D', '06/18/2026 03:18 PM', '06/19/2026 09:50 AM', 'Quote']
].map((r, i) => ({
  id: `sub-${i + 1}`,
  applicant: r[0], state: r[1], products: r[2],
  dateStarted: r[3], lastUpdated: r[4], currentStep: r[5]
}));

const messages = [
  { id: 'msg-1', from: 'Wellabe Agent Services', subject: 'June commission statement is available', preview: 'Your June statement posted this morning and reflects business through 06/24.', date: '06/25/2026 08:02 AM', unread: true },
  { id: 'msg-2', from: 'Product Bulletin', subject: 'Short Term Care rate update effective 07/01', preview: 'New rates load to MyEnroller on July 1. Quotes saved before that date will re-rate.', date: '06/24/2026 04:15 PM', unread: true },
  { id: 'msg-3', from: 'Underwriting', subject: 'Additional information needed — Vandenberg, C.', preview: 'We need a signed replacement form to continue processing this application.', date: '06/24/2026 01:58 PM', unread: true },
  { id: 'msg-4', from: 'Wellabe Marketing', subject: 'AEP materials ship the week of 08/17', preview: 'Order windows open July 6. Reserve your kit quantities before the cutoff.', date: '06/23/2026 11:20 AM', unread: true },
  { id: 'msg-5', from: 'Compliance', subject: 'Annual attestation due 06/30', preview: 'Two attestations remain outstanding on your profile.', date: '06/23/2026 09:05 AM', unread: true },
  { id: 'msg-6', from: 'Wellabe Agent Services', subject: 'New: challenge rewards now post weekly', preview: 'Challenge payouts move from monthly to weekly settlement starting in July.', date: '06/22/2026 02:44 PM', unread: true },
  { id: 'msg-7', from: 'Product Bulletin', subject: 'Dental network expansion in Nebraska', preview: 'Forty-one additional providers joined the Nebraska network this quarter.', date: '06/22/2026 10:31 AM', unread: true },
  { id: 'msg-8', from: 'Underwriting', subject: 'Approved — Hartman, D.', preview: 'Hospital Indemnity issued as applied. Policy packet mails in 1 to 3 business days.', date: '06/19/2026 03:12 PM', unread: true },
  { id: 'msg-9', from: 'Wellabe Agent Services', subject: 'Quarterly incentive standings posted', preview: 'You are currently 4th in the Midwest region for submitted premium.', date: '06/19/2026 08:47 AM', unread: true }
];

/**
 * Incentives. Shaped to the real tab: a chip row, a description card carrying a
 * countdown and the gold "Application progress" bar, and two trophy columns
 * showing the cash reward and the amount redeemed so far. The dates in the
 * qualified table use the product's short form (`Jun 29, 2026`) rather than the
 * long form the submissions table uses — both appear in the screenshots.
 */
const incentives = {
  selectedId: 'inc-ci-chas',
  items: [
    {
      id: 'inc-ci-chas', name: 'Critical Illness: CHAS daily incentive', status: 'active', rewardAvailable: true,
      description: 'Get in gear with Wellabe’s first-ever Instant Incentive opportunity! Today, agents who sell a cancer, heart attack, or stroke policy have the chance to earn $50 per application. Sell 3 policies? Earn $150. Sell 10 policies? Earn $500. Best of all, your earnings are processed instantly and sent directly to your bank account. This incentive is only available until 50 total policies are sold, so start your selling engines!',
      endsAt: '2026-06-25T16:00:00',
      progressPct: 1, progressFraction: '1/1', progressCaption: 'Sell: Critical Illness',
      cashReward: '$50', redeemed: '$50'
    },
    {
      id: 'inc-summer-sale', name: 'Summer Sale', status: 'active', rewardAvailable: false,
      description: 'Earn an additional $50 for every Medicare Supplement policy issued between June 1 and August 31. Qualifying business must be submitted through MyEnroller and issued within 45 days of submission.',
      endsAt: '2026-08-31T23:59:59',
      progressPct: 0.72, progressFraction: '18/25', progressCaption: 'Sell: Medicare Supplement',
      cashReward: '$900', redeemed: '$400'
    },
    {
      id: 'inc-fitness-sale', name: 'Fitness sale', status: 'active', rewardAvailable: false,
      description: 'Write 20 Hospital Indemnity policies in the quarter and earn a flat $750 bonus on top of standard commission.',
      endsAt: '2026-09-30T23:59:59',
      progressPct: 0.75, progressFraction: '15/20', progressCaption: 'Sell: Hospital Indemnity',
      cashReward: '$750', redeemed: '$0'
    },
    {
      id: 'inc-cross-line', name: 'Sell, Sell, Sell', status: 'active', rewardAvailable: true,
      description: 'Any client issued on two or more product lines within 30 days earns a $100 cross-line bonus.',
      endsAt: '2026-12-31T23:59:59',
      progressPct: 0.6, progressFraction: '6/10', progressCaption: 'Sell: two product lines',
      cashReward: '$600', redeemed: '$400'
    },
    {
      id: 'inc-preneed-launch', name: 'Preneed Launch', status: 'ended', rewardAvailable: false,
      description: 'Launch incentive for the Preneed product line. This incentive period has closed.',
      endsAt: '2026-05-31T23:59:59',
      progressPct: 1, progressFraction: '11/11', progressCaption: 'Sell: Preneed',
      cashReward: '$440', redeemed: '$440'
    }
  ],
  qualified: [
    ['Margaret Ellison', 'Critical Illness', 'Jun 24, 2026', '—'],
    ['Raymond Ochoa', 'Critical Illness', 'Jun 22, 2026', 'Jun 24, 2026'],
    ['Yolanda Pierce', 'Medicare Supplement', 'Jun 19, 2026', 'Jun 22, 2026'],
    ['Marlene Foxworth', 'Medicare Supplement', 'Jun 17, 2026', 'Jun 19, 2026'],
    ['Lucille Abernathy', 'Critical Illness', 'Jun 15, 2026', 'Jun 17, 2026'],
    ['Franklin Ostrander', 'Medicare Supplement', 'Jun 11, 2026', 'Jun 15, 2026'],
    ['Gerald Winslow', 'Critical Illness', 'Jun 8, 2026', 'Jun 10, 2026'],
    ['Dwight Ferrara', 'Medicare Supplement', 'Jun 4, 2026', 'Jun 8, 2026']
  ].map((r, i) => ({ id: `qa-${i + 1}`, applicant: r[0], product: r[1], submitted: r[2], redeemed: r[3] }))
};

/** A fresh, deep copy of the seed. Never hand out the module-level object —
 *  the store mutates what it is given. */
export function seedState() {
  return JSON.parse(JSON.stringify({
    version: 1,
    config,
    agent,
    challenges,
    badges,
    schedule,
    history,
    submissions,
    messages,
    incentives,
    ui: { theme: 'dark', activeTab: 'submissions' }
  }));
}
