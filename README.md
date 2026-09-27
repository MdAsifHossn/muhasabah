# Muhasabah — মুহাসাবাহ

**প্রতিদিনের আমল • আত্মপর্যালোচনা • ধারাবাহিকতা**

Muhasabah is a private, full-stack Islamic self-accountability application for daily Amal tracking and cycle-based personal review. It is designed around privacy, calm reflection, and consistent improvement—not public competition.

## Current scope

This repository currently contains the requested foundation milestone:

- Next.js App Router with strict TypeScript and Tailwind CSS
- shadcn/ui-compatible component configuration and initial primitives
- Prisma configured for MongoDB Atlas
- Better Auth email/password authentication
- Closed registration and server-verified protected dashboard
- Role-ready access helpers for `MEMBER`, `USTADH`, and `ADMIN`
- Core domain schema, indexes, and embedded daily Amal responses
- Bangladesh timezone and reusable cycle utilities
- Idempotent development seed with 30 initial Amal items, 7 members, 1 Ustadh, 1 admin, and an active cycle
- Responsive Bengali landing page, login page, and protected dashboard shell

Daily Amalnama mutations, history, leaderboard, and admin management are deliberately left for the next milestone.

## Technology

- Next.js 16 / React 19 / App Router
- TypeScript (strict)
- Tailwind CSS 4
- shadcn/ui conventions, Radix Slot, Lucide icons
- Prisma ORM 6 with MongoDB Atlas
- Better Auth
- Zod, date-fns, and `@date-fns/tz`

## Architecture

```text
prisma/
  schema.prisma        Database schema and indexes
  seed.ts              Development seed data
src/
  app/
    (auth)/login/      Login route
    api/auth/[...all]/ Better Auth route handler
    dashboard/         Server-protected application shell
    globals.css        Theme and Tailwind entrypoint
    page.tsx           Public landing page
  components/
    auth/              Focused client-side auth interaction
    layout/            Dashboard navigation
    ui/                shadcn-style primitives
  lib/
    auth.ts            Better Auth server configuration
    auth-client.ts     Better Auth browser client
    cycles.ts          Cycle queries and progress rules
    dates.ts           Asia/Dhaka date boundary utilities
    permissions.ts     Central server-side authorization
    prisma.ts          Shared Prisma client
  types/               Shared application types
  proxy.ts             Fast cookie-based route gate
```

Page components remain thin; authorization, dates, cycles, and future scoring rules live in domain modules under `src/lib`.

## Database models

### Authentication and people

- `User`: Better Auth user extended with role, active state, and joined date
- `Session`: authenticated sessions
- `Account`: credential provider records and password hashes
- `Verification`: future email/reset verification tokens

### Muhasabah domain

- `Cycle`: variable-duration review cycle with draft/active/completed/archived states
- `AmalItem`: admin-configurable item, category, input type, target, weight, order, and weekday applicability
- `DailyAmalEntry`: one entry per user, cycle, and normalized calendar date
- `AmalResponse`: embedded MongoDB composite values and server-calculated score snapshot
- `UstadhReview`: cycle/member/reviewer feedback with member-visibility control
- `Book` and `BookReadingLog`: Phase 2-ready reading tracker models

The compound unique constraint `userId + cycleId + date` prevents duplicate daily entries. Supporting indexes cover cycle/date reporting, user histories, reviews, and reading logs.

## Authentication, privacy, and permissions

Email/password authentication is handled by Better Auth. Public sign-up is disabled. Development users are created by the seed script with Better Auth-compatible password hashes.

Protection is layered:

1. `src/proxy.ts` rejects dashboard requests without a session cookie.
2. The dashboard server layout calls `requireUser()` and verifies the session against the database.
3. `requireRole()`, `requireAdmin()`, and `requireUstadhOrAdmin()` provide reusable server-side role checks.

The proxy is only an early gate; it is never treated as the authorization source of truth. Future mutations must obtain the current user from the server session and must never trust a browser-provided `userId` or score.

## Scoring strategy

Scoring is not implemented in this foundation milestone. The schema supports configurable points and numeric targets, and daily responses retain item-level score snapshots. The next milestone should add a single `src/lib/scoring.ts` module for item, day, cycle, and leaderboard calculations.

Temporary seed weights are intentionally simple:

- Boolean items: 1 point
- Numeric/target items and weekly Surah Al-Kahf: 2 points
- Numeric scoring should initially be proportional up to the target, never calculated in the client

These weights are placeholders until reviewed with the Ustadh.

## Cycle logic

Cycle duration is derived from `startDate` and `endDate`; 40 is not hardcoded in domain logic. `src/lib/cycles.ts` provides active-cycle lookup, inclusive progress, and date-range checks. The seed creates a 40-day example by setting the end date 39 days after the start date.

Only one active cycle is a current product rule, not yet a database-level MongoDB partial unique constraint. Activation must enforce this in a server action/transaction in the next milestone.

## Date and timezone strategy

The application timezone is centralized as `Asia/Dhaka` in `src/lib/dates.ts`. Daily boundaries, display dates, and cycle day numbers must use these helpers. A `DailyAmalEntry.date` must be normalized to the start of the Bangladesh calendar day before it is persisted.

Never derive a member-facing date by slicing a UTC ISO string.

## Local setup

Requirements:

- Node.js 20.19+ (recommended because current cryptography dependencies require it)
- npm
- A MongoDB Atlas deployment with a replica set (Atlas provides this by default)

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MongoDB Atlas URL including database name |
| `BETTER_AUTH_SECRET` | Yes | Random secret of at least 32 characters |
| `BETTER_AUTH_URL` | Yes | Canonical app URL; locally `http://localhost:3000` |
| `SEED_ADMIN_EMAIL` | Seed only | Optional development admin email |
| `SEED_ADMIN_PASSWORD` | Seed only | Optional shared development seed password |

Do not commit `.env` or real credentials.

## Development seed accounts

The default development-only password is `ChangeMe123!` unless `SEED_ADMIN_PASSWORD` is set.

- Admin: `admin@muhasabah.local` (or `SEED_ADMIN_EMAIL`)
- Ustadh: `ustadh@muhasabah.local`
- Members: `member1@muhasabah.local` through `member7@muhasabah.local`

These are fake local credentials. Change them or remove the seeded users before any production deployment.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

Database schema validation/generation:

```bash
npm run db:generate
```

## Known limitations

- The dashboard shell has no mobile drawer yet.
- Sign-out UI is not yet added.
- Daily entry save/submit and edit-lock rules are not implemented.
- No score engine, history, leaderboard, or admin CRUD screens yet.
- No invitation workflow or password reset email provider yet.
- The single-active-cycle rule must be enforced by the upcoming activation action.
- Book tracking and Ustadh review UI remain Phase 2, though their schema is prepared.

## Next milestone

1. Add centralized validation, scoring, and editable-day policy modules.
2. Build server actions for draft/save/submit with server-calculated totals.
3. Build mobile-first category-based Daily Amalnama and history.
4. Add dashboard summaries, progress, and privacy-safe leaderboard.
5. Add admin member, Amal item, and cycle management with role checks.
6. Add mobile navigation, sign-out, empty/error/loading states, and automated tests.

## Longer roadmap

Detailed category analytics, Ustadh review workflows, book tracking, notifications, invitations, exports, configurable scoring rules, multiple groups, and Ramadan-specific cycles belong after the core Amalnama flow is stable.
