# Setup Guide - Daily Budget App

This guide walks you through setting up the entire application from scratch.

## Prerequisites

Before starting, ensure you have:
- Ruby 3.2.0 or higher installed
- Node.js 18+ and npm/yarn installed
- A Supabase account (free tier is fine)
- Basic familiarity with terminal/command line

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in:
   - **Project name**: `daily-budget-app` (or your choice)
   - **Database password**: Create a strong password and **save it securely**
   - **Region**: Choose the closest region to you
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be created

### 1.2 Enable Google OAuth

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list and click on it
3. Toggle **"Enable Google provider"** to ON
4. You'll need Google OAuth credentials:

   **Get Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Go to **APIs & Services** → **Library**
   - Search for "Google+ API" and enable it
   - Go to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
   - Application type: **Web application**
   - Name: `Daily Budget App` (or your choice)
   - **Authorized redirect URIs**: 
     
     **How to find your project reference:**
     1. Go back to your Supabase dashboard
     2. Look at the URL in your browser - it will look like:
        `https://supabase.com/dashboard/project/abcdefghijklmnop`
     3. Or look at the **Settings** → **API** page - you'll see your Project URL like:
        `https://abcdefghijklmnop.supabase.co`
        (The part before `.supabase.co` is your project reference)
     
     **Enter the redirect URI in Google Cloud Console as:**
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
     
     **Example:** If your Supabase project URL is `https://xyzabcdefgh.supabase.co`, then enter:
     ```
     https://xyzabcdefgh.supabase.co/auth/v1/callback
     ```
   - Click **"Create"**
   - Copy the **Client ID** and **Client Secret**

5. Back in Supabase, paste the **Client ID** and **Client Secret**
6. Click **"Save"**

### 1.3 Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values and note where each one goes:

   **For Backend (Rails) `.env` file:**
   - **Project URL** → Copy this value
     - **Goes in**: `daily_budget_api/.env` as `SUPABASE_URL=`
     - **Example**: `SUPABASE_URL=https://xyzabcdefgh.supabase.co`
   
   - **JWT Secret** → Scroll down to **JWT Settings** section, copy the **JWT Secret**
     - **Goes in**: `daily_budget_api/.env` as `SUPABASE_JWT_SECRET=`
     - **Example**: `SUPABASE_JWT_SECRET=your-super-secret-jwt-key-here`
     - **⚠️ Important**: This is NOT the anon key or service role key - it's the JWT Secret specifically

   **For Frontend (React) `.env` file:**
   - **Project URL** → Copy this value (same as above)
     - **Goes in**: `frontend/.env` as `VITE_SUPABASE_URL=`
     - **Example**: `VITE_SUPABASE_URL=https://xyzabcdefgh.supabase.co`
   
   - **anon public** key → Copy the **anon public** key (not the service_role key!)
     - **Goes in**: `frontend/.env` as `VITE_SUPABASE_ANON_KEY=`
     - **Example**: `VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - **⚠️ Important**: Use the **anon public** key, NOT the service_role key

   **Not needed for this app (but keep secret if you copy it):**
   - **service_role** key → You don't need this for the app, but if you see it, keep it secret and never put it in frontend code

### 1.4 Get Database Connection Details

1. Go to **Settings** → **Database**
2. Under **Connection string**, you'll see the connection details. Copy these values:

   **All of these go in the Backend (Rails) `.env` file:**
   
   - **Host** → Copy the host value
     - **Goes in**: `daily_budget_api/.env` as `DB_HOST=`
     - **Example**: `DB_HOST=db.xyzabcdefgh.supabase.co`
   
   - **Port** → Usually `5432`
     - **Goes in**: `daily_budget_api/.env` as `DB_PORT=`
     - **Example**: `DB_PORT=5432`
   
   - **Database** → Usually `postgres`
     - **Goes in**: `daily_budget_api/.env` as `DB_NAME=`
     - **Example**: `DB_NAME=postgres`
   
   - **User** → Usually `postgres`
     - **Goes in**: `daily_budget_api/.env` as `DB_USER=`
     - **Example**: `DB_USER=postgres`
   
   - **Password** → The password you set when creating the Supabase project
     - **Goes in**: `daily_budget_api/.env` as `DB_PASSWORD=`
     - **Example**: `DB_PASSWORD=your-secure-password-here`
     - **⚠️ Important**: This is the password you created in step 1.1, not any auto-generated key

   **Alternative**: If you see a **Connection string (URI)** option, you can copy that entire string and use it as `DATABASE_URL=` in your `.env` file instead of the individual values above.

### 1.5 Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add this URL **exactly** (without trailing slash):
   - `http://localhost:5173`
