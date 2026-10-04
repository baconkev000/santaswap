# SantaSwap Website

Website for **SantaSwap**, the Secret Santa app. It shares the mobile app's
Supabase backend (same auth, database, and Edge Functions).

## Routes

Public:

- `/` — landing page
- `/join?code=XXXXXXXXXX` — participant join flow (phone verification, then the participant's own assignment)
- `/login`, `/signup`
- `/privacy`, `/terms` — Privacy Policy and Terms (app-store and Twilio A2P 10DLC compliance)

Signed in (organizers):

- `/dashboard` (alias `/exchanges`) — My Exchanges
- `/exchanges/new` — create an exchange
- `/exchanges/:id` — manage participants, draw names, copy the invite link
- `/account`

## Stack

- Vue 3, Vite, TypeScript, Vue Router
- `@supabase/supabase-js` (auth, organizer data via RLS, Edge Functions)

## Environment

Copy `.env.example` to `.env.local` and use the **same** Supabase project URL and
publishable key as the mobile app:

```sh
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Set the same two variables in your hosting provider's build settings. Never put
Twilio credentials or the service-role key in `VITE_*` variables — they are bundled
into the public site.

## Backend requirements

The backend lives in the mobile repo (`supabase/`). The website needs:

- Migrations `20261004000000_group_invite_codes.sql`,
  `20261004120000_participant_verification.sql`, and
  `20261004130000_twilio_verify.sql` applied
- Edge Functions `draw-exchange` and `join-exchange` deployed
- Supabase Auth → URL Configuration: add `https://santaswap.us/dashboard` (and your
  local dev URL) to the redirect allow list for sign-up confirmation emails

## Setup

```sh
npm install
npm run dev
```

### Production build

```sh
npm run build
npm run preview
```

## Deployment notes

This is a static SPA. Hosting providers need an SPA fallback so routes like `/join`,
`/dashboard`, and `/privacy` resolve to `index.html`.

- Netlify / Cloudflare Pages: `public/_redirects`
- Vercel: `vercel.json`
