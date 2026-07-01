import { beforeEach, describe, expect, it } from 'vitest'
import { db, ALL_TABLES } from './db'
import { resetToSeed } from './seed'
import { exportData, importData } from './backup'

describe('backup round-trip', () => {
  beforeEach(async () => {
    await resetToSeed(0)
  })

  it('exports then re-imports to an identical dataset', async () => {
    const before = await exportData(123)
    const profilesBefore = await db.profiles.count()

    // Wipe everything, confirm empty, then import.
    await db.transaction('rw', db.tables, async () => {
      for (const name of ALL_TABLES) await db.table(name).clear()
    })
    expect(await db.profiles.count()).toBe(0)

    const result = await importData(before)
    expect(result.ok).toBe(true)
    expect(await db.profiles.count()).toBe(profilesBefore)

    const after = await exportData(456)
    expect(after.data).toEqual(before.data)
  })

  it('rejects a non-backup file', async () => {
    const result = await importData({ foo: 'bar' })
    expect(result.ok).toBe(false)
  })

  it('rejects a newer schema version', async () => {
    const result = await importData({
      app: 'gamified-schedule',
      schemaVersion: 999,
      data: {},
    })
    expect(result.ok).toBe(false)
  })
})
