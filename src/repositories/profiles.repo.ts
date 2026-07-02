import { db } from '../db/db'
import type { Profile, Role } from '../domain/types'
import { uid } from '../lib/id'
import { hashPin } from '../lib/pin'
import { levelForXp } from '../domain/gamification'
import { getSettings } from './settings.repo'
import { recordDeletion } from '../sync/tombstones'

export function listProfiles(): Promise<Profile[]> {
  return db.profiles.orderBy('sortOrder').toArray()
}

export function getProfile(id: string): Promise<Profile | undefined> {
  return db.profiles.get(id)
}

export interface NewProfileInput {
  role: Role
  name: string
  avatar: string
  color: string
  pin?: string | null
  gameModeOptIn?: boolean
}

export async function createProfile(
  input: NewProfileInput,
  now: number = Date.now(),
): Promise<Profile> {
  const count = await db.profiles.count()
  const pin = input.pin
  const { pinHash, pinSalt } =
    pin && pin.length > 0 ? await hashPin(pin) : { pinHash: null, pinSalt: null }
  const profile: Profile = {
    id: uid(),
    role: input.role,
    name: input.name,
    avatar: input.avatar,
    color: input.color,
    pinHash,
    pinSalt,
    points: 0,
    xp: 0,
    level: 1,
    gameModeOptIn: input.gameModeOptIn ?? false,
    sortOrder: count,
    active: true,
    createdAt: now,
    updatedAt: now,
  }
  await db.profiles.put(profile)
  return profile
}

export async function updateProfile(
  id: string,
  patch: Partial<Profile>,
  now: number = Date.now(),
): Promise<void> {
  await db.profiles.update(id, { ...patch, updatedAt: now })
}

export async function setProfilePin(
  id: string,
  pin: string | null,
  now: number = Date.now(),
): Promise<void> {
  const { pinHash, pinSalt } =
    pin && pin.length > 0 ? await hashPin(pin) : { pinHash: null, pinSalt: null }
  await db.profiles.update(id, { pinHash, pinSalt, updatedAt: now })
}

export async function deleteProfile(id: string): Promise<void> {
  await db.transaction('rw', db.profiles, db.completions, db.redemptions, db.badgeAwards, async () => {
    await db.profiles.delete(id)
    await db.completions.where('profileId').equals(id).delete()
    await db.redemptions.where('profileId').equals(id).delete()
    await db.badgeAwards.where('profileId').equals(id).delete()
  })
  // One profile tombstone; the hub + other devices cascade-delete related rows.
  await recordDeletion('profiles', id)
}

/** Adjust a profile's spendable points (e.g. on redemption). Never below 0. */
export async function adjustPoints(
  id: string,
  delta: number,
  now: number = Date.now(),
): Promise<void> {
  const p = await db.profiles.get(id)
  if (!p) return
  await db.profiles.update(id, {
    points: Math.max(0, p.points + delta),
    updatedAt: now,
  })
}

/** Recompute and persist a profile's level from its XP. */
export async function refreshLevel(id: string): Promise<void> {
  const p = await db.profiles.get(id)
  if (!p) return
  const settings = await getSettings()
  const level = levelForXp(p.xp, settings.levelCurve)
  if (level !== p.level) await db.profiles.update(id, { level })
}
