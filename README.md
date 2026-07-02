# Restaurant Management System

A complete full-stack restaurant management system: stock/ingredients, menu, sales, income, expenses, employees and salary payments, suppliers, purchases, reports and dashboard analytics, with JWT authentication and role-based access control.

## Overview

The system is split into two independent apps:

- **backend/** — a Node.js/Express REST API backed by PostgreSQL via Prisma ORM.
- **frontend/** — a React (Vite) single-page dashboard styled with Tailwind CSS.

## Features

- JWT authentication with 4 roles: `ADMIN`, `MANAGER`, `CASHIER`, `EMPLOYEE`
- Stock & ingredient inventory tracking with low-stock alerts
- Menu management with per-item ingredient recipes
- Sales that automatically validate and decrement ingredient stock (with clear "insufficient stock" errors)
- Purchases that automatically increment stock quantities
- Supplier management
- Employee management with salary/bonus/advance/overtime/deduction payments
- Expense tracking by category and month
- Dashboard analytics (today's sales/income, monthly income/expenses/profit, low stock, employee count, recent sales, top-selling items, income vs expenses chart)
- Reports: daily/monthly sales, monthly expenses, monthly profit, stock report, employee payments report, top-selling items
- Fully responsive UI (desktop, tablet, mobile)

## Technologies

**Backend:** Node.js, Express.js, PostgreSQL, Prisma ORM, JWT, bcrypt, Zod, dotenv, cors

**Frontend:** React.js, Vite, React Router, Axios, Tailwind CSS, Recharts

## Folder Structure

```
restaurant-management-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── validations/
│   │   └── utils/
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   ├── package.json
│   ├── index.html
│   └── README.md
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 13+

### 1. PostgreSQL Setup

Create a database for the app:

```bash
psql -U postgres -c "CREATE DATABASE restaurant_db;"
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET, CLIENT_URL

npm run prisma:migrate    # create tables
npm run prisma:seed       # load demo data
npm run dev                # start API on http://localhost:5000
```

### 3. Frontend Setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
# edit .env: set VITE_API_URL=http://localhost:5000/api

npm run dev                # start app on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

## Environment Variables

**backend/.env**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated |

**frontend/.env**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:5000/api` |

## Prisma Migration & Seed

```bash
cd backend
npm run prisma:migrate   # apply schema.prisma to the database
npm run prisma:generate  # regenerate the Prisma Client (run automatically after migrate)
npm run prisma:seed      # populate demo data (users, employees, suppliers, stock, menu, sales, expenses...)
```

## Default Login Accounts

After seeding, the following accounts are available on the Login page:

| Role | Email | Password |
|---|---|---|
| Admin | admin@restaurant.com | admin123 |
| Manager | manager@restaurant.com | manager123 |
| Cashier | cashier@restaurant.com | cashier123 |
| Employee | employee@restaurant.com | employee123 |

## Main API Endpoints

All endpoints are prefixed with `/api` and (except `/auth/register` and `/auth/login`) require an `Authorization: Bearer <token>` header.

```
Auth        POST /auth/register · POST /auth/login · GET /auth/me
Users       GET/PUT/DELETE /users, /users/:id                (ADMIN)
Employees   GET/POST/PUT/DELETE /employees, /employees/:id, GET /employees/:id/payments
Payments    GET/POST/PUT/DELETE /employee-payments
Suppliers   GET/POST/PUT/DELETE /suppliers
Stock       GET/POST/PUT/DELETE /stock, GET /stock/low-stock
Purchases   GET/POST/PUT/DELETE /purchases      (increments stock on create)
Menu        GET/POST/PUT/DELETE /menu, /menu/:id/ingredients
Sales       GET/POST/DELETE /sales               (validates & decrements stock on create)
Expenses    GET/POST/PUT/DELETE /expenses
Reports     GET /reports/dashboard, /reports/sales/daily, /reports/sales/monthly,
                /reports/expenses/monthly, /reports/profit/monthly, /reports/stock,
                /reports/employees/payments, /reports/top-selling-items
```

See `backend/README.md` for the full endpoint list and role permissions, and `frontend/README.md` for frontend-specific details.

## Notes on Business Logic

- **Purchases** increase stock quantities inside a Prisma transaction — if any part fails, nothing is written.
- **Sales** validate menu item availability and ingredient stock levels before writing anything; if an ingredient is short, the API returns a clear error naming it. On success, the sale, its line items, and the stock decrements all happen in a single transaction.
