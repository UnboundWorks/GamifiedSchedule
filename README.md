# GamifiedSchedule

A **local-only, offline-first Progressive Web App** for running family life on a
shared iPad: daily & weekly schedules, morning/bedtime routines, chores, holiday
learning, and a gamified reward system for the kids (and, optionally, the parents).

No accounts server, no cloud, no monthly cost — everything lives on the device.
Install it to the home screen and the whole family uses it from one iPad.

## Features

- **Profiles + PIN login** — one shared **Parent** account and a profile per
  **Child**. Tap an avatar, enter a PIN. Parent PIN gates Settings.
- **Today dashboard** — routines, schedule, chores and holiday learning for the day.
- **Routine runner** — full-screen, ordered checklists (Morning & Bedtime ship by
  default). Finish to earn points.
- **Weekly view** — the whole week at a glance.
- **Chores** — daily & weekly, assignable, with optional parent approval.
- **Holiday mode** — define named breaks with date ranges (Summer, Winter, …). On
  holiday days the app switches to the holiday schedule and sprinkles **reading &
  math** sessions through the week. Manual on/off override too.
- **Gamification** — points, XP & levels, streaks, badges, and time-boxed **bonus
  challenges**. Completing tasks earns points; celebrate with confetti.
- **Reward store** — parent-defined rewards redeemed with points (with optional
  approval).
- **Parent game mode** — parents can opt in to earn points and join challenges.
- **Tabbed Settings** — Family · Routines · Chores · Schedule · Holiday · Rewards ·
  Game · Data. Everything is editable.
- **Backup/restore** — export/import all data as a JSON file (your only backup — see
  note below), plus "reset to sample data".

## Tech

Vite · React + TypeScript · Tailwind CSS · Dexie (IndexedDB) · Zustand · React Router
(hash) · vite-plugin-pwa.

- **Persistence:** all domain data is in IndexedDB via Dexie; the UI reads it
  reactively with `useLiveQuery`. Session state (who's signed in) is ephemeral.
- **Architecture:** `screens → hooks → repositories → db`. Pure logic lives in
  `src/domain/` (recurrence, gamification, streaks, badges, challenges, holiday) and
  is fully unit-tested.

## Develop

```bash
npm install
npm run dev        # dev server
npm run test       # unit + repository tests (Vitest)
npm run build      # type-check + production build
npm run preview    # serve the built PWA (service worker only runs here, not in dev)
```

### Run on Windows (double-click, no CLI)

If you just want to try the app on a Windows PC, install
[Node.js](https://nodejs.org/) (LTS) once, then double-click one of these in the
project folder:

- **`start.bat`** — dev mode. Installs dependencies on first run, starts the app, and
  opens your browser at `http://localhost:5173`. Best for trying out the UI.
- **`test-pwa.bat`** — builds the production app and serves it at
  `http://localhost:4173` so you can **install it as an app** (install icon in the
  address bar) and **test offline** (DevTools → Network → Offline → reload) — the same
  mode the iPad uses.

Leave the black command window open while using the app; close it to stop the server.

### Install on an iPad

1. `npm run build && npm run preview -- --host` and note the Network URL.
2. Open that URL in iPad Safari.
3. **Share → Add to Home Screen**. Launch from the icon — it runs standalone and
   works offline.

For real use, host the contents of `dist/` on any static host (or the same LAN
machine) and add it to the home screen once.

### Icons

App icons are pre-generated in `public/`. To regenerate from `public/favicon.svg`:

```bash
npm i -D sharp && node scripts/gen-icons.mjs
```

## ⚠️ Data & backups

All data is stored **only on the device**. iOS can evict IndexedDB under storage
pressure, so **export a backup regularly** from Settings → Data. PINs/roles are
convenience gating for a shared device, **not real security** — protect the iPad with
its own passcode.
