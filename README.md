# PropAgent CRM Lite

A lightweight CRM for a North Singapore property agent, with an AI agent
layer that drafts follow-ups, listing copy, and reminders — everything
customer-facing waits in **Approvals** for human sign-off before it goes out.

## Stack
Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth)

## v0.1 status
- [x] Login (Supabase Auth)
- [x] Dashboard shell + live stats
- [x] Customers (add + list leads)
- [x] Approvals queue (human-in-the-loop review)
- [ ] Properties, Listings, Calendar, Tasks (stubbed — next builds)
- [ ] Lead Agent + SOP execution (schema is in place, orchestration logic is next)

## First-time setup

1. **Database:** open your Supabase project → SQL Editor → New query → paste
   the contents of `supabase/schema.sql` → Run.
2. **Create your login:** Supabase → Authentication → Users → Add user →
   enter your email + a password. There is no public sign-up page by design
   (single-agent tool).
3. **Environment variables:** in Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase → Project Settings → API) under
   Project Settings → Environment Variables, then redeploy.

## Local development (optional)
```
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npm run dev
```
