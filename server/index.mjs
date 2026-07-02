// Dubbs Family Quest — sync hub.
//
// Serves the built PWA (../dist) AND a small sync API so every device on the home
// network shares one dataset. Storage is a single JSON file (server/data.json) —
// no external database, perfect for a self-hosted family box.
//
// Sync model: per-record last-write-wins.
//   - Every record carries `updatedAt` (client clock) used to resolve conflicts.
//   - The server tags each stored record with a monotonic `rev` so clients can ask
//     "what changed since rev N" without depending on clock sync.
//   - `epoch` bumps on a full replace (reset-to-sample / import); clients whose epoch
//     differs receive a full snapshot instead of deltas.
import express from 'express'
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const DATA_FILE = join(__dirname, 'data.json')
const PORT = Number(process.env.PORT) || 4173

// Data tables the hub stores (mirror of the client's ALL_TABLES).
const TABLES = [
  'profiles',
  'settings',
  'holidayPeriods',
  'routines',
  'chores',
  'scheduleItems',
  'rewards',
  'redemptions',
  'badges',
  'badgeAwards',
  'challenges',
  'completions',
]

function emptyStore() {
  const tables = {}
  for (const t of TABLES) tables[t] = {} // id -> { record, rev }
  return { epoch: 0, rev: 0, tables, tombstones: {} } // tombstones: "table:id" -> {table,id,deletedAt,rev}
}

let store = emptyStore()

function load() {
  if (existsSync(DATA_FILE)) {
    try {
      store = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
      for (const t of TABLES) if (!store.tables[t]) store.tables[t] = {}
      if (!store.tombstones) store.tombstones = {}
      console.log(`Loaded data (epoch ${store.epoch}, rev ${store.rev})`)
    } catch (e) {
      console.error('Could not read data.json, starting fresh:', e.message)
      store = emptyStore()
    }
  }
}

let saveTimer = null
function save() {
  // Debounced atomic write.
  if (saveTimer) return
  saveTimer = setTimeout(() => {
    saveTimer = null
    const tmp = DATA_FILE + '.tmp'
    writeFileSync(tmp, JSON.stringify(store))
    renameSync(tmp, DATA_FILE)
  }, 150)
}

function nextRev() {
  store.rev += 1
  return store.rev
}

if (!existsSync(__dirname)) mkdirSync(__dirname, { recursive: true })
load()

const app = express()
app.use(express.json({ limit: '64mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, epoch: store.epoch, rev: store.rev })
})

// Full snapshot as { table: [records] }
function snapshot() {
  const tables = {}
  for (const t of TABLES) tables[t] = Object.values(store.tables[t]).map((e) => e.record)
  return tables
}

app.get('/api/pull', (req, res) => {
  const since = Number(req.query.since) || 0
  const clientEpoch = req.query.epoch === undefined ? null : Number(req.query.epoch)

  if (clientEpoch !== store.epoch) {
    return res.json({
      replaceAll: true,
      epoch: store.epoch,
      rev: store.rev,
      tables: snapshot(),
    })
  }

  const changes = {}
  for (const t of TABLES) {
    const rows = []
    for (const entry of Object.values(store.tables[t])) {
      if (entry.rev > since) rows.push(entry.record)
    }
    if (rows.length) changes[t] = rows
  }
  const deletions = Object.values(store.tombstones).filter((tomb) => tomb.rev > since)
  res.json({ replaceAll: false, epoch: store.epoch, rev: store.rev, changes, deletions })
})

function cascadeDeleteProfile(profileId) {
  for (const t of ['completions', 'redemptions', 'badgeAwards']) {
    const bag = store.tables[t]
    for (const id of Object.keys(bag)) {
      if (bag[id].record.profileId === profileId) delete bag[id]
    }
  }
}

app.post('/api/push', (req, res) => {
  const { epoch, upserts = {}, deletions = [] } = req.body || {}
  if (epoch !== store.epoch) {
    return res.json({ stale: true, epoch: store.epoch, rev: store.rev })
  }

  for (const t of TABLES) {
    for (const record of upserts[t] || []) {
      if (!record || record.id == null) continue
      const existing = store.tables[t][record.id]
      if (!existing || (record.updatedAt ?? 0) >= (existing.record.updatedAt ?? 0)) {
        store.tables[t][record.id] = { record, rev: nextRev() }
        delete store.tombstones[`${t}:${record.id}`] // resurrected
      }
    }
  }

  for (const del of deletions) {
    if (!del || !del.table || del.id == null) continue
    const key = `${del.table}:${del.id}`
    const existing = store.tables[del.table]?.[del.id]
    const delAt = del.deletedAt ?? Date.now()
    if (!existing || delAt >= (existing.record.updatedAt ?? 0)) {
      if (existing) delete store.tables[del.table][del.id]
      if (del.table === 'profiles') cascadeDeleteProfile(del.id)
      store.tombstones[key] = { table: del.table, id: del.id, deletedAt: delAt, rev: nextRev() }
    }
  }

  save()
  res.json({ ok: true, epoch: store.epoch, rev: store.rev })
})

app.post('/api/replace', (req, res) => {
  const tables = (req.body && req.body.tables) || {}
  const fresh = emptyStore()
  fresh.epoch = store.epoch + 1
  fresh.rev = store.rev + 1
  for (const t of TABLES) {
    for (const record of tables[t] || []) {
      if (record && record.id != null) fresh.tables[t][record.id] = { record, rev: fresh.rev }
    }
  }
  store = fresh
  save()
  res.json({ ok: true, epoch: store.epoch, rev: store.rev })
})

// Static PWA + SPA fallback.
app.use(express.static(DIST))
app.get('*', (_req, res) => res.sendFile(join(DIST, 'index.html')))

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Dubbs Family Quest hub running on port ${PORT}`)
  console.log(`  Local:   http://localhost:${PORT}/`)
  console.log(`  Open the http://<this-pc-ip>:${PORT}/ address on your other devices.\n`)
})
