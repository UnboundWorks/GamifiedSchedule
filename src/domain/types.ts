// Core domain types for GamifiedSchedule.
// These are shared across the DB layer, repositories, domain logic and UI.

export type Role = 'parent' | 'child'

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = Sunday .. 6 = Saturday

/** Which schedule context an item applies to. An item can apply to both. */
export interface ModeApplicability {
  schoolMode: boolean // applies on school days (holiday OFF)
  holidayMode: boolean // applies on holiday days (holiday ON)
}

export interface Profile {
  id: string
  role: Role
  name: string
  avatar: string // emoji or preset key
  color: string // hex/tailwind-ish accent
  pinHash: string | null // salted hash; null = no PIN required
  pinSalt: string | null
  points: number // spendable currency
  xp: number // lifetime XP -> drives level
  level: number // cached, derived from xp
  gameModeOptIn: boolean // parents only: join points economy / challenges
  sortOrder: number
  active: boolean
  createdAt: number
  updatedAt: number
}

export interface RoutineStep {
  id: string
  order: number
  title: string
  icon?: string
  estMinutes?: number
  points?: number // optional per-step override
}

export interface Routine extends ModeApplicability {
  id: string
  name: string
  icon: string
  anchorTime: string // "HH:MM"
  daysOfWeek: Weekday[]
  assignedProfileIds: string[]
  steps: RoutineStep[]
  active: boolean
  createdAt: number
  updatedAt: number
}

export type ChoreCadence = 'daily' | 'weekly'

export interface Chore extends ModeApplicability {
  id: string
  title: string
  description?: string
  icon: string
  cadence: ChoreCadence
  daysOfWeek: Weekday[] // daily: which days it recurs; weekly: due day(s)
  assignedProfileIds: string[]
  points: number
  requiresApproval: boolean
  active: boolean
  createdAt: number
  updatedAt: number
}

export type ScheduleItemType = 'event' | 'meal' | 'reading' | 'math' | 'activity'

export interface ScheduleItem extends ModeApplicability {
  id: string
  title: string
  type: ScheduleItemType
  icon: string
  startTime: string // "HH:MM"
  endTime?: string
  daysOfWeek: Weekday[]
  assignedProfileIds: string[]
  active: boolean
  createdAt: number
  updatedAt: number
}

export interface Reward {
  id: string
  title: string
  description?: string
  icon: string
  cost: number // points
  stock: number | null // null = unlimited
  active: boolean
  createdAt: number
  updatedAt: number
}

export type RedemptionStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled'

export interface Redemption {
  id: string
  profileId: string
  rewardId: string
  rewardTitle: string // snapshot
  cost: number // snapshot
  status: RedemptionStatus
  requestedAt: number
  resolvedAt?: number
  resolvedByProfileId?: string
}

export type BadgeCriteriaType =
  | 'streak'
  | 'totalCompletions'
  | 'level'
  | 'challengesCompleted'

export interface BadgeCriteria {
  type: BadgeCriteriaType
  threshold: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  criteria: BadgeCriteria
}

export interface BadgeAward {
  id: string
  profileId: string
  badgeId: string
  awardedAt: number
}

export type ChallengeMetric = 'points' | 'completions' | 'streak'

export interface Challenge {
  id: string
  title: string
  description?: string
  icon: string
  startDate: string // "YYYY-MM-DD"
  endDate: string // "YYYY-MM-DD"
  metric: ChallengeMetric
  goal: number // threshold to meet within the window
  bonusPoints: number
  badgeId?: string // optional badge awarded on completion
  participantProfileIds: string[]
  active: boolean
  createdAt: number
  updatedAt: number
}

export type CompletionSourceType =
  | 'chore'
  | 'routine'
  | 'routineStep'
  | 'reading'
  | 'math'
  | 'event'
  | 'activity'
  | 'meal'

export type CompletionStatus =
  | 'done'
  | 'pending-approval'
  | 'approved'
  | 'rejected'

export interface Completion {
  id: string
  profileId: string
  sourceType: CompletionSourceType
  sourceId: string
  date: string // "YYYY-MM-DD" instance date
  completedAt: number
  pointsAwarded: number
  xpAwarded: number
  status: CompletionStatus
  onTime?: boolean
  label?: string // human label snapshot (for approvals list)
}

export interface HolidayPeriod {
  id: string
  name: string
  startDate: string // "YYYY-MM-DD"
  endDate: string // inclusive "YYYY-MM-DD"
  active: boolean
  createdAt: number
  updatedAt: number
}

export type HolidayOverride = 'auto' | 'on' | 'off'
export type ThemePref = 'light' | 'dark' | 'system'

export interface PointValues {
  perChore: number
  perRoutineStep: number
  routineCompletionBonus: number
  perScheduleItem: number
  onTimeBonus: number
  streakDailyBonus: number
}

export interface LevelCurve {
  base: number
  factor: number
}

export interface HolidayWorkConfig {
  daysOfWeek: Weekday[]
  sessionsPerDay: number
  durationMin: number
  anchorTime: string // "HH:MM"
  points: number
}

export interface Settings {
  id: 'app'
  holidayModeOverride: HolidayOverride
  parentGameMode: boolean
  weekStartsOn: 0 | 1
  levelCurve: LevelCurve
  points: PointValues
  holidayConfig: {
    reading: HolidayWorkConfig
    math: HolidayWorkConfig
  }
  requireRedemptionApproval: boolean
  pinRequiredForChild: boolean
  theme: ThemePref
  autoLockMinutes: number
  schemaVersion: number
  updatedAt: number
}

/** A materialized "instance" of a recurring definition for a given day. */
export interface TaskInstance {
  key: string // stable per (sourceType, sourceId, profileId, date)
  profileId: string
  sourceType: CompletionSourceType
  sourceId: string
  date: string
  title: string
  icon: string
  time?: string // anchor / start time "HH:MM"
  points: number
  category: 'routine' | 'chore' | 'schedule' | 'work'
  requiresApproval: boolean
  // per-instance state resolved from the completion log:
  completion?: Completion
  // routine-specific:
  steps?: RoutineStep[]
}
