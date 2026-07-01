import { db } from '../db/db'
import type { Challenge, Profile } from '../domain/types'
import { challengeStanding } from '../domain/challenges'
import { levelForXp } from '../domain/gamification'
import { getSettings } from './settings.repo'
import { uid } from '../lib/id'

const CHALLENGER_BADGE_ID = 'badge-challenge-1'

export interface CloseResult {
  winners: { profileId: string; bonus: number }[]
}

/**
 * Close a challenge: award bonus points (and any badges) to every participant
 * who met the goal, then deactivate it. Idempotent-ish — closing an already
 * inactive challenge does nothing.
 */
export async function closeChallenge(
  challengeId: string,
  now: number = Date.now(),
): Promise<CloseResult> {
  const settings = await getSettings()
  return db.transaction(
    'rw',
    db.challenges,
    db.profiles,
    db.completions,
    db.badges,
    db.badgeAwards,
    async () => {
      const challenge = await db.challenges.get(challengeId)
      if (!challenge || !challenge.active) return { winners: [] }

      const badgeExists = (await db.badges.get(CHALLENGER_BADGE_ID)) != null
      const winners: { profileId: string; bonus: number }[] = []

      for (const profileId of challenge.participantProfileIds) {
        const completions = await db.completions
          .where('profileId')
          .equals(profileId)
          .toArray()
        const standing = challengeStanding(challenge, profileId, completions)
        if (!standing.met) continue

        const p = await db.profiles.get(profileId)
        if (!p) continue
        const newXp = p.xp + challenge.bonusPoints
        await db.profiles.update(profileId, {
          points: p.points + challenge.bonusPoints,
          xp: newXp,
          level: levelForXp(newXp, settings.levelCurve),
          updatedAt: now,
        })
        winners.push({ profileId, bonus: challenge.bonusPoints })

        // Award the optional custom badge + the built-in challenger badge.
        await grantBadge(profileId, challenge.badgeId, now)
        if (badgeExists) await grantBadge(profileId, CHALLENGER_BADGE_ID, now)
      }

      await db.challenges.update(challengeId, { active: false, updatedAt: now })
      return { winners }
    },
  )
}

async function grantBadge(
  profileId: string,
  badgeId: string | undefined,
  now: number,
): Promise<void> {
  if (!badgeId) return
  const existing = await db.badgeAwards
    .where('[profileId+badgeId]')
    .equals([profileId, badgeId])
    .first()
  if (existing) return
  await db.badgeAwards.put({ id: uid(), profileId, badgeId, awardedAt: now })
}

export function participantsFor(
  challenge: Challenge,
  profiles: Profile[],
): Profile[] {
  return profiles.filter((p) => challenge.participantProfileIds.includes(p.id))
}
