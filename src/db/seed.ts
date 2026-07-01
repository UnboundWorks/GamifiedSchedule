import { db, ALL_TABLES } from './db'
import { defaultBadges, defaultSettings } from './defaults'
import type {
  Chore,
  Profile,
  Reward,
  Routine,
  ScheduleItem,
  Weekday,
} from '../domain/types'
import { uid } from '../lib/id'

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5]
const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]
const WEEKEND: Weekday[] = [0, 6]

// Fixed IDs for seeded profiles so sample routines/chores can reference them.
const PARENTS_ID = 'seed-parents'
const KID1_ID = 'seed-kid-1'
const KID2_ID = 'seed-kid-2'

function baseProfile(now: number): Omit<Profile, 'id' | 'role' | 'name' | 'avatar' | 'color' | 'sortOrder'> {
  return {
    pinHash: null,
    pinSalt: null,
    points: 0,
    xp: 0,
    level: 1,
    gameModeOptIn: false,
    active: true,
    createdAt: now,
    updatedAt: now,
  }
}

function seedProfiles(now: number): Profile[] {
  return [
    {
      id: PARENTS_ID,
      role: 'parent',
      name: 'Parents',
      avatar: '👪',
      color: '#4f46e5',
      sortOrder: 0,
      ...baseProfile(now),
    },
    {
      id: KID1_ID,
      role: 'child',
      name: 'Alex',
      avatar: '🦊',
      color: '#f97316',
      sortOrder: 1,
      ...baseProfile(now),
    },
    {
      id: KID2_ID,
      role: 'child',
      name: 'Sam',
      avatar: '🐼',
      color: '#0ea5e9',
      sortOrder: 2,
      ...baseProfile(now),
    },
  ]
}

function seedRoutines(now: number): Routine[] {
  const kids = [KID1_ID, KID2_ID]
  const mk = (
    name: string,
    icon: string,
    anchorTime: string,
    steps: { title: string; icon: string }[],
    days: Weekday[],
  ): Routine => ({
    id: uid(),
    name,
    icon,
    anchorTime,
    daysOfWeek: days,
    schoolMode: true,
    holidayMode: true,
    assignedProfileIds: kids,
    steps: steps.map((s, i) => ({
      id: uid(),
      order: i,
      title: s.title,
      icon: s.icon,
    })),
    active: true,
    createdAt: now,
    updatedAt: now,
  })

  return [
    mk(
      'Morning Routine',
      '🌅',
      '07:00',
      [
        { title: 'Wake up & make bed', icon: '🛏️' },
        { title: 'Brush teeth', icon: '🪥' },
        { title: 'Get dressed', icon: '👕' },
        { title: 'Eat breakfast', icon: '🥣' },
        { title: 'Pack bag', icon: '🎒' },
      ],
      ALL_DAYS,
    ),
    mk(
      'Bedtime Routine',
      '🌙',
      '19:30',
      [
        { title: 'Tidy up toys', icon: '🧸' },
        { title: 'Bath / shower', icon: '🛁' },
        { title: 'Pajamas on', icon: '🩳' },
        { title: 'Brush teeth', icon: '🪥' },
        { title: 'Read a book', icon: '📖' },
        { title: 'Lights out', icon: '💡' },
      ],
      ALL_DAYS,
    ),
  ]
}

function seedChores(now: number): Chore[] {
  const kids = [KID1_ID, KID2_ID]
  const mk = (
    title: string,
    icon: string,
    cadence: Chore['cadence'],
    days: Weekday[],
    points: number,
    assigned: string[],
    requiresApproval = false,
  ): Chore => ({
    id: uid(),
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
  })

  return [
    mk('Feed the pet', '🐶', 'daily', ALL_DAYS, 10, kids),
    mk('Clear the table', '🍽️', 'daily', ALL_DAYS, 8, kids),
    mk('Tidy bedroom', '🧹', 'daily', WEEKDAYS, 10, kids),
    mk('Take out trash', '🗑️', 'weekly', [1], 15, [KID1_ID]),
    mk('Water the plants', '🪴', 'weekly', [3], 12, [KID2_ID]),
    mk('Vacuum living room', '🧼', 'weekly', [6], 20, kids, true),
    // A parent chore (parents can complete when parent game mode is on).
    mk('Meal planning', '📝', 'weekly', [0], 15, [PARENTS_ID]),
  ]
}

function seedSchedule(now: number): ScheduleItem[] {
  const kids = [KID1_ID, KID2_ID]
  const mk = (
    title: string,
    type: ScheduleItem['type'],
    icon: string,
    startTime: string,
    endTime: string,
    days: Weekday[],
    school: boolean,
    holiday: boolean,
  ): ScheduleItem => ({
    id: uid(),
    title,
    type,
    icon,
    startTime,
    endTime,
    daysOfWeek: days,
    assignedProfileIds: kids,
    schoolMode: school,
    holidayMode: holiday,
    active: true,
    createdAt: now,
    updatedAt: now,
  })

  return [
    mk('School', 'activity', '🏫', '08:30', '15:00', WEEKDAYS, true, false),
    mk('Homework', 'activity', '✏️', '16:00', '16:45', WEEKDAYS, true, false),
    mk('Dinner', 'meal', '🍝', '18:00', '18:30', ALL_DAYS, true, true),
    mk('Outdoor play', 'activity', '⚽', '15:30', '16:30', WEEKEND, true, true),
    mk('Family movie', 'activity', '🍿', '19:00', '20:30', [5], true, true),
  ]
}

function seedRewards(now: number): Reward[] {
  const mk = (
    title: string,
    icon: string,
    cost: number,
    description?: string,
  ): Reward => ({
    id: uid(),
    title,
    icon,
    cost,
    description,
    stock: null,
    active: true,
    createdAt: now,
    updatedAt: now,
  })

  return [
    mk('30 min screen time', '📱', 50, 'Extra tablet or TV time'),
    mk('Pick dinner', '🍕', 80, 'Choose what the family eats'),
    mk('Stay up 30 min late', '⏰', 100),
    mk('Ice cream trip', '🍦', 150),
    mk('$5 pocket money', '💵', 200),
    mk('Movie night pick', '🎬', 120, 'Choose the family movie'),
  ]
}

/** Build the entire starter dataset. */
export function buildSeed(now: number) {
  return {
    profiles: seedProfiles(now),
    settings: [defaultSettings(now)],
    holidayPeriods: [],
    routines: seedRoutines(now),
    chores: seedChores(now),
    scheduleItems: seedSchedule(now),
    rewards: seedRewards(now),
    redemptions: [],
    badges: defaultBadges(),
    badgeAwards: [],
    challenges: [],
    completions: [],
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
