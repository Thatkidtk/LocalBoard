# Architecture

LocalBoard is a Next.js App Router application with a Supabase-backed data layer.

- Frontend: server-rendered pages with client components for mutations, voting, auth, notifications, and moderation actions.
- Backend: Next.js route handlers under `app/api/*` implement the write surface for posts, comments, votes, reports, notifications, admin actions, and trending cron execution.
- Persistence: Supabase Postgres stores communities, profiles, posts, comments, votes, reports, notifications, and moderation actions. Realtime is enabled through table subscriptions in the client-ready architecture, and the schema includes triggers to keep scores, hot ranking, comment counts, karma, and reply notifications in sync.
- Auth: Supabase Auth handles email/password signup and login. Profiles are bootstrapped on first authenticated server request using user metadata.
- Demo mode: if Supabase env vars are absent, read paths fall back to deterministic mock data so the UI can still render and smoke tests can run.
