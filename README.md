# Habit Recovery

A mobile-first, installable Progressive Web App for quitting unwanted habits — streak tracking, daily check-ins, an in-the-moment urge tracker, a trigger journal, goals, achievements, and full statistics. Built with plain HTML/CSS/JavaScript, stores everything locally in IndexedDB, and works completely offline after the first visit. No backend, no build step, no frameworks.

---

## Quick start

**Option A — just open it**
Double-click `index.html`. (Some browsers restrict IndexedDB/Service Workers on `file://` — if the app doesn't load data, use Option B.)

**Option B — local server (recommended)**
```bash
cd habit-recovery-app
python3 -m http.server 8080
# open http://localhost:8080/login.html
```

**Demo login**
- Access ID: `admin`
- Password: `admin123`

Accounts are stored in the `users` IndexedDB store and are meant to be managed by an admin (see [Authentication](#authentication) below) — there is intentionally no sign-up screen.

---

## Deploying to GitHub Pages

1. Push this folder's contents to the root of a GitHub repo (or to a `/docs` folder).
2. In the repo, go to **Settings → Pages**, set the source branch/folder, and save.
3. Visit the published URL — `login.html` is the true entry point; `index.html` redirects there automatically if no one is logged in.
4. On a phone, open the site in Chrome and use **Add to Home Screen** to install it as a standalone app.

No environment variables, API keys, or build tooling are required — it's fully static.

---

## Folder structure

```
habit-recovery-app/
├── index.html              # Main app shell (post-login)
├── login.html               # Login screen (Access ID + Password only)
├── manifest.json             # PWA manifest (icons, theme, display mode)
├── service-worker.js          # Offline caching (precaches the whole app shell)
├── README.md
├── css/
│   ├── tokens.css            # Design tokens: color, type, radii, shadows (light + dark theme)
│   ├── base.css               # Reset + global typography + scroll shell
│   ├── components.css          # Cards, buttons, nav, sheets, ring, calendar, etc.
│   └── screens.css             # Small per-screen layout tweaks
├── js/
│   ├── core/                   # Browser-facing infrastructure (isolated on purpose — see below)
│   │   ├── db.js                 # IndexedDB storage abstraction — the ONLY file that touches indexedDB
│   │   ├── auth.js               # Login/session logic (no sign-up by design)
│   │   └── router.js             # Hash-based screen router
│   ├── services/                # Pure business logic, no DOM access
│   │   ├── habits.js              # Habits, check-ins, streak math, goals, achievements
│   │   ├── journal.js             # Journal + trigger tracker CRUD
│   │   └── urge.js                # Urge event logging + supportive content
│   ├── ui/                       # Screen renderers (HTML string builders) + shared UI helpers
│   │   ├── components.js
│   │   ├── dashboard.js
│   │   ├── checkin.js
│   │   ├── urgeScreen.js
│   │   ├── journalScreen.js
│   │   ├── triggerScreen.js
│   │   ├── goalsScreen.js
│   │   ├── achievementsScreen.js
│   │   ├── statsScreen.js
│   │   ├── calendarScreen.js
│   │   └── settingsScreen.js
│   └── app.js                   # Boots the app: auth guard, route registration, shell wiring
└── icons/                      # App icons (placeholders — swap in real artwork before shipping)
```

---

## Features

- **Dashboard** — current & longest streak (Sunrise Ring visual), total successful days, success %, weekly/monthly progress bars, calendar preview, motivational message.
- **Daily check-in** — mood, energy, stress, urge level, sleep hours, notes, and a success/relapse toggle.
- **Urge tracker ("I Have an Urge")** — always-visible floating button opens an emergency screen with a 5-minute breathing timer, a meditation timer, motivational messages, water/exercise/walking reminders, and rotating distraction ideas. Ends by asking "Did the urge pass?" and logs the outcome.
- **Journal** — dated entries with title + notes; edit and delete.
- **Trigger tracker** — logs time, mood, trigger, optional location, and notes; shows a frequency chart of your most common triggers.
- **Goals** — preset (7/30/90/180/365 days) or custom day-count goals per habit, with live progress.
- **Achievements** — badges for 1, 3, 7, 14, 30, 60, 90, 180, 365-day streaks, unlocked automatically.
- **Statistics** — current/longest streak, relapses, urges resisted, average streak length, 6-month report, completion rate.
- **Calendar** — full month view, green = success, red = relapse, gray = no entry.
- **Settings** — light/dark mode, manage habits, export/import/reset data (JSON file), About & Privacy, Change PIN (placeholder for a future admin-managed flow).
- **Multiple habits** — track more than one habit at a time (e.g. smoking + nail-biting), each with its own streaks, check-ins, journal, triggers, goals, and badges. Switch between them with the habit strip at the top of most screens.

---

## Authentication

There is **no sign-up flow by design**. The `users` store in IndexedDB holds accounts; `js/core/db.js` and `js/core/auth.js` seed one demo account (`admin` / `admin123`) on first run.

To add a future **admin panel**, you only need to write UI that calls the existing storage API:
```js
await DB.put('users', { id: DB.makeId('user'), accessId: 'newuser', password: '...', name: 'New User', createdAt: new Date().toISOString() });
await DB.remove('users', existingUserId);
```
No other file needs to change. Passwords are stored in plaintext for this offline demo — replace with proper hashing (or a real auth backend) before handling real user data.

---

## Data storage & privacy

Everything is stored **on-device only**, in IndexedDB (habits, check-ins, journal, triggers, goals, achievements, urges) with a couple of small preferences (theme, session flag, selected habit) in `localStorage`. Nothing is ever uploaded anywhere — there is no server, no analytics, no third-party API calls. Use **Settings → Export Data** to save a JSON backup, and **Import Data** to restore it (e.g. on a new device).

---

## Architecture notes for future native conversion

This project was structured so it can later be wrapped with **Capacitor/Cordova** or ported to **React Native/Flutter** with minimal redesign:

- **UI, business logic, and storage are in separate layers.** `js/services/*` never touches the DOM; `js/ui/*` never touches IndexedDB directly; `js/core/db.js` is the single choke point for persistence.
- **Swapping storage engines** (e.g. to SQLite on a native platform) only requires rewriting `js/core/db.js` — every service/UI call goes through its `get/getAll/query/put/remove` API, not raw IndexedDB calls.
- **No tightly-coupled browser APIs** outside `js/core/` — `auth.js` isolates `localStorage` session handling, `router.js` isolates `location.hash` navigation, `app.js` isolates the service worker registration.
- **Touch-first, single-column, bottom-nav layout** mirrors common native navigation patterns (tab bar + modal sheets) rather than a desktop-web layout.
- **No dependencies** beyond two Google Fonts — nothing to fight with during a native migration.

---

## Icons

The icons in `/icons` are placeholders (generated sunrise-ring marks in the app's brand gradient). Swap them for final artwork before a real launch — keep the same filenames/sizes referenced in `manifest.json` and `index.html`/`login.html`, or update those references if you rename files.

---

## Browser support

Built and tested against modern evergreen browsers (Chrome/Edge/Safari/Firefox), optimized primarily for **Android Chrome** and iOS Safari on phones and tablets. Requires IndexedDB and Service Worker support, both widely available.
