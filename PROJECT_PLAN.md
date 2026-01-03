# Daily Allowance + Carryover Budget App - Implementation Plan

## Overview
A production-ready MVP web application for daily spending allowance with carryover functionality. Users set a base daily allowance, and any unspent amount carries over to the next day (can go negative if overspent).

## Tech Stack
- **Backend**: Ruby on Rails (API-only)
- **Database**: Supabase Postgres
- **Auth**: Supabase Auth (Google OAuth)
- **Frontend**: React (Vite)

---

## PART 1: PROJECT PLAN

### Milestone 1: Supabase Setup
**Goal**: Configure Supabase project with Google Auth and database access

**Steps**:
1. Create Supabase project
2. Enable Google OAuth provider
3. Configure OAuth redirect URLs
4. Retrieve credentials:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - Database connection details (host, port, database, user, password)
   - JWT secret for Rails verification
5. Test Google login flow

**Deliverables**:
- Supabase project configured
- Credentials documented in `.env.example` files

---

### Milestone 2: Rails API Setup + Database Connection
**Goal**: Initialize Rails API app and connect to Supabase Postgres

**Steps**:
1. Create new Rails API app: `rails new daily_budget_api --api`
2. Configure PostgreSQL adapter
3. Add required gems:
   - `pg` (PostgreSQL adapter)
   - `jwt` (JWT verification)
   - `rack-cors` (CORS for React dev server)
   - `rspec-rails` (testing)
   - `factory_bot_rails` (test factories)
   - `dotenv-rails` (environment variables)
4. Configure database connection to Supabase
5. Set up CORS for local development
6. Configure environment variables

**Deliverables**:
- Rails API app initialized
- Database connection working
- CORS configured
- Gemfile with all dependencies

---

### Milestone 3: Rails Auth Verification with Supabase JWT
**Goal**: Verify Supabase JWT tokens and authenticate users

**Steps**:
1. Create JWT verification service
2. Implement `ApplicationController#authenticate!` method
3. Extract user info from JWT (sub, email)
4. Find or create User record from Supabase UID
5. Set `current_user` helper
6. Handle 401 errors for invalid tokens
7. Create `/api/v1/me` endpoint to test auth

**Deliverables**:
- JWT verification working
- User authentication flow complete
- `/api/v1/me` endpoint returns user profile

---

### Milestone 4: Database Schema + Migrations
**Goal**: Create all database tables with proper indexes

**Steps**:
1. Create `users` table:
   - `supabase_uid` (string, unique, indexed)
   - `email` (string)
   - `created_at`, `updated_at`
2. Create `budgets` table:
   - `user_id` (foreign key)
   - `base_daily_cents` (integer, default 2000)
   - `currency` (string, default 'CAD')
   - `timezone` (string, default 'America/Toronto')
   - `created_at`, `updated_at`
3. Create `expenses` table:
   - `budget_id` (foreign key)
   - `date` (date)
   - `amount_cents` (integer)
   - `category` (string)
   - `note` (text, nullable)
   - `created_at`, `updated_at`
   - Index on `(budget_id, date)`
4. Create `day_ledgers` table:
   - `budget_id` (foreign key)
   - `date` (date)
   - `spent_cents` (integer, default 0)
   - `carryover_start_cents` (integer, default 0)
   - `carryover_end_cents` (integer, default 0)
   - `available_cents` (integer, default 0)
   - `created_at`, `updated_at`
   - Unique index on `(budget_id, date)`
5. Create models with validations and associations

**Deliverables**:
- All migrations created and run
- Models with associations and validations
- Database indexes in place

---

### Milestone 5: Core Business Logic (Ledger Recompute Service)
**Goal**: Implement deterministic ledger computation logic

**Steps**:
1. Create `Ledger::RecomputeFromDate` service object
2. Implement logic:
   - Ensure day_ledgers exist from `from_date` to today
   - For each date in chronological order:
     - Calculate `spent_cents` = sum of expenses for that date
     - Calculate `carryover_start_cents` = previous day's `carryover_end_cents` (or 0 if first day)
     - Calculate `available_cents` = `base_daily_cents` + `carryover_start_cents`
     - Calculate `carryover_end_cents` = `carryover_start_cents` + (`base_daily_cents` - `spent_cents`)
     - Upsert day_ledger record
3. Handle timezone correctly (use budget timezone)
4. Add unit tests for recompute logic
5. Test edge cases:
   - First day
   - Editing past expenses
   - Multiple edits on same day
   - Editing budget base_daily

**Deliverables**:
- `Ledger::RecomputeFromDate` service working correctly
- Unit tests passing
- Edge cases handled

---

### Milestone 6: API Endpoints
**Goal**: Create all REST API endpoints

**Steps**:
1. Create `Api::V1::MeController`:
   - `GET /api/v1/me` - return current user
2. Create `Api::V1::BudgetController`:
   - `GET /api/v1/budget` - get user's budget
   - `PATCH /api/v1/budget` - update budget settings
3. Create `Api::V1::DailyController`:
   - `GET /api/v1/daily/today` - today's summary
   - `GET /api/v1/daily?from=YYYY-MM-DD&to=YYYY-MM-DD` - date range ledger
