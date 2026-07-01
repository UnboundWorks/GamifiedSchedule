import type { Table } from 'dexie'
import { uid } from '../lib/id'

interface BaseEntity {
  id: string
  createdAt: number
  updatedAt: number
}

/**
 * Generic CRUD factory over a Dexie table for entities carrying id/createdAt/
 * updatedAt. Keeps the repository modules terse and consistent. Callers pass a
 * timestamp so logic stays testable/deterministic.
 */
export function makeRepo<T extends BaseEntity>(table: Table<T, string>) {
  return {
    all: () => table.toArray(),
    get: (id: string) => table.get(id),
    async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, now: number) {
      const entity = {
        ...data,
        id: uid(),
        createdAt: now,
        updatedAt: now,
      } as unknown as T
      await table.put(entity)
      return entity
    },
    async update(id: string, patch: Partial<T>, now: number) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await table.update(id, { ...patch, updatedAt: now } as any)
      return table.get(id)
    },
    async put(entity: T, now: number) {
      await table.put({ ...entity, updatedAt: now })
    },
    remove: (id: string) => table.delete(id),
    table,
  }
}
