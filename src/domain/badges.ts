import type { Badge, Completion, Profile } from './types'
import { currentStreak, longestStreak } from './streaks'

export interface BadgeEvalContext {
  profile: Profile
  completions: Completion[] // this profile's completions
  challengesCompleted: number
  today: string
}

/** Count of non-rejected completions for the profile. */
function totalCompletions(completions: Completion[]): number {
  return completions.filter((c) => c.status !== 'rejected').length
}

/** Whether a single badge's criteria is currently met. */
export function isBadgeEarned(badge: Badge, ctx: BadgeEvalContext): boolean {
  const { criteria } = badge
  switch (criteria.type) {
    case 'streak': {
      const best = Math.max(
        currentStreak(ctx.completions, ctx.today),
        longestStreak(ctx.completions),
      )
      return best >= criteria.threshold
    }
    case 'totalCompletions':
      return totalCompletions(ctx.completions) >= criteria.threshold
    case 'level':
      return ctx.profile.level >= criteria.threshold
    case 'challengesCompleted':
      return ctx.challengesCompleted >= criteria.threshold
    default:
      return false
  }
}

/**
 * Given all badge definitions and the set of badgeIds already earned, return
 * the badges newly earned in this evaluation (idempotent — never re-awards).
 */
export function newlyEarnedBadges(
  badges: Badge[],
  earnedBadgeIds: Set<string>,
  ctx: BadgeEvalContext,
): Badge[] {
  return badges.filter(
    (b) => !earnedBadgeIds.has(b.id) && isBadgeEarned(b, ctx),
  )
}