3. Click **"Save"**
4. **⚠️ Important**: The redirect URL must match EXACTLY `http://localhost:5173` (no trailing slash, no path)

### 1.6 Credentials Summary

Here's a quick reference table of all credentials and where they go:

| Credential | Where to Find It | Goes In | Variable Name | File Location |
|------------|------------------|---------|---------------|---------------|
| Project URL | Settings → API → Project URL | Backend `.env` | `SUPABASE_URL` | `daily_budget_api/.env` |
| Project URL | Settings → API → Project URL | Frontend `.env` | `VITE_SUPABASE_URL` | `frontend/.env` |
| JWT Secret | Settings → API → JWT Settings | Backend `.env` | `SUPABASE_JWT_SECRET` | `daily_budget_api/.env` |
| anon public key | Settings → API → anon public | Frontend `.env` | `VITE_SUPABASE_ANON_KEY` | `frontend/.env` |
| Database Host | Settings → Database → Host | Backend `.env` | `DB_HOST` | `daily_budget_api/.env` |
| Database Port | Settings → Database → Port | Backend `.env` | `DB_PORT` | `daily_budget_api/.env` |
| Database Name | Settings → Database → Database | Backend `.env` | `DB_NAME` | `daily_budget_api/.env` |
| Database User | Settings → Database → User | Backend `.env` | `DB_USER` | `daily_budget_api/.env` |
| Database Password | The password from step 1.1 | Backend `.env` | `DB_PASSWORD` | `daily_budget_api/.env` |

**⚠️ Important Notes:**
- The **service_role** key should NEVER be used in frontend code - only use the **anon public** key
- The **JWT Secret** is different from the anon key - make sure you're copying the correct one
- The **Database Password** is the one you created in step 1.1, not any auto-generated key

## Part 2: Backend Setup (Rails API)

### 2.1 Install Dependencies

```bash
cd daily_budget_api
bundle install
```

If you don't have bundler:
```bash
gem install bundler
bundle install
```

### 2.2 Configure Environment Variables

**Step 1: Create the `.env` file from the template**

The `.env` file doesn't exist yet - you need to create it from the `.env.example` template file:

```bash
# Make sure you're in the daily_budget_api directory
cd daily_budget_api

# Copy the example file to create your .env file
cp .env.example .env
```

**Note:** The `.env.example` file should already exist in the `daily_budget_api` folder. If you can't see it in your file browser, it might be hidden - use the terminal command above to copy it. You can verify it exists by running `ls -la` in the `daily_budget_api` directory.

This creates a new file called `.env` that you can now edit with your actual credentials.

**Step 2: Edit the `.env` file with your Supabase credentials**

Open `daily_budget_api/.env` in a text editor (VS Code, nano, vim, or any text editor) and fill in the values you copied from Supabase. Replace the placeholder values with your actual credentials:

```env
# Supabase Configuration
# ⬇️ From step 1.3: Copy the Project URL from Settings → API
SUPABASE_URL=https://your-project-ref.supabase.co

# ⬇️ From step 1.3: Copy the JWT Secret from Settings → API → JWT Settings
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Database Configuration
# ⬇️ From step 1.4: Copy the Host from Settings → Database
DB_HOST=db.your-project-ref.supabase.co

# ⬇️ From step 1.4: Usually 5432
DB_PORT=5432

# ⬇️ From step 1.4: Usually postgres
DB_NAME=postgres

# ⬇️ From step 1.4: Usually postgres
DB_USER=postgres

# ⬇️ From step 1.4: The password you set when creating the Supabase project
DB_PASSWORD=your-database-password

# CORS Configuration (keep as is for local development)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rails Configuration (keep as is)
RAILS_ENV=development
PORT=3000
```

**Quick Reference - Where each value came from:**
- `SUPABASE_URL` → Step 1.3: Settings → API → Project URL
- `SUPABASE_JWT_SECRET` → Step 1.3: Settings → API → JWT Settings → JWT Secret
- `DB_HOST` → Step 1.4: Settings → Database → Host
- `DB_PORT` → Step 1.4: Settings → Database → Port (usually 5432)
- `DB_NAME` → Step 1.4: Settings → Database → Database (usually postgres)
- `DB_USER` → Step 1.4: Settings → Database → User (usually postgres)
- `DB_PASSWORD` → Step 1.1: The password you created when setting up the project

