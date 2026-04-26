# HablaBeat backend (Supabase)

Greenfield Supabase setup for accounts, classes, assignments, and progress.

## One-time setup

1. Create a Supabase project (free tier is fine).
2. Copy `.env.local.example` → `.env.local` in the repo root and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (only if you later need privileged scripts)
3. Run the migration in the Supabase SQL editor (or via `supabase db push`):
   - `supabase/migrations/0001_init.sql` — schema + RLS policies + auth trigger
4. Run the seed:
   - `supabase/seed.sql` — populates the `activity` catalog (50 songs × 2 modes = 100 rows)
5. In Supabase Auth → Providers, enable **Email** (magic link is the default; password works too).

## What you get

- `app_user`, `class`, `membership`, `activity`, `user_progress`, `assignment`, `assignment_activity`
- RLS policies that enforce:
  - Users see/edit only their own progress.
  - Teachers can read (not write) progress of users in classes they teach.
  - Class members see assignments + memberships of their class.
  - Anyone authenticated can create a class — they become its teacher automatically.
- Trigger that creates an `app_user` row on first sign-up (mirrors `auth.users`).

## Server entry points

- `lib/server/auth.ts` — `getCurrentUser()`, `requireUser()`
- `lib/server/progress.ts` — `startActivity`, `updateProgress`, `completeActivity`, `getUserProgress`
- `lib/server/class.ts` — `createClass`, `joinClass`, `getClassStudents`, `getClassProgress`
- `lib/server/assignment.ts` — `createAssignment`, `getAssignmentProgress`

## API surface

```
GET    /api/me/progress
POST   /api/activities/:id/start
PATCH  /api/activities/:id/progress       { progressPercent }
POST   /api/activities/:id/complete       { score?, xp? }

GET    /api/classes
POST   /api/classes                       { name }
POST   /api/classes/join                  { joinCode }
GET    /api/classes/:id/students[?withProgress=1]

POST   /api/assignments                   { classId, title, dueAt?, activityIds }
GET    /api/assignments/:id/progress
```

## Wiring HablaBeat gameplay

The DDR/Practice components currently persist scores to localStorage. To migrate:

1. After sign-in, fetch `/api/me/progress` and merge into the existing localStorage shape.
2. On `handleDDRGameEnd` (in `app/page.tsx`), call `POST /api/activities/song-{N}-play/complete` with `{ score, xp }`.
3. Mirror for Practice mode under `song-{N}-practice`.
4. Recall-break results stay client-side for now, or fold them into the parent activity's `xp`.

This is intentionally NOT auto-wired yet — keep localStorage as the source of truth until the auth flow is in.
