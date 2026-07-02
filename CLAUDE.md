# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Dubbs Family Quest — a local-first, offline-capable PWA for family schedules, routines,
chores, and gamified rewards. No cloud; data lives on-device (IndexedDB) and optionally
syncs across devices through a self-hosted hub on the family's own PC.

## Commands

- `npm install` — install deps.
- `npm run dev` — Vite dev server (localhost:5173). No backend, so **sync is disabled**; pure local.
- `npm run build` — type-check + production build (`tsc -b && vite build`) into `dist/`.
- `npm run preview` — static preview of `dist/` (PWA/service worker active here, not in dev). No sync API.
- `npm run host` — run the **sync hub**: `node server/index.mjs` serves `dist/` + the sync API on port 4173. This is the real multi-device / production mode.
- `npm run test` — Vitest (jsdom). `npm run test:watch` for watch mode.
- Single test file: `npx vitest run src/domain/streaks.test.ts`. Single case: add `-t "substring"`.
- `npm run lint` — `tsc -b --noEmit` (types are the lint; there is no ESLint config).
- Regenerate PWA icons from `public/favicon.svg`: `npm i -D sharp && node scripts/gen-icons.mjs`.
- Windows launchers (repo root): `start.bat` (dev), `test-pwa.bat` (built preview), `host.bat` (hub), `setup-autostart.bat` / `remove-autostart.bat` (24/7 auto-start via Task Scheduler + firewall).

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind; Dexie (IndexedDB) for persistence;
Zustand for ephemeral UI/session state; React Router **hash** router (offline-friendly);
`vite-plugin-pwa` for the manifest + service worker.

**Strict layering — respect it:** `screens → hooks → repositories → db`. The **only**
place allowed to touch Dexie directly is `src/repositories/*` (+ `src/db/*`, `src/sync/*`).
UI reads reactively via `dexie-react-hooks` `useLiveQuery` wrappers in `src/hooks/data.ts`.

**`src/domain/` is pure logic — no I/O, no Dexie.** It is the unit-tested core and must
stay import-free of the DB. Key modules:
- `recurrence.ts` — `getDayInstances()` derives a profile's tasks for a date from
  recurring definitions (routines/chores/scheduleItems) + holiday context + the completion
  log. **There are no stored per-day task rows**; editing a definition or toggling holiday
  mode changes the day instantly.
- `gamification.ts` (XP→level curve), `streaks.ts`, `badges.ts` (criteria eval),
  `challenges.ts` (progress derived from completions), `holiday.ts`
  (`isHoliday(date, periods, override)`).

**Gamification writes are transactional** in `repositories/completions.repo.ts`
`toggleCompletion()`: inserts/removes a completion, adjusts points/XP, recomputes level,
evaluates badges, and (for approval-required chores) defers points until approved — all in
one Dexie transaction. Undo deletes the completion and reverses the award.

**Auth / roles:** profile picker + PIN is **convenience gating on a shared device, not
real security** (PINs are salted-hashed as a courtesy). Session lives in
`src/store/session.ts` (Zustand, deliberately **not** persisted → app opens to the picker).
Route gating (`RequireAuth` / `RequireParent`) is in `src/routes.tsx`.

**Settings** are one tabbed screen; each tab is `src/components/settings/*Tab.tsx`. App
config is a single Dexie row (`id: 'app'`) via `repositories/settings.repo.ts`.

**Seeding & backup:** `src/db/seed.ts` (`buildSeed` → `resetToSeed` → `ensureSeeded`, which
only seeds on first run / empty DB) ships the Dubbs family with **fixed IDs** so seeded
completions/redemptions/challenges can reference them. `src/db/backup.ts` does JSON
export/import (also reused by sync's full-replace).

**Sync (self-hosted hub), added in `src/sync/`:**
- `server/index.mjs` — Express hub: serves `dist/` + `/api` (`health`/`pull`/`push`/
  `replace`), storing all data in `server/data.json`. Per-record **last-write-wins** by
  `updatedAt`, a monotonic `rev` cursor for deltas, an `epoch` for full replaces, and
  tombstones for deletes (profile deletes cascade).
- `src/sync/sync.ts` — client engine. Uses the **same-origin** API, so it auto-enables
  only when the app is served from the hub (`npm run host`) and is a graceful no-op in dev
  or on a static deploy. Registers Dexie `creating`/`updating` hooks to build a dirty set
  (skipped while `applyingRemote`), runs a ~2.5s pull/push loop, and adopts the hub on
  epoch mismatch. `initSync()` (called from `src/main.tsx`) seeds an empty hub or adopts an
  existing one before first render.
- `src/sync/tombstones.ts` `recordDeletion()` writes to the `tombstones` table so deletes
  propagate; reset/import call `pushReplaceFromLocal()`.

## Conventions & gotchas

- Every entity has `id` / `createdAt` / `updatedAt`; `updatedAt` drives sync LWW.
  Repository functions take an explicit `now` param for deterministic tests.
- **All writes must go through repositories** so the sync dirty-hooks fire. When you add a
  **new delete path**, call `recordDeletion(table, id)`. When you add a **new table**, add
  it to `ALL_TABLES` in `src/db/db.ts` **and** the `TABLES` list in `server/index.mjs`, and
  bump the Dexie `version()` in `db.ts`.
- Dexie `transaction()` with >5 tables must use the **array form** (`db.transaction('rw', [t1, t2, ...], fn)`).
- Tests: the seed is intentionally rich, so `repositories/completions.repo.test.ts` creates
  a fresh profile and clears history in `beforeEach`. Domain tests use plain fixtures;
  repo/backup tests use `fake-indexeddb` (wired in `src/test/setup.ts`).
- Service worker / offline only work in built output served over **HTTPS or localhost** —
  not over a plain `http://<lan-ip>` (iOS won't register the SW there).

## Git / PR

Development branch: `claude/family-schedule-chores-app-lxzh60`. PR #1 targets `main`
(which is an empty root commit created solely as the PR base — do not expect app history there).
