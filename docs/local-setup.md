# Local Setup

## Prerequisites

- Node.js 20+
- npm 11+
- Supabase CLI

## Install

```bash
npm install
cp .env.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL_ALLOWLIST`
- `RATE_LIMIT_SALT`
- `CRON_SECRET`

Optional for CAPTCHA-gated auth:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Start Supabase locally

```bash
supabase start
supabase db reset
```

If you are applying migrations manually in a hosted Supabase project, make sure you also run:

- `/Users/tk/dev/project-one/supabase/migrations/20260308190000_abuse_protection.sql`

The included `supabase/config.toml` enables `supabase/seed.sql`, which creates:

- 10 ZIP-based communities
- 4 demo users
- example posts, comments, votes, reports, notifications, and moderation history

Demo credentials:

- `riverwatch@localboard.dev` / `password123`
- `moderator@localboard.dev` / `password123`
- `admin@localboard.dev` / `password123`

## Run the app

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Verification

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
```

If you have not configured Supabase yet, the public pages will still render with demo data, but authenticated mutations will return `503` until env vars are set.
