import Dexie, { type Table } from 'dexie'
import type {
  Badge,
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
  Settings,
} from '../domain/types'

export const SETTINGS_ID = 'app'
export const SCHEMA_VERSION = 1

export class AppDatabase extends Dexie {
  profiles!: Table<Profile, string>
  settings!: Table<Settings, string>
  holidayPeriods!: Table<HolidayPeriod, string>
  routines!: Table<Routine, string>
  chores!: Table<Chore, string>
  scheduleItems!: Table<ScheduleItem, string>
  rewards!: Table<Reward, string>
  redemptions!: Table<Redemption, string>
  badges!: Table<Badge, string>
  badgeAwards!: Table<BadgeAward, string>
  challenges!: Table<Challenge, string>
  completions!: Table<Completion, string>

  constructor() {
    super('gamified-schedule')
    this.version(1).stores({
      profiles: 'id, role, active, sortOrder',
      settings: 'id',
      holidayPeriods: 'id, active, startDate, endDate',
      routines: 'id, active',
      chores: 'id, cadence, active',
      scheduleItems: 'id, type, active',
      rewards: 'id, active',
      redemptions: 'id, profileId, status, requestedAt',
      badges: 'id',
      badgeAwards: 'id, profileId, badgeId, awardedAt, [profileId+badgeId]',
      challenges: 'id, active, startDate, endDate',
      completions:
        'id, profileId, date, sourceType, sourceId, status, [profileId+date]',
    })
  }
}

export const db = new AppDatabase()

/** All Dexie tables in a stable order — used by export/import. */
export const ALL_TABLES = [
  'profiles',
  'settings',
  'holidayPeriods',
  'routines',
  'chores',
  'scheduleItems',
  'rewards',
  'redemptions',
  'badges',
  'badgeAwards',
  'challenges',
  'completions',
] as const

export type TableName = (typeof ALL_TABLES)[number]
