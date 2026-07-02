# Le Coin des Pêcheurs — Desktop App

A self-contained Windows/Linux desktop version of the restaurant management
system. It bundles the same Express API and React frontend used by the web
app, but swaps PostgreSQL for a local SQLite database stored on your
computer — no separate database server, no `.env` file, no two terminals.
Install it, double-click the icon, and it works.

This folder is completely independent from `../backend` and `../frontend`.
Nothing in those folders was changed to build this — the desktop app has its
own copy of the server code (adapted for SQLite) under `server/`, and reuses
`../frontend` unchanged at build time.

## Quick start (run without installing)

```cmd
cd desktop
npm install
npm start
```

The first `npm start` builds the frontend, generates the Prisma client, and
creates a fresh seeded database — this takes a minute. A window will open
with the app already logged out and ready to use.

Default accounts (same as the web app):

| Role | Email | Password |
|---|---|---|
| Admin | admin@restaurant.com | admin123 |
| Manager | manager@restaurant.com | manager123 |
| Cashier | cashier@restaurant.com | cashier123 |

## Build a real installer (.exe)

```cmd
cd desktop
npm install
npm run dist
```

This produces a Windows installer under `desktop/dist/` (e.g.
`Le Coin des Pêcheurs Setup 1.0.0.exe`). Run that installer on any Windows
PC to get a real Start Menu entry, desktop shortcut, and uninstaller — no
Node, npm, PostgreSQL, or command line needed on the machine it's installed
on.

Build the installer on the machine/OS you're targeting (build the Windows
installer on Windows). Cross-building Windows installers from Linux/macOS is
possible with extra tooling but isn't set up here.

## Where your data lives

Each installed copy keeps its own database on the user's machine — nothing
is shared between installs unless you explicitly copy the file:

- Windows: `%APPDATA%\le-coin-des-pecheurs-desktop\restaurant.db`
- Linux: `~/.config/le-coin-des-pecheurs-desktop/restaurant.db`

Back this file up like any other important document — copying it elsewhere
and dropping it back in the same location restores your data.

## How it works

- `main.js` — Electron's main process. On launch, it copies a pre-seeded
  template database (`resources/template.db`) to the user's data folder if
  one doesn't exist yet, generates a random JWT signing key (stored
  alongside the database), starts the embedded Express server on
  `http://127.0.0.1:5051`, then opens a window pointed at it.
- `server/` — a standalone copy of the backend, adapted for SQLite:
  - `server/prisma/schema.prisma` uses `provider = "sqlite"`. SQLite has no
    native enum type, so columns that were Postgres enums (role, status,
    payment method, etc.) are plain validated strings instead — the Zod
    validation that already gated every write is unchanged and is what
    actually enforces the allowed values.
  - Free-text search (`?search=`) filters in JavaScript after the query
    instead of using Prisma's `mode: 'insensitive'`, which SQLite doesn't
    support.
  - Passwords are hashed with `bcryptjs` (pure JavaScript) instead of
    `bcrypt`, so Electron packaging never needs to rebuild a native addon.
  - Auth cookies are never marked `secure`, since the app always talks to
    itself over plain `http://127.0.0.1`, not HTTPS.
  - Express serves the built frontend as static files and falls back to
    `index.html` for client-side routes, so the API and the UI are one
    process on one port.
- `resources/template.db` — generated at build time
  (`npm run build:template-db`) by running migrations and the seed script
  against a throwaway database, then copying the result here. This is what
  gets bundled into the installer and copied to each user on first launch.

## Updating this app after changing the web app

If you change `backend/` (new fields, new endpoints, new business logic),
those changes need to be re-applied here by hand — this folder is a
snapshot, not a live mirror. The safest way: re-copy the changed
controller/route/validation files from `backend/src` into `server/src`,
then redo the SQLite-specific adjustments listed above for anything you
touched (enum columns → strings, `mode: 'insensitive'` → JS filtering,
`bcrypt` → `bcryptjs`).

If you only changed `frontend/`, no changes are needed here at all — `npm
run dist` always rebuilds the frontend fresh from `../frontend` before
packaging.
