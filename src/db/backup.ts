import { db, ALL_TABLES, SCHEMA_VERSION, type TableName } from './db'

export interface BackupFile {
  app: 'gamified-schedule'
  schemaVersion: number
  exportedAt: number
  data: Record<TableName, unknown[]>
}

/** Serialize every table into a single JSON-able object. */
export async function exportData(now: number = Date.now()): Promise<BackupFile> {
  const data = {} as Record<TableName, unknown[]>
  for (const name of ALL_TABLES) {
    data[name] = await db.table(name).toArray()
  }
  return {
    app: 'gamified-schedule',
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now,
    data,
  }
}

export function backupToBlob(backup: BackupFile): Blob {
  return new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
}

/** Trigger a browser download of the current data. */
export async function downloadBackup(): Promise<void> {
  const backup = await exportData()
  const blob = backupToBlob(backup)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date(backup.exportedAt).toISOString().slice(0, 10)
  a.href = url
  a.download = `gamified-schedule-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface ImportResult {
  ok: boolean
  reason?: string
}

/**
 * Replace ALL local data with the contents of a backup file. Validates the app
 * marker and schema version, then wipes + bulk-loads in one transaction.
 */
export async function importData(raw: unknown): Promise<ImportResult> {
  const backup = raw as Partial<BackupFile>
  if (!backup || backup.app !== 'gamified-schedule') {
    return { ok: false, reason: 'Not a GamifiedSchedule backup file.' }
  }
  if (typeof backup.schemaVersion !== 'number') {
    return { ok: false, reason: 'Missing schema version.' }
  }
  if (backup.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      reason: `Backup is from a newer app version (v${backup.schemaVersion}).`,
    }
  }
  if (!backup.data) return { ok: false, reason: 'No data in backup.' }

  await db.transaction('rw', db.tables, async () => {
    for (const name of ALL_TABLES) {
      const rows = (backup.data as Record<string, unknown[]>)[name]
      await db.table(name).clear()
      if (Array.isArray(rows) && rows.length > 0) {
        await db.table(name).bulkPut(rows)
      }
    }
  })
  return { ok: true }
}

/** Parse a File selected via <input type=file> and import it. */
export async function importFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text()
    return await importData(JSON.parse(text))
  } catch {
    return { ok: false, reason: 'Could not read or parse the file.' }
  }
}
