import { db, SETTINGS_ID } from '../db/db'
import type { Settings } from '../domain/types'
import { defaultSettings } from '../db/defaults'

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get(SETTINGS_ID)
  if (s) return s
  const created = defaultSettings(Date.now())
  await db.settings.put(created)
  return created
}

export async function updateSettings(
  patch: Partial<Settings>,
  now: number = Date.now(),
): Promise<void> {
  const current = await getSettings()
  await db.settings.put({ ...current, ...patch, id: SETTINGS_ID, updatedAt: now })
}
