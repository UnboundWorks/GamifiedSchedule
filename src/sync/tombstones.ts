import { db } from '../db/db'

/**
 * Record a local deletion so the sync engine can tell the hub (and thus other
 * devices) that this record is gone — absence alone can't be distinguished from
 * "never existed". Called from the repository delete paths.
 *
 * Safe to call inside an existing Dexie transaction as long as `tombstones` is
 * in scope; otherwise Dexie runs it in its own transaction.
 */
export async function recordDeletion(table: string, recordId: string): Promise<void> {
  await db.tombstones.put({
    key: `${table}:${recordId}`,
    table,
    recordId,
    deletedAt: Date.now(),
  })
}
