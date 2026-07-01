import type { Challenge, Completion } from './types'
import { isDateInRange } from '../lib/dates'
import { longestStreak } from './streaks'

/** Sum of the challenge metric for one profile within the challenge window. */
export function challengeProgress(
  challenge: Challenge,
  profileId: string,
  completions: Completion[],
): number {
  const inWindow = completions.filter(
    (c) =>
      c.profileId === profileId &&
      c.status !== 'rejected' &&
      isDateInRange(c.date, challenge.startDate, challenge.endDate),
  )
  switch (challenge.metric) {
    case 'points':
      return inWindow.reduce((sum, c) => sum + c.pointsAwarded, 0)
    case 'completions':
      return inWindow.length
    case 'streak':
      return longestStreak(inWindow)
    default:
      return 0
  }
}

export interface ChallengeStanding {
  profileId: string
  progress: number
  goal: number
  ratio: number
  met: boolean
}

export function challengeStanding(
  challenge: Challenge,
  profileId: string,
  completions: Completion[],
): ChallengeStanding {
  const progress = challengeProgress(challenge, profileId, completions)
  return {
    profileId,
    progress,
    goal: challenge.goal,
    ratio: challenge.goal > 0 ? Math.min(1, progress / challenge.goal) : 0,
    met: progress >= challenge.goal,
  }
}

/** Is the challenge active for a given date? */
export function challengeIsLive(challenge: Challenge, dateStr: string): boolean {
  return (
    challenge.active &&
    isDateInRange(dateStr, challenge.startDate, challenge.endDate)
  )
}
