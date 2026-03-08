# Architecture

LocalBoard is a Next.js App Router application with a Supabase-backed data layer.

- Frontend: server-rendered pages with client components for mutations, voting, auth, notifications, and moderation actions.
- Backend: Next.js route handlers under `app/api/*` implement the write surface for auth, settings, posts, comments, votes, reports, notifications, admin actions, and trending cron execution.
- Persistence: Supabase Postgres stores communities, profiles, posts, comments, votes, reports, notifications, moderation actions, rate-limit buckets, and content fingerprints. Realtime is enabled through table subscriptions in the client-ready architecture, and the schema includes triggers to keep scores, hot ranking, comment counts, karma, and reply notifications in sync.
- Auth: Supabase Auth handles email/password signup and login, but auth mutations are now proxied through app routes so LocalBoard can enforce CAPTCHA, IP throttling, and server-side policy checks before requests hit Supabase.
- Abuse protection: write routes enforce verified email, database-backed rate limits, hashed IP throttling, and duplicate-content / spam heuristics. The design is stateless at the app layer, which keeps it compatible with horizontally scaled Vercel deployments.
- Demo mode: if Supabase env vars are absent, read paths fall back to deterministic mock data so the UI can still render and smoke tests can run.
