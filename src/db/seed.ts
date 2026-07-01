import { db, ALL_TABLES } from './db'
import { defaultBadges, defaultSettings } from './defaults'
import type {
  BadgeAward,
  Challenge,
  Chore,
  Completion,
  HolidayPeriod,
  Profile,
  Redemption,
  Reward,
  Routine,
  ScheduleItem,
  Weekday,
} from '../domain/types'
import { uid } from '../lib/id'
import { addDaysStr, toDateStr } from '../lib/dates'
import { DEFAULT_LEVEL_CURVE, levelForXp } from '../domain/gamification'

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5]
const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]
const WEEKEND: Weekday[] = [0, 6]

// Fixed ids so the completion history / redemptions can reference seeded content.
const PARENTS_ID = 'seed-parents'
const HARVEY_ID = 'seed-harvey'
const JAYDEN_ID = 'seed-jayden'

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
function seedProfiles(now: number): Profile[] {
  const curve = DEFAULT_LEVEL_CURVE
  const base = (over: Partial<Profile>): Profile => ({
    id: uid(),
    role: 'child',
    name: '',
    avatar: '🙂',
    color: '#4f46e5',
    pinHash: null,
    pinSalt: null,
    points: 0,
    xp: 0,
    level: 1,
    gameModeOptIn: false,
    sortOrder: 0,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...over,
  })

  return [
    base({
      id: PARENTS_ID,
      role: 'parent',
      name: 'Mom & Dad',
      avatar: '👨‍👩‍👧‍👦',
      color: '#4f46e5',
      sortOrder: 0,
      gameModeOptIn: true,
      points: 60,
      xp: 90,
      level: levelForXp(90, curve),
    }),
    base({
      id: HARVEY_ID,
      role: 'child',
      name: 'Harvey',
      avatar: '🦖',
      color: '#f97316',
      sortOrder: 1,
      points: 240,
      xp: 610,
      level: levelForXp(610, curve),
    }),
    base({
      id: JAYDEN_ID,
      role: 'child',
      name: 'Jayden',
      avatar: '🐢',
      color: '#0ea5e9',
      sortOrder: 2,
      points: 75,
      xp: 160,
      level: levelForXp(160, curve),
    }),
  ]
}

// ---------------------------------------------------------------------------
// Routines (age-appropriate, per child)
// ---------------------------------------------------------------------------
function mkRoutine(
  now: number,
  id: string,
  name: string,
  icon: string,
  anchorTime: string,
  assigned: string[],
  steps: { title: string; icon: string }[],
): Routine {
  return {
    id,
    name,
    icon,
    anchorTime,
    daysOfWeek: ALL_DAYS,
    schoolMode: true,
    holidayMode: true,
    assignedProfileIds: assigned,
    steps: steps.map((s, i) => ({ id: uid(), order: i, title: s.title, icon: s.icon })),
    active: true,
    createdAt: now,
    updatedAt: now,
  }
}

function seedRoutines(now: number): Routine[] {
  return [
    // Harvey (9) — fuller routines
    mkRoutine(now, 'rt-h-morning', 'Harvey · Morning', '🌅', '07:00', [HARVEY_ID], [
      { title: 'Wake up & make bed', icon: '🛏️' },
      { title: 'Get dressed', icon: '👕' },
      { title: 'Eat breakfast', icon: '🥣' },
      { title: 'Brush teeth', icon: '🪥' },
      { title: 'Pack bag for the day', icon: '🎒' },
    ]),
    mkRoutine(now, 'rt-h-bedtime', 'Harvey · Bedtime', '20:00', '20:00', [HARVEY_ID], [
      { title: 'Tidy room', icon: '🧹' },
      { title: 'Shower', icon: '🚿' },
      { title: 'Pajamas on', icon: '🩳' },
      { title: 'Brush teeth', icon: '🪥' },
      { title: 'Read for 15 minutes', icon: '📖' },
      { title: 'Lights out', icon: '💡' },
    ]),
    // Jayden (5.5) — simpler, with grown-up help
    mkRoutine(now, 'rt-j-morning', 'Jayden · Morning', '☀️', '07:15', [JAYDEN_ID], [
      { title: 'Wake up & potty', icon: '🚽' },
      { title: 'Get dressed (with help)', icon: '👕' },
      { title: 'Eat breakfast', icon: '🥣' },
      { title: 'Brush teeth', icon: '🪥' },
    ]),
    mkRoutine(now, 'rt-j-bedtime', 'Jayden · Bedtime', '🌙', '19:00', [JAYDEN_ID], [
      { title: 'Bath time', icon: '🛁' },
      { title: 'Pajamas on', icon: '🩳' },
      { title: 'Brush teeth (with help)', icon: '🪥' },
      { title: 'Story time', icon: '📚' },
      { title: 'Cuddle & lights out', icon: '🧸' },
    ]),
  ]
}

