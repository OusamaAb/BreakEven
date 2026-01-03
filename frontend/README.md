# Daily Budget Frontend

React frontend for the Daily Budget App, built with Vite.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables (copy `.env.example` to `.env`):
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anon/public key
   - `VITE_API_BASE_URL`: Rails API URL (default: http://localhost:3000)

3. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

- `src/pages/`: Page components (Login, Dashboard, History, Settings)
- `src/components/`: Reusable components (Layout, ExpenseForm)
- `src/lib/`: Utilities (Supabase client, API client)

