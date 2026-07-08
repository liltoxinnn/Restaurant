# Deploying online (Railway)

This turns the app into one public website with a real online database —
any computer, phone, or tablet with the link can log in and see the same
live data. No local installs, no two terminals, no PostgreSQL on your
machine.

This is separate from `desktop/` (which is an offline, single-computer app
with its own local database). Use this guide if you want everyone sharing
the same live data instead.

## What you'll end up with

- One URL (e.g. `https://your-app.up.railway.app`) serving both the app and its API
- A real PostgreSQL database hosted by Railway
- Automatic redeploys whenever new code is pushed to this branch

## Step 1 — Create a Railway account

Go to [railway.app](https://railway.app) and sign up (you can sign up with
your GitHub account, which makes step 2 easier).

## Step 2 — Create a new project from this repo

1. In Railway, click **New Project → Deploy from GitHub repo**.
2. Pick this repository (`liltoxinnn/restaurant`) and the branch you want
   to deploy (e.g. `main`, once this work is merged there — see below).
3. Railway will detect the root `package.json` and start a build. Let it
   fail for now — it needs a database and environment variables first
   (next steps).

## Step 3 — Add a PostgreSQL database

1. In your Railway project, click **New → Database → Add PostgreSQL**.
2. That's it — Railway creates the database and exposes a `DATABASE_URL`
   you can reference from your app service.

## Step 4 — Set environment variables on the app service

Click your app service → **Variables** and add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Click "Add Reference" → pick the Postgres service's `DATABASE_URL` (don't type this by hand) |
| `JWT_SECRET` | A long random string — 40+ characters. Generate one with `openssl rand -hex 32` or any password generator. |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Your Railway public URL once you have it (step 5) — e.g. `https://your-app.up.railway.app`. Safe to leave as `http://localhost:5173` until you know the real URL, then update and redeploy. |

## Step 5 — Get a public URL and deploy

1. Click your app service → **Settings → Networking → Generate Domain**.
   Railway gives you a free `*.up.railway.app` URL.
2. Go back to **Variables** and set `CLIENT_URL` to that URL.
3. Railway auto-redeploys on variable changes. Watch the **Deployments**
   tab — it should build (installs backend + frontend, builds the
   frontend, generates the Prisma client) and then start (applies database
   migrations, starts the server).
4. Once it shows "Active", open the generated URL — you should see the
   login page.

## Step 6 — Load the starting data (do this once)

The database is empty on first deploy — no tables have data yet, no admin
account exists. Load the same demo data used locally (accounts, menu,
stock, etc.) with Railway's CLI:

```bash
npm install -g @railway/cli
railway login
railway link          # pick this project when prompted
railway run npm run seed
```

**Only run this once, right after the first deploy.** The seed script
*wipes* all existing data before recreating it — running it again later
against a database with real orders in it will delete them.

After logging in as admin (step 7), go to the **Users** page and delete or
edit any of the demo accounts you don't want, and change the admin
password. (Self-registration on the login page always creates a regular
`EMPLOYEE` account — only an existing admin can promote someone to
`ADMIN`, so seeding is the practical way to get your first admin account.)

## Step 7 — Log in

Same accounts as local dev, if you used the seed script:

| Role | Email | Password |
|---|---|---|
| Admin | admin@restaurant.com | admin123 |
| Manager | manager@restaurant.com | manager123 |
| Cashier | cashier@restaurant.com | cashier123 |

**Change these passwords** (or delete the demo accounts and create your
own) before using this for real — this list is public in the repo.

## How it works

- `package.json` at the repo root (not `backend/` or `frontend/`) is what
  Railway builds: it installs both `backend/` and `frontend/`, builds the
  frontend with `VITE_API_URL=/api` (a relative path, so the browser talks
  to whatever domain it's loaded from), copies the built frontend into
  `backend/public/`, and generates the Prisma client.
- On start, it runs `prisma migrate deploy` (applies any new database
  migrations — safe to run on every deploy, never touches existing rows)
  and then starts the existing Express server.
- `backend/src/app.js` was given one small addition: if `backend/public`
  exists, it serves those files and falls back to `index.html` for
  frontend routes, so the API and the UI are one origin, one URL, no CORS
  headaches, no separate frontend host needed. Locally, that folder never
  exists, so `npm run dev` in `backend/` and `frontend/` behaves exactly as
  it always has — this was verified before pushing.
- `backend/`'s own `.env`/local Postgres setup is untouched — this is all
  additive, driven by Railway's environment variables instead of a local
  `.env` file.

## Updating the live site later

Any future changes I push to this branch (or `main`, depending on which
one you point Railway at) trigger an automatic redeploy — no manual steps
needed beyond what's above, unless a change adds a new required
environment variable, which I'll call out explicitly if it happens.
