# Quick Start Guide

This is a condensed version of the setup. For detailed instructions, see `SETUP_GUIDE.md`.

## Prerequisites
- Ruby 3.2.0+
- Node.js 18+
- Supabase account

## 1. Supabase Setup (5 minutes)

1. Create project at [supabase.com](https://supabase.com)
2. Enable Google OAuth in Authentication → Providers
3. Get credentials from Settings → API:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_JWT_SECRET`
4. Get database credentials from Settings → Database

## 2. Backend Setup (2 minutes)

```bash
cd daily_budget_api
bundle install
cp .env.example .env
# Edit .env with your Supabase credentials
bundle exec rails db:create db:migrate
bundle exec rails server
```

## 3. Frontend Setup (2 minutes)

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

## 4. Test

1. Open http://localhost:5173
2. Sign in with Google
3. Add an expense
4. Check the dashboard!

## Environment Variables Needed

### Backend (.env)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_JWT_SECRET=xxx
DB_HOST=db.xxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=xxx
CORS_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_API_BASE_URL=http://localhost:3000
```

## Troubleshooting

- **CORS errors**: Check `CORS_ORIGINS` in backend `.env`
- **JWT errors**: Verify `SUPABASE_JWT_SECRET` matches Supabase settings
- **DB errors**: Check database credentials in backend `.env`

For more help, see `SETUP_GUIDE.md`.

