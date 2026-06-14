# Agentboard

AI-agent-friendly project task management system.

## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Vercel Postgres (Neon) + Drizzle ORM
- NextAuth.js v5 (Google OAuth + API tokens)
- shadcn/ui + Tailwind CSS
- Linear SDK + Octokit (GitHub)

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:push` — push schema to database
- `npm run db:studio` — open Drizzle Studio

## API Routes
All under `/api/v1/`:
- `GET/POST /tasks` — list/create tasks
- `GET/PATCH/DELETE /tasks/:id` — task CRUD
- `GET/POST /boards` — list/create boards
- `GET/DELETE /boards/:id` — board detail/delete
- `GET/POST /agent` — agent self-info / batch ops
- `GET/POST /auth/token` — list/create API tokens
- `DELETE /auth/token?id=` — revoke token
- `POST /sync/linear` — push tasks to Linear
- `GET /sync/linear/status` — sync status

## Auth
- Humans: Google OAuth via NextAuth.js (session cookie)
- Agents: `Authorization: Bearer ab_xxxxx` header (API token)
- Tokens created via POST /api/v1/auth/token (requires session)

## Database
Schema in `src/lib/db/schema.ts`. Run `npm run db:push` to apply.
Migrations in `drizzle/migrations/`.
