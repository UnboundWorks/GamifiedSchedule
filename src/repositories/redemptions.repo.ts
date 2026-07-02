import { db } from '../db/db'
import type { Redemption } from '../domain/types'
import { uid } from '../lib/id'
import { levelForXp } from '../domain/gamification'
import { getSettings } from './settings.repo'

export interface RedeemResult {
  ok: boolean
  reason?: string
  redemption?: Redemption
}

/**
 * Redeem a reward for a profile. Deducts points immediately (so they can't be
 * double-spent). If approval is required the redemption is 'pending' but points
 * are already held; rejecting refunds them. Runs in a transaction.
 */
export async function redeemReward(
  profileId: string,
  rewardId: string,
  now: number = Date.now(),
): Promise<RedeemResult> {
  const settings = await getSettings()
  return db.transaction('rw', db.profiles, db.rewards, db.redemptions, async () => {
    const [profile, reward] = await Promise.all([
      db.profiles.get(profileId),
      db.rewards.get(rewardId),
    ])
    if (!profile || !reward) return { ok: false, reason: 'Not found' }
    if (!reward.active) return { ok: false, reason: 'Reward unavailable' }
    if (reward.stock !== null && reward.stock <= 0)
      return { ok: false, reason: 'Out of stock' }
    if (profile.points < reward.cost)
      return { ok: false, reason: 'Not enough points' }

    await db.profiles.update(profileId, {
      points: profile.points - reward.cost,
      updatedAt: now,
    })
    if (reward.stock !== null) {
      await db.rewards.update(rewardId, {
        stock: reward.stock - 1,
        updatedAt: now,
      })
    }
    const redemption: Redemption = {
      id: uid(),
      profileId,
      rewardId,
      rewardTitle: reward.title,
      cost: reward.cost,
      status: settings.requireRedemptionApproval ? 'pending' : 'approved',
      requestedAt: now,
      resolvedAt: settings.requireRedemptionApproval ? undefined : now,
    }
    await db.redemptions.put(redemption)
    return { ok: true, redemption }
  })
}

export async function resolveRedemption(
  redemptionId: string,
  status: 'approved' | 'rejected' | 'fulfilled',
  byProfileId: string,
  now: number = Date.now(),
): Promise<void> {
  await db.transaction('rw', db.profiles, db.rewards, db.redemptions, async () => {
    const r = await db.redemptions.get(redemptionId)
    if (!r) return
    // Refund points + stock when rejecting a not-yet-rejected redemption.
    if (status === 'rejected' && r.status !== 'rejected') {
      const p = await db.profiles.get(r.profileId)
      if (p) await db.profiles.update(r.profileId, { points: p.points + r.cost, updatedAt: now })
      const reward = await db.rewards.get(r.rewardId)
      if (reward && reward.stock !== null)
        await db.rewards.update(r.rewardId, { stock: reward.stock + 1, updatedAt: now })
    }
    await db.redemptions.update(redemptionId, {
      status,
      resolvedAt: now,
      resolvedByProfileId: byProfileId,
    })
  })
}

export function listRedemptions(): Promise<Redemption[]> {
  return db.redemptions.orderBy('requestedAt').reverse().toArray()
}

export function listPendingRedemptions(): Promise<Redemption[]> {
  return db.redemptions.where('status').equals('pending').toArray()
}

export function listRedemptionsForProfile(
  profileId: string,
): Promise<Redemption[]> {
  return db.redemptions.where('profileId').equals(profileId).toArray()
}

/** Award challenge bonus points to a participant and optionally close it. */
export async function awardChallengeBonus(
  profileId: string,
  bonusPoints: number,
  now: number = Date.now(),
): Promise<void> {
  const settings = await getSettings()
  await db.transaction('rw', db.profiles, async () => {
    const p = await db.profiles.get(profileId)
    if (!p) return
    const newXp = p.xp + bonusPoints
    await db.profiles.update(profileId, {
      points: p.points + bonusPoints,
      xp: newXp,
      level: levelForXp(newXp, settings.levelCurve),
      updatedAt: now,
    })
  })
}
