# Deployment

## Vercel + Supabase

1. Create a Supabase project.
2. Run the SQL migration in `supabase/migrations/20260308110000_initial_schema.sql`.
3. Optionally run `supabase/seed.sql` against non-production preview environments.
4. Create a Vercel project from this repository.
5. Add the environment variables from `.env.example`.
6. In Supabase Auth settings, add:
   - `https://<your-vercel-domain>/auth/callback`
   - your preview callback URLs if needed
7. Configure a Vercel cron job to `POST /api/cron/trending` every 15 minutes and send `x-cron-secret: <CRON_SECRET>`.

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAIL_ALLOWLIST`
- `CRON_SECRET`

## Storage

- The migration creates a public `avatars` bucket.
- Users upload to `avatars/<auth.uid()>/<timestamp>.<ext>`.
- Storage policies restrict writes to the owner folder while keeping reads public.

## Rollout order

1. Deploy Supabase schema and storage policies.
2. Deploy the Next.js app to Vercel.
3. Verify signup, sign-in, posting, comment notifications, moderation actions, and cron-generated trending notifications in a preview environment.
