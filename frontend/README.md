# Restaurant Management System — Frontend

React + Vite dashboard for the Restaurant Management System.

## Tech Stack

- React 18 + Vite
- React Router v6
- Axios
- Tailwind CSS
- Recharts

## Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

```
VITE_API_URL=http://localhost:5000/api
```

Point this at your running backend API.

### 3. Run the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`. Make sure the backend API is running first (see `../backend/README.md`).

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build locally |

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx              # App entry point (router + auth provider)
│   ├── App.jsx                # Route definitions
│   ├── api/                   # Axios instance + one module per resource
│   ├── components/            # Layout, Sidebar, Navbar, ProtectedRoute, StatCard, DataTable, Modal, Alert
│   ├── context/AuthContext.jsx
│   ├── pages/                 # One page per feature (Dashboard, Employees, Stock, ...)
│   └── utils/format.js        # Currency/date formatting helpers
├── index.html
└── package.json
```

## Authentication

- JWT tokens are stored in `localStorage` and attached automatically to every API request via an Axios request interceptor (`src/api/axios.js`).
- A response interceptor logs the user out and redirects to `/login` whenever the API returns `401`.
- `ProtectedRoute` guards every authenticated page and can additionally restrict a route to specific roles (e.g. Reports is `ADMIN`/`MANAGER` only).
- The sidebar only renders links the current user's role is allowed to access.

## Pages

- **Login** — authenticates against `/api/auth/login`, stores the JWT, redirects to the dashboard.
- **Dashboard** — today's sales/income, monthly income/expenses/profit, low stock and employee counts, recent sales table, top-selling items chart, income vs expenses chart, low-stock warning list — all sourced from `/api/reports/dashboard`.
- **Employees** — CRUD + search.
- **Employee Payments** — salary/bonus/advance/overtime/deduction records with employee and month filters.
- **Stock** — CRUD, low-stock indicators, search and category filter.
- **Suppliers** — CRUD with contact info.
- **Purchases** — create a purchase with multiple line items; total is computed client-side and stock is increased server-side.
- **Menu** — CRUD, per-item ingredient management, availability toggle.
- **Sales** — create a sale with multiple line items, discount and payment method; stock is decreased server-side and insufficient-stock errors are surfaced in the UI.
- **Expenses** — CRUD with category/month filters and a running total.
- **Reports** — monthly income/expenses/profit chart, top-selling items, employee payments summary, full stock report.

## Building for Production

```bash
npm run build
```

Outputs a static bundle to `frontend/dist/` that can be served by any static file host (Nginx, Vercel, Netlify, etc.). Set `VITE_API_URL` to your production API URL before building.
