# SantaSwap website

Vue frontend + Express API backed by Render Postgres.

## Local setup

1. Create `server/.env` from `server/.env.example` and set:

   ```env
   DATABASE_URL=postgresql://USERNAME:PASSWORD@YOUR_DB_HOST/santaswap
   JWT_SECRET=long-random-string
   ```

2. Install and migrate:

   ```bash
   npm install
   npm --prefix server install
   npm run db:migrate
   ```

3. Run the API and website together:

   ```bash
   npm run dev:all
   ```

   - Website: http://localhost:5173  
   - API: http://localhost:3001 (`/api` is proxied by Vite)

## Production

- Deploy the `server/` folder as a **Render Web Service** (`npm start`, Node).
- Set the same env vars there (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`).
- On the static host for the Vue app, set `VITE_API_URL` to that Render API URL, then rebuild.

Never put `DATABASE_URL` or `JWT_SECRET` in `VITE_*` variables.