### 2.3 Set Up Database

```bash
# Create database
bundle exec rails db:create

# Run migrations
bundle exec rails db:migrate
```

If you get connection errors, double-check your database credentials in `.env`.

### 2.4 Start the Server

```bash
bundle exec rails server
```

The API should now be running on `http://localhost:3000`

**Test it**: Open `http://localhost:3000/api/v1/me` (should return 401 Unauthorized, which is expected without a token)

## Part 3: Frontend Setup (React)

### 3.1 Install Dependencies

```bash
cd frontend
npm install
```

### 3.2 Configure Environment Variables

**Step 1: Create the `.env` file from the template**

The `.env` file doesn't exist yet - you need to create it from the `.env.example` template file:

```bash
# Make sure you're in the frontend directory
cd frontend

# Copy the example file to create your .env file
cp .env.example .env
```

**Note:** The `.env.example` file should already exist in the `frontend` folder. If you can't see it in your file browser, it might be hidden - use the terminal command above to copy it. You can verify it exists by running `ls -la` in the `frontend` directory.

This creates a new file called `.env` that you can now edit with your actual credentials.

**Step 2: Edit the `.env` file with your Supabase credentials**

Open `frontend/.env` in a text editor (VS Code, nano, vim, or any text editor) and fill in the values you copied from Supabase. Replace the placeholder values with your actual credentials:

```env
# ⬇️ From step 1.3: Copy the Project URL from Settings → API (same as backend)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# ⬇️ From step 1.3: Copy the anon public key from Settings → API
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL (keep as is for local development)
VITE_API_BASE_URL=http://localhost:3000
```

**Quick Reference - Where each value came from:**
- `VITE_SUPABASE_URL` → Step 1.3: Settings → API → Project URL (same value as backend `SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` → Step 1.3: Settings → API → anon public key (NOT the service_role key!)
- `VITE_API_BASE_URL` → Keep as `http://localhost:3000` (this is where your Rails backend runs)

### 3.3 Start the Development Server

```bash
npm run dev
```

The frontend should now be running on `http://localhost:5173`

## Part 4: Testing the Application

1. Open `http://localhost:5173` in your browser
2. You should see the login page
3. Click **"Sign in with Google"**
4. Complete Google OAuth flow
5. You should be redirected back to the dashboard
6. Try adding an expense and see the ledger update!

## Troubleshooting

### CORS Errors

**Problem**: Frontend can't connect to backend API

**Solution**: 
- Check that `CORS_ORIGINS` in Rails `.env` includes your frontend URL
- Make sure Rails server is running
- Check browser console for specific error messages

### JWT Verification Errors

**Problem**: "Invalid or expired token" errors

**Solution**:
- Verify `SUPABASE_JWT_SECRET` in Rails `.env` matches the JWT secret from Supabase
- Make sure you're using the JWT secret, not the anon key
- Check that the token is being sent in the Authorization header

### Database Connection Errors

**Problem**: Can't connect to Supabase database

**Solution**:
- Verify all database credentials in Rails `.env`
- Check that your Supabase project is active
- Ensure your IP is allowed (Supabase allows all IPs by default, but check if you have restrictions)

### Google OAuth Not Working

**Problem**: Google login redirects but doesn't complete

**Solution**:
- Verify redirect URL in Google Cloud Console matches Supabase callback URL
- Check that redirect URLs are configured in Supabase
- Ensure Google+ API is enabled in Google Cloud Console

### "Budget not found" Errors

**Problem**: API returns "Budget not found"

**Solution**:
- This is normal on first login - the budget should be created automatically
- If it persists, check Rails logs for errors
- Try accessing `/api/v1/budget` endpoint directly

## Next Steps

- Customize the base daily allowance in Settings
- Add expenses and watch the carryover calculation
- View history to see past days
- Test editing past expenses to see ledger recompute

## Production Deployment

For production deployment:
1. Set up production environment variables
2. Build the React app: `npm run build`
3. Deploy Rails API to a hosting service (Heroku, Railway, etc.)
4. Deploy React frontend to a static hosting service (Vercel, Netlify, etc.)
5. Update CORS_ORIGINS and redirect URLs for production domains

## Support

If you encounter issues:
1. Check the browser console for frontend errors
2. Check Rails server logs for backend errors
3. Verify all environment variables are set correctly
4. Ensure Supabase project is active and credentials are correct

