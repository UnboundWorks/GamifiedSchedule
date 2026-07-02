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

### Host it 24/7 on a Windows PC (use it from the iPad anytime)

Run it on a PC that stays on, and open it from the iPad over your home Wi-Fi — no
cloud, no monthly cost. The PC also acts as the family **data hub**: every device
(iPad, phones, PCs) **syncs automatically** through it, so a change made anywhere shows
up everywhere. Each device also keeps a local copy, so it keeps working offline and
catches up when it's back on your network. Nothing leaves your home network.

**Quick way (leave it running):** double-click **`host.bat`**. It builds the app and
serves it, printing a `Network:` address like `http://192.168.0.67:4173/`. Open that in
iPad Safari → **Share → Add to Home Screen**.

**Always-on way (starts itself after reboots):**

1. **Right-click `setup-autostart.bat` → Run as administrator** (once). This opens the
   firewall for port 4173, registers the host to start at login, and starts it now. It
   prints the address(es) to use.
2. In your **router**, give this PC a **reserved / static IP** so its address never
   changes (otherwise the iPad's saved link may break after a reboot).
3. On the iPad, open `http://<pc-ip>:4173` in **Safari → Share → Add to Home Screen**.

To stop auto-starting, right-click **`remove-autostart.bat` → Run as administrator**.

**Updating to a newer version:** in the project folder run `git pull`, then restart the
host (close the window and re-run `host.bat`, or reboot). If dependencies changed, run
`npm install` once. The host rebuilds on each start, so you always serve the latest.

> Troubleshooting "Safari can't open the page": it's almost always the **Windows
> Firewall** (run `setup-autostart.bat` as admin, or allow port 4173) or the iPad being
> on a **different Wi-Fi** (avoid Guest networks / separate 2.4GHz vs 5GHz names).

**How sync works:** the hub stores the shared data in `server/data.json`. Devices pull
each other's changes every few seconds and push their own; edits merge per-record
(last-writer-wins for the same field; independent completions all survive). Deletions
and "Reset to sample data" / "Import" propagate to every device. A small **Synced /
Offline** chip in the app header shows the current state.

> Note: over plain `http://<ip>` (not HTTPS), iOS won't run the offline service worker,
> so if the hub PC is **off**, the app won't load on the iPad — which is fine since the
> hub is meant to stay on 24/7. (Data itself is safe on each device regardless.) If you
> later want true offline-on-iPad, serve the hub over HTTPS — ask and I can add that.

### Install on an iPad (summary)

1. Get the app on your network (either `host.bat` above, or `npm run build && npm run
   preview -- --host`) and note the **Network** URL.
2. Open that URL in **iPad Safari**.
3. **Share → Add to Home Screen**. Launch from the icon — it runs standalone and, once
   loaded, works offline. Data lives on the iPad; move a setup between devices with
   **Settings → Data → Export/Import**.

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
