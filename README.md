# Daily Allowance + Carryover Budget App

A production-ready MVP web application for managing daily spending allowance with carryover functionality.

## Features

- **Daily Allowance**: Set a base daily spending allowance (e.g., $20/day)
- **Carryover**: Unspent money carries over to the next day (can go negative if overspent)
- **Expense Tracking**: Add, edit, and delete expenses with categories and notes
- **Daily Ledger**: Fast reads for today's available budget and calendar history
- **Timezone Support**: Respects user's timezone for accurate daily calculations
- **Google Authentication**: Secure login via Supabase Auth

## Tech Stack

- **Backend**: Ruby on Rails (API-only)
- **Database**: Supabase Postgres
- **Auth**: Supabase Auth (Google OAuth)
- **Frontend**: React (Vite)

## Project Structure

```
Daily Finance App/
├── daily_budget_api/     # Rails API backend
├── frontend/             # React frontend
├── PROJECT_PLAN.md       # Detailed implementation plan
└── README.md            # This file
```

## Quick Start

### Prerequisites

1. Ruby 3.2.0+ installed
2. Node.js 18+ and npm/yarn installed
3. Supabase account and project set up
4. PostgreSQL client libraries

### Step 1: Supabase Setup

Follow the instructions in `PROJECT_PLAN.md` Part 2 to:
1. Create a Supabase project
2. Enable Google OAuth provider
3. Get all required credentials

### Step 2: Backend Setup

```bash
cd daily_budget_api

# Install dependencies
bundle install

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials:
# - SUPABASE_URL
# - SUPABASE_JWT_SECRET
# - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# - CORS_ORIGINS

# Run migrations
bundle exec rails db:create
bundle exec rails db:migrate

# Start the server
bundle exec rails server
```

The API will run on `http://localhost:3000`

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Supabase credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_API_BASE_URL (http://localhost:3000)

# Start the dev server
npm run dev
```

The frontend will run on `http://localhost:5173`

## API Endpoints

All endpoints are under `/api/v1` and require authentication via `Authorization: Bearer <token>` header.

### User
- `GET /api/v1/me` - Get current user profile

### Budget
- `GET /api/v1/budget` - Get user's budget
- `PATCH /api/v1/budget` - Update budget settings

### Daily
- `GET /api/v1/daily/today` - Get today's summary
- `GET /api/v1/daily?from=YYYY-MM-DD&to=YYYY-MM-DD` - Get date range ledger

### Expenses
- `GET /api/v1/expenses?from=YYYY-MM-DD&to=YYYY-MM-DD` - List expenses
- `POST /api/v1/expenses` - Create expense
- `PATCH /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

## Database Schema

- **users**: Supabase UID, email
- **budgets**: User's budget settings (base_daily_cents, currency, timezone)
- **expenses**: Individual expenses (date, amount_cents, category, note)
- **day_ledgers**: Pre-computed daily ledger entries for fast reads

## Ledger Computation

The app uses a deterministic ledger recompute system:
- When an expense is added/edited/deleted, the ledger is recomputed from that date forward
- This ensures correctness when editing past expenses
- Day ledgers are pre-computed for fast reads

## Development

### Running Tests

```bash
cd daily_budget_api
bundle exec rspec
```

### Database Migrations

```bash
cd daily_budget_api
bundle exec rails db:migrate
```

### Troubleshooting

**CORS Issues**: Make sure `CORS_ORIGINS` in Rails `.env` includes your frontend URL

**JWT Verification Errors**: Verify `SUPABASE_JWT_SECRET` matches your Supabase project's JWT secret

**Database Connection**: Ensure your Supabase database credentials are correct in `.env`

## Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend
- `SUPABASE_ANON_KEY` is safe for frontend use
- JWT secret should only be used server-side
- All API endpoints require valid authentication

## License

MIT

