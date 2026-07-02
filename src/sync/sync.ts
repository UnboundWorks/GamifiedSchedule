import { create } from 'zustand'
import { db, ALL_TABLES, type TableName } from '../db/db'
import { ensureSeeded } from '../db/seed'

// ---------------------------------------------------------------------------
// Sync status (for the header chip)
// ---------------------------------------------------------------------------
export type SyncMode = 'local' | 'online' | 'offline' | 'syncing'

interface SyncStatus {
  mode: SyncMode
  lastSyncedAt: number | null
  set: (mode: SyncMode, lastSyncedAt?: number | null) => void
}

export const useSyncStatus = create<SyncStatus>((set) => ({
  mode: 'local',
  lastSyncedAt: null,
  set: (mode, lastSyncedAt) =>
    set((s) => ({ mode, lastSyncedAt: lastSyncedAt ?? s.lastSyncedAt })),
}))

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------
const CURSOR_KEY = 'dfq-sync-cursor'
let enabled = false
let applyingRemote = false
let hooksRegistered = false
let cycleRunning = false
const dirty = new Set<string>() // `${table}:${id}`

interface Cursor {
  epoch: number | null
  rev: number
}

function loadCursor(): Cursor {
  try {
    const raw = localStorage.getItem(CURSOR_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return { epoch: null, rev: 0 }
}
function saveCursor(c: Cursor) {
  cursor = c
  try {
    localStorage.setItem(CURSOR_KEY, JSON.stringify(c))
  } catch {
    /* ignore */
  }
}
let cursor: Cursor = loadCursor()

// ---------------------------------------------------------------------------
// Change capture — Dexie hooks mark records dirty (skipped while applying remote)
// ---------------------------------------------------------------------------
function registerHooks() {
  if (hooksRegistered) return
  hooksRegistered = true
  for (const name of ALL_TABLES) {
    const table = db.table(name)
    table.hook('creating', (primKey) => {
      if (!applyingRemote && primKey != null) dirty.add(`${name}:${primKey}`)
    })
    table.hook('updating', (_mods, primKey) => {
      if (!applyingRemote && primKey != null) dirty.add(`${name}:${primKey}`)
    })
  }
}

async function withRemote(fn: () => Promise<void>) {
  applyingRemote = true
  try {
    await fn()
  } finally {
    applyingRemote = false
  }
}

// ---------------------------------------------------------------------------
// API helpers (same-origin; only present when served from the hub)
// ---------------------------------------------------------------------------
async function api(path: string, init?: RequestInit, timeoutMs = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

async function getHealth(): Promise<{ epoch: number; rev: number } | null> {
  try {
    return await api('/api/health', undefined, 1500)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Applying remote data
// ---------------------------------------------------------------------------
async function cascadeDeleteProfileLocal(profileId: string) {
  await db.completions.where('profileId').equals(profileId).delete()
  await db.redemptions.where('profileId').equals(profileId).delete()
  await db.badgeAwards.where('profileId').equals(profileId).delete()
}

async function applyReplaceAll(tables: Record<string, unknown[]>) {
  await withRemote(async () => {
    for (const name of ALL_TABLES) {
      await db.table(name).clear()
      const rows = tables[name]
      if (Array.isArray(rows) && rows.length) await db.table(name).bulkPut(rows)
    }
    await db.tombstones.clear()
  })
  dirty.clear()
}

async function applyDeltas(
  changes: Record<string, unknown[]>,
  deletions: { table: string; id: string }[],
) {
  await withRemote(async () => {
    for (const name of ALL_TABLES) {
      const rows = changes[name]
      if (Array.isArray(rows) && rows.length) await db.table(name).bulkPut(rows)
    }
    for (const del of deletions) {
      await db.table(del.table).delete(del.id)
      if (del.table === 'profiles') await cascadeDeleteProfileLocal(del.id)
    }
  })
}

// ---------------------------------------------------------------------------
// Pull / push
// ---------------------------------------------------------------------------
async function pull() {
  const resp = await api(
    `/api/pull?since=${cursor.rev}&epoch=${cursor.epoch ?? ''}`,
  )
  if (resp.replaceAll) {
    await applyReplaceAll(resp.tables || {})
  } else {
    await applyDeltas(resp.changes || {}, resp.deletions || [])
  }
  saveCursor({ epoch: resp.epoch, rev: resp.rev })
}

async function push() {
  const sentKeys = [...dirty]
  const tombstones = await db.tombstones.toArray()
  if (sentKeys.length === 0 && tombstones.length === 0) return

  const upserts: Record<string, unknown[]> = {}
  for (const key of sentKeys) {
    const idx = key.indexOf(':')
    const table = key.slice(0, idx) as TableName
    const id = key.slice(idx + 1)
    const record = await db.table(table).get(id)
    if (record) (upserts[table] ||= []).push(record)
  }
  const deletions = tombstones.map((t) => ({
    table: t.table,
    id: t.recordId,
    deletedAt: t.deletedAt,
  }))

  const resp = await api('/api/push', {
    method: 'POST',
    body: JSON.stringify({ epoch: cursor.epoch, upserts, deletions }),
  })
  if (resp.stale) return // hub was replaced; next pull adopts the new snapshot
  // Clear exactly what we sent (new changes since are kept).
  sentKeys.forEach((k) => dirty.delete(k))
  if (tombstones.length) await db.tombstones.bulkDelete(tombstones.map((t) => t.key))
}

async function syncCycle() {
  if (!enabled || cycleRunning) return
  cycleRunning = true
  useSyncStatus.getState().set('syncing')
  try {
    await pull()
    await push()
    useSyncStatus.getState().set('online', Date.now())
  } catch {
    useSyncStatus.getState().set('offline')
  } finally {
    cycleRunning = false
  }
}

/** Push the entire local dataset as the new authoritative hub snapshot. */
export async function pushReplaceFromLocal() {
  if (!enabled) return
  const tables: Record<string, unknown[]> = {}
  for (const name of ALL_TABLES) tables[name] = await db.table(name).toArray()
  const resp = await api('/api/replace', {
    method: 'POST',
    body: JSON.stringify({ tables }),
  })
  saveCursor({ epoch: resp.epoch, rev: resp.rev })
  dirty.clear()
  await db.tombstones.clear()
}

export function syncNow() {
  void syncCycle()
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
export async function initSync(): Promise<void> {
  registerHooks()
  const health = await getHealth()

  if (!health) {
    // No hub reachable — pure local, offline-first (dev, static deploy, or PC off).
    enabled = false
    useSyncStatus.getState().set('local')
    await ensureSeeded()
    return
  }

  enabled = true
  try {
    if (health.epoch === 0) {
      // Hub is empty: this device seeds it.
      await ensureSeeded()
      await pushReplaceFromLocal()
    } else {
      // Hub has data: adopt it (replaceAll if our epoch differs) + push anything local.
      await pull()
      await push()
    }
    useSyncStatus.getState().set('online', Date.now())
  } catch {
    // Hub hiccup during startup — fall back to whatever is local so the app still opens.
    useSyncStatus.getState().set('offline')
    await ensureSeeded()
  }

  startLoop()
}

let loopStarted = false
function startLoop() {
  if (loopStarted) return
  loopStarted = true
  setInterval(syncCycle, 2500)
  window.addEventListener('online', syncNow)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncNow()
  })
}
