# RESQNET Production Foundation

Disaster-response coordination and planning prototype for **Team No Free Lunch** (Problem Statement EL-02).

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Database & Auth**: Supabase JS Client (Hosted Supabase Database & Auth)
- **Deployment**: Vercel (SPA routing configured via `vercel.json`)

---

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env` (or set environment variables in Vercel):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-anon-key
```

> ⚠️ Never commit database service keys or secret keys to Git. `VITE_` variables are public client credentials.

### 2. SQL Migration
In your Supabase Dashboard -> **SQL Editor**, run the migration script located at:
`supabase/migrations/20260930000000_create_scenarios.sql`

This creates the `public.scenarios` table with strict Row Level Security (RLS) allowing only authenticated owners to `SELECT` and `INSERT` their own draft scenarios.

### 3. Run Locally
```bash
npm install
npm run dev
```

---

## Verification Checklist

- [ ] `npm run lint` (TypeScript verification) completes with 0 errors.
- [ ] `npm run build` generates production assets in `dist/`.
- [ ] Home page renders RESQNET branding, EL-02 tag, and Sign In link.
- [ ] Missing Supabase environment variables display setup notice banner without app crash.
- [ ] Sign In / Sign Up form handles authentication and shows clear feedback if email confirmation is required.
- [ ] Signed-in user can navigate to `/workspace`, enter a title, create a scenario draft, and list saved drafts from Supabase `public.scenarios`.
- [ ] Refreshing `/login` or `/workspace` on Vercel works seamlessly via `vercel.json` SPA rewrite rule.