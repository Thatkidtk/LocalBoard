This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# LocalBoard

LocalBoard is a full-stack location-based discussion forum built with Next.js, Tailwind CSS, and Supabase. Users choose a local community, browse a ZIP-specific board, create posts, comment in threads, vote on content, report issues, and receive in-app notifications.

## Stack

- Next.js App Router
- React 19
- Tailwind CSS 4
- Supabase Auth, Postgres, Storage
- Vercel-ready deployment path
- Vitest + Playwright test coverage

## Features

- ZIP-based community boards with nearby-community switching
- Email/password auth with Supabase
- Post categories: question, update, alert, discussion
- Threaded comments with voting
- Post and comment reporting
- Moderator queue and account suspension actions
- In-app notifications for replies and trending local posts
- Mobile-friendly responsive UI
- Demo-mode read path when Supabase env vars are not configured

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

To run with real Supabase services:

```bash
supabase start
supabase db reset
```

See the docs for more detail:

- [Local setup](/Users/tk/dev/project-one/docs/local-setup.md)
- [Architecture](/Users/tk/dev/project-one/docs/architecture.md)
- [Deployment](/Users/tk/dev/project-one/docs/deployment.md)
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
