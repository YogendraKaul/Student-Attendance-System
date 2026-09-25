# Student Attendance Management System

A web app for managing student attendance — role-based dashboards (Principal / Teacher / Student), class & student management, attendance marking, attendance history, and Excel export.

## Tech stack

- Vite + TypeScript + React
- React Router, TanStack React Query, React Hook Form + Zod
- Tailwind CSS + shadcn-ui
- Supabase (Auth + Postgres)
- xlsx (Excel export)

## Prerequisites

- Node.js 20+ and npm

## Getting started

```sh
# 1. Clone the repo
git clone <YOUR_GIT_URL>
cd Student-Attendance-System

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# then edit .env and set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# 4. Start the dev server
npm run dev
```

Open http://localhost:8080/

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start dev server (http://localhost:8080) |
| `npm run build`   | Production build to `dist/`              |
| `npm run preview` | Preview the production build locally     |
| `npm run lint`    | Run ESLint                               |

## Environment variables

| Variable                         | Required | Description                  |
| -------------------------------- | -------- | ---------------------------- |
| `VITE_SUPABASE_URL`              | Yes      | Your Supabase project URL    |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | Yes      | Your Supabase anon/public key |

See `.env.example` for the template. `.env` is git-ignored.

### Demo mode (no backend needed)

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are missing, the app
automatically runs in **offline demo mode**: auth + data are served from seeded
mock data stored in the browser's localStorage. No Supabase project required.

On the login page you'll see a **"Try the live demo"** panel with one-click
logins:

| Role      | Email                | Password |
| --------- | -------------------- | -------- |
| Principal | principal@demo.local | demo     |
| Teacher   | teacher@demo.local   | demo     |
| Student   | student@demo.local   | demo     |

Use **Reset demo data** on the login page to restore the seed data.
This is the easiest way to share a live portfolio link — deploy without setting
env vars and visitors can log in instantly.

## Project structure

```
src/
  pages/          # Routes: Index, Auth, Dashboard, TakeAttendance, ViewAttendance, ClassesStudents, RoleSelect
  components/     # UI + dashboards (Principal/Teacher/Student) + shadcn-ui
  integrations/supabase/  # Supabase client, auth provider, generated types
  hooks/ lib/     # Shared hooks and utilities
```

## Notes

- Uses `npm` (`package-lock.json`). Do not add a `bun.lockb`.
- The Supabase anon key is a publishable key, but it is kept in `.env` (not committed) so forks use their own project.
