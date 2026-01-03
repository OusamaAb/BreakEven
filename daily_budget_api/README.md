# Daily Budget API

Rails API-only backend for the Daily Budget App.

## Setup

1. Install dependencies:
   ```bash
   bundle install
   ```

2. Configure environment variables (copy `.env.example` to `.env`):
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_JWT_SECRET`: JWT secret from Supabase settings
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection details
   - `CORS_ORIGINS`: Comma-separated list of allowed origins

3. Set up database:
   ```bash
   bundle exec rails db:create
   bundle exec rails db:migrate
   ```

4. Start the server:
   ```bash
   bundle exec rails server
   ```

## Testing

```bash
bundle exec rspec
```

## API Documentation

See main README.md for API endpoint documentation.

