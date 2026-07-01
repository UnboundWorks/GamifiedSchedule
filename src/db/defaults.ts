import type { Badge, LevelCurve, PointValues, Settings } from '../domain/types'
import { DEFAULT_LEVEL_CURVE } from '../domain/gamification'
import { SCHEMA_VERSION, SETTINGS_ID } from './db'

export const DEFAULT_POINT_VALUES: PointValues = {
  perChore: 10,
  perRoutineStep: 2,
  routineCompletionBonus: 5,
  perScheduleItem: 5,
  onTimeBonus: 3,
  streakDailyBonus: 5,
}

export const DEFAULT_LEVEL: LevelCurve = DEFAULT_LEVEL_CURVE

export function defaultSettings(now: number): Settings {
  return {
    id: SETTINGS_ID,
    holidayModeOverride: 'auto',
    parentGameMode: false,
    weekStartsOn: 0,
    levelCurve: { ...DEFAULT_LEVEL },
    points: { ...DEFAULT_POINT_VALUES },
    holidayConfig: {
      reading: {
        daysOfWeek: [1, 2, 3, 4, 5],
        sessionsPerDay: 1,
        durationMin: 20,
        anchorTime: '10:00',
        points: 15,
      },
      math: {
        daysOfWeek: [1, 3, 5],
        sessionsPerDay: 1,
        durationMin: 20,
        anchorTime: '11:00',
        points: 15,
      },
    },
    requireRedemptionApproval: true,
    pinRequiredForChild: true,
    theme: 'system',
    autoLockMinutes: 5,
    schemaVersion: SCHEMA_VERSION,
    updatedAt: now,
  }
}

/** Starter badge definitions shipped with every install. */
export function defaultBadges(): Badge[] {
  return [
    {
      id: 'badge-first-step',
      name: 'Getting Started',
      description: 'Complete your very first task.',
      icon: '🌱',
      criteria: { type: 'totalCompletions', threshold: 1 },
    },
    {
      id: 'badge-ten-done',
      name: 'On a Roll',
      description: 'Complete 10 tasks.',
      icon: '🎯',
      criteria: { type: 'totalCompletions', threshold: 10 },
    },
    {
      id: 'badge-fifty-done',
      name: 'Task Master',
      description: 'Complete 50 tasks.',
      icon: '🏆',
      criteria: { type: 'totalCompletions', threshold: 50 },
    },
    {
      id: 'badge-streak-3',
      name: 'Warming Up',
      description: 'Keep a 3-day streak.',
      icon: '🔥',
      criteria: { type: 'streak', threshold: 3 },
    },
    {
      id: 'badge-streak-7',
      name: 'Week Warrior',
      description: 'Keep a 7-day streak.',
      icon: '⚡',
      criteria: { type: 'streak', threshold: 7 },
    },
    {
      id: 'badge-level-5',
      name: 'Rising Star',
      description: 'Reach level 5.',
      icon: '⭐',
      criteria: { type: 'level', threshold: 5 },
    },
    {
      id: 'badge-challenge-1',
      name: 'Challenger',
      description: 'Complete your first challenge.',
      icon: '🥇',
      criteria: { type: 'challengesCompleted', threshold: 1 },
    },
  ]
}