// ---------------------------------------------------------------------------
// Chores (assigned per person, age-appropriate)
// ---------------------------------------------------------------------------
function mkChore(
  now: number,
  id: string,
  title: string,
  icon: string,
  cadence: Chore['cadence'],
  days: Weekday[],
  points: number,
  assigned: string[],
  requiresApproval = false,
): Chore {
  return {
    id,
    title,
    icon,
    cadence,
    daysOfWeek: days,
    assignedProfileIds: assigned,
    points,
    requiresApproval,
    schoolMode: true,
    holidayMode: true,
    active: true,
    createdAt: now,
    updatedAt: now,
  }
}

function seedChores(now: number): Chore[] {
  return [
    // Harvey (9)
    mkChore(now, 'ch-h-dog', 'Feed the dog', '🐶', 'daily', ALL_DAYS, 10, [HARVEY_ID]),
    mkChore(now, 'ch-h-table', 'Set the table', '🍽️', 'daily', ALL_DAYS, 8, [HARVEY_ID]),
    mkChore(now, 'ch-h-tidy', 'Tidy my bedroom', '🧹', 'daily', ALL_DAYS, 10, [HARVEY_ID]),
    mkChore(now, 'ch-h-recycle', 'Take out recycling', '♻️', 'weekly', [1], 15, [HARVEY_ID]),
    mkChore(now, 'ch-h-dishwasher', 'Empty the dishwasher', '🍽️', 'weekly', [4], 20, [HARVEY_ID], true),
    // Jayden (5.5) — simpler, fewer, lower points
    mkChore(now, 'ch-j-toys', 'Put toys away', '🧸', 'daily', ALL_DAYS, 5, [JAYDEN_ID]),
    mkChore(now, 'ch-j-hamper', 'Clothes in the hamper', '🧺', 'daily', ALL_DAYS, 5, [JAYDEN_ID]),
    mkChore(now, 'ch-j-fish', 'Feed the fish', '🐟', 'daily', ALL_DAYS, 5, [JAYDEN_ID]),
    mkChore(now, 'ch-j-wipe', 'Wipe the table', '🧽', 'weekly', [6], 8, [JAYDEN_ID]),
    // Mom & Dad (parent game mode)
    mkChore(now, 'ch-p-walk', 'Family dog walk', '🐕', 'daily', ALL_DAYS, 10, [PARENTS_ID]),
    mkChore(now, 'ch-p-meal', 'Plan the meals', '📝', 'weekly', [0], 15, [PARENTS_ID]),
    mkChore(now, 'ch-p-grocery', 'Grocery shop', '🛒', 'weekly', [6], 15, [PARENTS_ID]),
  ]
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------
function mkSchedule(
  now: number,
  title: string,
  type: ScheduleItem['type'],
  icon: string,
  startTime: string,
  endTime: string,
  days: Weekday[],
  assigned: string[],
  school: boolean,
  holiday: boolean,
): ScheduleItem {
  return {
    id: uid(),
    title,
    type,
    icon,
    startTime,
    endTime,
    daysOfWeek: days,
    assignedProfileIds: assigned,
    schoolMode: school,
    holidayMode: holiday,
    active: true,
    createdAt: now,
    updatedAt: now,
  }
}

function seedSchedule(now: number): ScheduleItem[] {
  const kids = [HARVEY_ID, JAYDEN_ID]
  return [
    // School-time only
    mkSchedule(now, 'School', 'activity', '🏫', '08:30', '15:00', WEEKDAYS, kids, true, false),
    mkSchedule(now, 'Homework', 'activity', '✏️', '16:00', '16:45', WEEKDAYS, [HARVEY_ID], true, false),
    // Both modes
    mkSchedule(now, 'Dinner', 'meal', '🍝', '18:00', '18:30', ALL_DAYS, kids, true, true),
    // Summer / holiday friendly
    mkSchedule(now, 'Swim lesson', 'activity', '🏊', '10:00', '11:00', [2, 4], kids, false, true),
    mkSchedule(now, 'Library visit', 'activity', '📚', '14:00', '15:00', [3], kids, false, true),
    mkSchedule(now, 'Park playdate', 'activity', '⚽', '15:30', '16:30', WEEKEND, kids, true, true),
    mkSchedule(now, 'Family movie', 'activity', '🍿', '19:15', '20:45', [5], kids, true, true),
  ]
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------
function mkReward(
  now: number,
  id: string,
  title: string,
  icon: string,
  cost: number,
  description?: string,
): Reward {
  return {
    id,
    title,
    icon,
    cost,
    description,
    stock: null,
    active: true,
    createdAt: now,
    updatedAt: now,
  }
}

function seedRewards(now: number): Reward[] {
  return [
    mkReward(now, 'rw-screen', '30 min screen time', '📱', 50, 'Extra tablet or TV time'),
    mkReward(now, 'rw-dinner', 'Pick dinner', '🍕', 80, 'Choose what the family eats'),
    mkReward(now, 'rw-late', 'Stay up 30 min late', '⏰', 100),
    mkReward(now, 'rw-icecream', 'Ice cream trip', '🍦', 150),
    mkReward(now, 'rw-movie', 'Movie night pick', '🎬', 120, 'Choose the family movie'),
    mkReward(now, 'rw-money', '$5 pocket money', '💵', 200),
  ]
}

// ---------------------------------------------------------------------------
// Challenges / quests
// ---------------------------------------------------------------------------
function seedChallenges(now: number): Challenge[] {
  const today = toDateStr(new Date(now))
  const participants = [HARVEY_ID, JAYDEN_ID, PARENTS_ID]
  return [
    {
      id: 'chal-superstar',
      title: 'Summer Superstar',
      description: 'Finish 30 tasks this fortnight to win the bonus!',
      icon: '🌟',
      startDate: addDaysStr(today, -6),
      endDate: addDaysStr(today, 8),
      metric: 'completions',
      goal: 30,
      bonusPoints: 100,
      badgeId: 'badge-challenge-1',
      participantProfileIds: participants,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'chal-points',
      title: 'Point Champion',
      description: 'Earn 400 points before the challenge ends.',
      icon: '🏆',
      startDate: addDaysStr(today, -6),
      endDate: addDaysStr(today, 8),
      metric: 'points',
      goal: 400,
      bonusPoints: 150,
      participantProfileIds: [HARVEY_ID, JAYDEN_ID],
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'chal-june',
      title: 'June Sprint',
      description: 'Our last challenge — great effort everyone!',
      icon: '🏁',
      startDate: addDaysStr(today, -40),
      endDate: addDaysStr(today, -12),
      metric: 'completions',
      goal: 20,
      bonusPoints: 80,
      participantProfileIds: [HARVEY_ID, JAYDEN_ID],
      active: false,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

// ---------------------------------------------------------------------------
// History: completions, badges, redemptions
// ---------------------------------------------------------------------------
function seedHistory(now: number): {
  completions: Completion[]
  badgeAwards: BadgeAward[]
  redemptions: Redemption[]
} {
  const today = toDateStr(new Date(now))
  const day = 86_400_000
  const completions: Completion[] = []

  const add = (
    profileId: string,
    sourceType: Completion['sourceType'],
    sourceId: string,
    daysAgo: number,
    points: number,
    status: Completion['status'] = 'done',
    label?: string,
  ) => {
    completions.push({
      id: uid(),
      profileId,
      sourceType,
      sourceId,
      date: addDaysStr(today, -daysAgo),
      completedAt: now - daysAgo * day,
      pointsAwarded: points,
      xpAwarded: points,
      status,
      onTime: true,
      label,
    })
  }

  // Harvey — 6-day streak (days 0..5)
  for (let d = 0; d <= 5; d++) {
    add(HARVEY_ID, 'routine', 'rt-h-morning', d, 15)
    add(HARVEY_ID, 'chore', 'ch-h-dog', d, 10)
    add(HARVEY_ID, 'chore', 'ch-h-table', d, 8)
    if (d % 2 === 0) add(HARVEY_ID, 'routine', 'rt-h-bedtime', d, 18)
    if (d <= 4) add(HARVEY_ID, 'reading', `reading:${addDaysStr(today, -d)}:0`, d, 15)
  }
  // A chore waiting for a grown-up to approve (populates Approvals)
  add(HARVEY_ID, 'chore', 'ch-h-dishwasher', 0, 20, 'pending-approval', 'Empty the dishwasher')

  // Jayden — 3-day streak (days 0..2)
  for (let d = 0; d <= 2; d++) {
    add(JAYDEN_ID, 'routine', 'rt-j-morning', d, 10)
    add(JAYDEN_ID, 'chore', 'ch-j-toys', d, 5)
    add(JAYDEN_ID, 'chore', 'ch-j-fish', d, 5)
  }
  add(JAYDEN_ID, 'routine', 'rt-j-bedtime', 0, 10)
  add(JAYDEN_ID, 'reading', `reading:${today}:0`, 0, 15)

  // Mom & Dad — a little parent-game-mode activity
  add(PARENTS_ID, 'chore', 'ch-p-walk', 0, 10)
  add(PARENTS_ID, 'chore', 'ch-p-walk', 1, 10)
  add(PARENTS_ID, 'chore', 'ch-p-meal', 2, 15)

  const badge = (profileId: string, badgeId: string): BadgeAward => ({
    id: uid(),
    profileId,
    badgeId,
    awardedAt: now,
  })
  const badgeAwards: BadgeAward[] = [
    badge(HARVEY_ID, 'badge-first-step'),
    badge(HARVEY_ID, 'badge-ten-done'),
    badge(HARVEY_ID, 'badge-streak-3'),
    badge(JAYDEN_ID, 'badge-first-step'),
    badge(JAYDEN_ID, 'badge-streak-3'),
    badge(PARENTS_ID, 'badge-first-step'),
  ]

  const redemptions: Redemption[] = [
    {
      id: uid(),
      profileId: HARVEY_ID,
      rewardId: 'rw-movie',
      rewardTitle: 'Movie night pick',
      cost: 120,
      status: 'approved',
      requestedAt: now - 3 * day,
      resolvedAt: now - 3 * day,
      resolvedByProfileId: PARENTS_ID,
    },
    {
      id: uid(),
      profileId: HARVEY_ID,
      rewardId: 'rw-icecream',
      rewardTitle: 'Ice cream trip',
      cost: 150,
      status: 'pending',
      requestedAt: now - 2 * 3_600_000,
    },
    {
      id: uid(),
      profileId: JAYDEN_ID,
      rewardId: 'rw-screen',
      rewardTitle: '30 min screen time',
      cost: 50,
      status: 'approved',
      requestedAt: now - 1 * day,
      resolvedAt: now - 1 * day,
      resolvedByProfileId: PARENTS_ID,
    },
  ]

  return { completions, badgeAwards, redemptions }
}

// ---------------------------------------------------------------------------
// Holiday period — it's summer, so make holiday mode live by default
// ---------------------------------------------------------------------------
function seedHolidayPeriods(now: number): HolidayPeriod[] {
  const today = toDateStr(new Date(now))
  return [
    {
      id: 'hol-summer',
      name: 'Summer Break',
      startDate: addDaysStr(today, -20),
      endDate: addDaysStr(today, 45),
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

/** Build the entire starter dataset. */
export function buildSeed(now: number) {
  const history = seedHistory(now)
  return {
    profiles: seedProfiles(now),
    settings: [{ ...defaultSettings(now), parentGameMode: true }],
    holidayPeriods: seedHolidayPeriods(now),
    routines: seedRoutines(now),
    chores: seedChores(now),
    scheduleItems: seedSchedule(now),
    rewards: seedRewards(now),
    redemptions: history.redemptions,
    badges: defaultBadges(),
    badgeAwards: history.badgeAwards,
    challenges: seedChallenges(now),
    completions: history.completions,
  }
}

/** Wipe everything and load the starter dataset. */
export async function resetToSeed(now: number = Date.now()): Promise<void> {
  const seed = buildSeed(now)
  await db.transaction('rw', db.tables, async () => {
    for (const name of ALL_TABLES) {
      await db.table(name).clear()
      const rows = (seed as Record<string, unknown[]>)[name]
      if (rows && rows.length) await db.table(name).bulkPut(rows)
    }
  })
}

/** Seed on first run only (when there are no profiles yet). */
export async function ensureSeeded(now: number = Date.now()): Promise<void> {
  const count = await db.profiles.count()
  if (count === 0) await resetToSeed(now)
}
