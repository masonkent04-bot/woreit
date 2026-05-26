# WoreIt

A family closet & outfit tracker. Snap photos of every item, log what you wore, and let your family see (and react to) your outfits.

## Features

- Photo-based closet management with wear tracking (New / Light / Frequent / Heavy)
- Outfit logging — tap items you wore, calendar auto-tracks
- Cost-per-wear calculation
- AI outfit builder (favors underworn items + occasion)
- Family group with read-only viewing of each other's closets
- PWA — installable on iOS/Android home screen
- Magic-link + Google sign-in via Supabase Auth

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind v4
- Supabase (Postgres + Auth + Storage + RLS)
- TypeScript
- Deployed on Vercel

## Local development

```bash
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Database

Schema lives in Supabase project `bqyivqogixglaaggxgmn`. RLS is enabled on every table — family members can read each other's closets, only owners can write.
