# BreakEven

BreakEven is a daily allowance and carryover budget tracking web application I built to help manage daily spending with a simple, powerful concept: any money you don't spend today carries over to tomorrow, allowing you to save up for larger purchases or recover from overspending.

## What is BreakEven?

BreakEven helps you set a daily spending budget and automatically tracks how much you have left each day. The unique feature is the carryover system - if you spend less than your daily allowance, the leftover money carries forward to the next day. If you overspend, you'll have less available tomorrow. This creates a natural incentive to stay within your budget while giving you flexibility when needed.

You can track expenses by category, view your spending history, and adjust your budget at any time. The app handles timezone differences, so your daily budget resets at midnight in your local time zone.

## Key Features

**Daily Budget Tracking**: Set your daily spending allowance and see exactly how much you have left to spend each day.

**Smart Carryover System**: Unspent money automatically carries over to the next day, allowing you to save up for larger purchases or recover from overspending.

**Expense Management**: Add, edit, and delete expenses with categories and notes. Track expenses for the current day or add them retroactively in your history.

**Historical Budget Rates**: When you change your daily budget, the app remembers what budget was in effect on each day, so you can see how your budget evolved over time.

**Monthly Reset Option**: Choose between continuous carryover (great for long-term savings) or monthly reset mode (fresh start each month).

**Flexible Budget Changes**: When you update your budget, you can choose to apply it starting today, apply it to all history, or set a custom start date.

**Google Authentication**: Secure login using Google OAuth through Supabase Auth - no passwords to remember.

**Timezone Support**: The app respects your timezone settings, so your daily budget resets at midnight in your local time.

**Beautiful, Modern UI**: A clean, dark-themed interface with smooth animations and an intuitive user experience.

## Tech Stack

I built BreakEven using a modern, production-ready tech stack:

**Backend**: Ruby on Rails (API-only mode)
- Rails serves as the source of truth for all business logic
- RESTful API architecture
- JWT token verification for authentication
- Service objects for complex business logic (like ledger recomputation)

**Frontend**: React with Vite
- Modern React with hooks
- Component-based architecture
- Responsive design with custom styling
- Client-side routing

**Database**: Supabase PostgreSQL
- Managed PostgreSQL database
- Reliable, scalable infrastructure
- Direct connection for production workloads

**Authentication**: Supabase Auth
- Google OAuth integration
- JWT token-based authentication
- Secure session management
- ES256 signature verification

## Architecture & Design Decisions

**Rails as Source of Truth**: All business logic, calculations, and data integrity rules live in the Rails backend. The frontend is purely presentational.

**Pre-computed Ledgers**: Daily ledger calculations (available budget, carryover, etc.) are pre-computed and stored in the database for fast reads. When expenses change, the ledger is recomputed from that date forward to maintain correctness.

**Historical Budget Rates**: Budget changes are tracked with effective dates, so the app knows what budget was in effect on any given day. This allows for accurate historical reporting even when budgets change over time.

**Integer Cents for Money**: All monetary values are stored as integers (cents) to avoid floating-point precision issues.

**Timezone-Aware Dates**: All date calculations respect the user's timezone setting, ensuring daily budgets reset at the correct time.

## Services & Platforms

**Supabase**: I use Supabase for two critical services:
- **PostgreSQL Database**: Managed database hosting with automatic backups and scaling
- **Authentication Service**: Handles Google OAuth, JWT token generation, and user session management

**Google OAuth**: Users sign in with their Google account, providing a seamless authentication experience without managing passwords.

## Project Structure

The project is organized into two main directories:
- `daily_budget_api/`: The Rails API backend containing all business logic, models, controllers, and database migrations
- `frontend/`: The React frontend application with components, pages, and API integration

## Getting Started

To run BreakEven locally, you'll need:
- Ruby 3.2.0 or higher
- Node.js 18 or higher
- A Supabase account and project
- PostgreSQL client libraries

You'll need to set up environment variables for both the backend and frontend, configure Supabase with Google OAuth, and run database migrations. The backend runs on port 3000, and the frontend runs on port 5173.

## API Overview

The backend provides RESTful API endpoints for:
- User profile management
- Budget configuration and updates
- Daily ledger queries (today's summary and date ranges)
- Expense CRUD operations

All endpoints require authentication via JWT tokens obtained through Supabase Auth.

## Database Schema

The database includes:
- **users**: Stores user information linked to Supabase Auth UIDs
- **budgets**: User budget settings including daily allowance, currency, timezone, and carryover mode
- **budget_rates**: Historical budget rates with effective dates for accurate historical reporting
- **expenses**: Individual expense records with date, amount, category, and notes
- **day_ledgers**: Pre-computed daily ledger entries for fast dashboard and history queries

## Security

Security was a priority in building BreakEven:
- All sensitive credentials are stored in environment variables, never in code
- JWT tokens are verified server-side with proper signature validation
- API endpoints require authentication
- Database credentials are never exposed to the frontend
- CORS is configured to allow only trusted origins

## Future Considerations

BreakEven is designed to be easily deployable. The architecture supports:
- Horizontal scaling of the Rails API
- Database connection pooling for high traffic
- Environment-specific configurations for development, staging, and production
- Proper error handling and logging

## License

MIT License - feel free to use this project as a learning resource or as a starting point for your own budget tracking application.