4. Create `Api::V1::ExpensesController`:
   - `GET /api/v1/expenses?from=...&to=...` - list expenses
   - `POST /api/v1/expenses` - create expense
   - `PATCH /api/v1/expenses/:id` - update expense
   - `DELETE /api/v1/expenses/:id` - delete expense
5. Configure routes
6. Add strong parameters
7. Trigger ledger recompute after expense changes
8. Add request specs for key endpoints

**Deliverables**:
- All endpoints implemented
- Request specs passing
- JSON responses consistent (snake_case)

---

### Milestone 7: React App Setup + Supabase Auth
**Goal**: Initialize React app and implement authentication

**Steps**:
1. Create React app with Vite
2. Install dependencies:
   - `@supabase/supabase-js`
   - `react-router-dom`
   - `axios` or `fetch` wrapper
   - `tailwindcss` (optional, for styling)
3. Configure environment variables
4. Create Supabase client
5. Implement Google OAuth login
6. Store access token in memory/sessionStorage
7. Create API client with Authorization header
8. Handle 401 redirects to login
9. Create protected route wrapper

**Deliverables**:
- React app initialized
- Supabase auth working
- API client configured
- Login page functional

---

### Milestone 8: React Pages/Components
**Goal**: Build all user-facing pages

**Steps**:
1. **Login Page**:
   - Google sign-in button
   - Handle auth redirect
2. **Dashboard Page**:
   - Fetch today's summary from `/api/v1/daily/today`
   - Display: available_today, spent_today, carryover_start, carryover_end
   - List today's expenses
   - Quick add expense form
3. **History Page**:
   - Date range picker
   - Fetch ledger from `/api/v1/daily?from=...&to=...`
   - Display calendar/list of day ledgers
   - Click day to view expenses
4. **Settings Page**:
   - Fetch current budget from `/api/v1/budget`
   - Form to update: base_daily_cents, currency, timezone
   - Save updates
5. Create reusable components:
   - Expense form
   - Expense list item
   - Day ledger card
   - Loading states
   - Error handling

**Deliverables**:
- All pages implemented
- Components reusable
- UI functional (styling minimal but clean)

---

### Milestone 9: Testing and Validation Checklist
**Goal**: Ensure everything works end-to-end

**Steps**:
1. Test authentication flow:
   - Google login works
   - Token stored correctly
   - Rails verifies token
   - 401 on invalid token
2. Test budget setup:
   - Create budget on first login
   - Update budget settings
3. Test expense CRUD:
   - Create expense
   - Edit expense
   - Delete expense
   - List expenses by date range
4. Test ledger computation:
   - Create expense today, verify ledger
   - Edit past expense, verify recompute
   - Delete expense, verify recompute
   - Change base_daily, verify recompute
5. Test timezone handling:
   - Create expense in user timezone
   - Verify "today" respects timezone
6. Test edge cases:
   - Negative carryover
   - Multiple expenses same day
   - Expenses spanning date range
7. Performance check:
   - Fast reads for today summary
   - Fast calendar queries

**Deliverables**:
- All tests passing
- End-to-end flow working
- Edge cases handled
- Performance acceptable

---

## PART 2: SUPABASE SETUP INSTRUCTIONS

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign in or create account
3. Click "New Project"
4. Fill in:
   - Project name: "Daily Budget App" (or your choice)
   - Database password: (save this securely)
   - Region: Choose closest to you
5. Wait for project to be created (2-3 minutes)

### Step 2: Enable Google OAuth Provider
1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Click to enable it
4. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Copy **Client ID** and **Client Secret**
5. Back in Supabase, paste Client ID and Client Secret
6. Save

### Step 3: Get Supabase Credentials
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret, server-side only)

### Step 4: Get Database Connection String
1. Go to **Settings** → **Database**
2. Under **Connection string**, select **URI**
3. Copy the connection string (looks like: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
4. Or get individual values:
   - **Host**: `db.[PROJECT-REF].supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: (the one you set during project creation)

### Step 5: Get JWT Secret for Rails Verification
1. Go to **Settings** → **API**
2. Scroll to **JWT Settings**
3. Copy **JWT Secret** (this is what Rails will use to verify tokens)
4. Alternatively, you can use JWKS URL: `https://<your-project-ref>.supabase.co/.well-known/jwks.json`

**For MVP, we'll use the JWT Secret approach** (simpler for server-side verification).

### Step 6: Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:5173` (React dev server)
   - `http://localhost:3000` (if using different port)
   - Your production URL when ready

### Security Notes:
- ✅ **SUPABASE_ANON_KEY**: Safe to expose in frontend (has RLS policies)
- ✅ **SUPABASE_URL**: Safe to expose in frontend
- ❌ **SUPABASE_SERVICE_ROLE_KEY**: NEVER expose to frontend (bypasses RLS)
- ✅ **JWT_SECRET**: Server-side only (Rails uses this to verify tokens)

---

## PART 3: BACKEND (RAILS API) IMPLEMENTATION

[See implementation files below]

---

## PART 4: FRONTEND (REACT) IMPLEMENTATION

[See implementation files below]

---

## PART 5: DEV WORKFLOW & RUN INSTRUCTIONS

[See implementation files below]

---

## Next Steps After Plan
1. Set up Supabase project following Part 2
2. Implement Rails backend (Part 3)
3. Implement React frontend (Part 4)
4. Test end-to-end (Part 5)
5. Deploy to production (future milestone)

