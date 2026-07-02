# Restaurant Management System — Backend

REST API built with Node.js, Express.js, PostgreSQL and Prisma ORM.

## Tech Stack

- Node.js / Express.js
- PostgreSQL + Prisma ORM
- JWT authentication (`jsonwebtoken`) delivered via an httpOnly cookie (`cookie-parser`)
- `bcrypt` for password hashing
- `zod` for request validation
- `helmet` for security headers, `express-rate-limit` on auth endpoints
- `cors`, `dotenv`, `morgan`

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your PostgreSQL connection string and JWT secret:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restaurant_db?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET="replace-this-with-a-long-random-secret-string"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:5173"
```

### 3. Create the database

Make sure PostgreSQL is running, then create the database referenced in `DATABASE_URL` (e.g. `restaurant_db`).

### 4. Run migrations

```bash
npm run prisma:migrate
```

### 5. Seed demo data

```bash
npm run prisma:seed
```

This creates default accounts, sample employees, suppliers, stock items, menu items with ingredients, purchases, sales and expenses.

### 6. Run the server

```bash
npm run dev     # nodemon, auto-restart
npm start       # plain node
```

The API will be available at `http://localhost:5000/api`.

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the server with nodemon |
| `npm start` | Start the server with node |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run prisma:generate` | Generate the Prisma Client |
| `npm run prisma:seed` | Seed the database with demo data |
| `npm run prisma:studio` | Open Prisma Studio |

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database models
│   └── seed.js            # Demo data seed script
├── src/
│   ├── app.js              # Express app (middleware, routes)
│   ├── server.js           # Entry point
│   ├── config/database.js  # Prisma client singleton
│   ├── routes/              # Express routers
│   ├── controllers/         # Route handlers / business logic
│   ├── middleware/          # auth, validate, error handling
│   ├── validations/         # Zod schemas
│   └── utils/                # asyncHandler, apiResponse, jwt
├── .env.example
└── package.json
```

## Authentication & Roles

`/api/auth/login` and `/api/auth/register` issue a JWT and set it as an **httpOnly cookie** (`token`) — the browser sends it automatically on every subsequent request, and client-side JavaScript can never read it, which protects the session even if an XSS bug slips into the frontend. `/api/auth/logout` clears the cookie. For non-browser clients (Postman, scripts, mobile), `protect` also accepts a classic `Authorization: Bearer <token>` header as a fallback, but the API never returns the raw token in a JSON response body — only the cookie carries it.

Public registration always creates an `EMPLOYEE` account; only an `ADMIN` can change a user's role afterwards via `PUT /api/users/:id`.

| Role | Access |
|---|---|
| `ADMIN` | Full access to all resources, including user management |
| `MANAGER` | Employees, stock, suppliers, purchases, menu, sales, expenses, reports |
| `CASHIER` | Create/view sales, view stock and menu |
| `EMPLOYEE` | View menu only |

## Response Format

All endpoints respond with a consistent envelope:

```json
{ "success": true, "message": "...", "data": ... }
```

```json
{ "success": false, "message": "...", "error": ... }
```

## Key Business Logic

- **Purchases** — creating a purchase increases the linked stock item quantities inside a single Prisma transaction. Deleting a purchase reverts those quantities.
- **Sales** — creating a sale validates that every menu item exists and is available, aggregates the required ingredient quantities from `MenuItemIngredient`, verifies there is enough stock for each ingredient (returning a clear error naming the missing ingredient if not), then creates the sale and decrements stock — all inside one Prisma transaction.

## Main API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/employees
POST   /api/employees
PUT    /api/employees/:id
DELETE /api/employees/:id
GET    /api/employees/:id/payments

GET    /api/employee-payments
POST   /api/employee-payments
PUT    /api/employee-payments/:id
DELETE /api/employee-payments/:id

GET    /api/suppliers
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id

GET    /api/stock
GET    /api/stock/low-stock
POST   /api/stock
PUT    /api/stock/:id
DELETE /api/stock/:id

GET    /api/purchases
POST   /api/purchases
PUT    /api/purchases/:id
DELETE /api/purchases/:id

GET    /api/menu
POST   /api/menu
PUT    /api/menu/:id
DELETE /api/menu/:id
POST   /api/menu/:id/ingredients
PUT    /api/menu/:id/ingredients/:ingredientId
DELETE /api/menu/:id/ingredients/:ingredientId

GET    /api/sales
POST   /api/sales
DELETE /api/sales/:id

GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/:id
DELETE /api/expenses/:id

GET    /api/reports/dashboard
GET    /api/reports/sales/daily
GET    /api/reports/sales/monthly
GET    /api/reports/expenses/monthly
GET    /api/reports/profit/monthly
GET    /api/reports/stock
GET    /api/reports/employees/payments
GET    /api/reports/top-selling-items
```

## Default Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@restaurant.com | admin123 |
| Manager | manager@restaurant.com | manager123 |
| Cashier | cashier@restaurant.com | cashier123 |
| Employee | employee@restaurant.com | employee123 |
