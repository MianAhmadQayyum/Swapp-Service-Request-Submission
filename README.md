# Swapp Internal Ticketing System

Internal service request management platform for Customer Support and Operations teams to log, assign, and track service requests with SLA monitoring.

**Stack:** Next.js 16 (App Router) · React 19 · Supabase (PostgreSQL + Auth) · Tailwind CSS v4

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Then open .env.local and fill in your Supabase project URL and keys.
# Find them in: Supabase dashboard → Project Settings → API
```

### 3. Apply database migrations

In the Supabase **SQL Editor**, run each file under `supabase/migrations/` in order (001 → 016).
See [`supabase/README.md`](supabase/README.md) for details.

### 4. Create your first admin

New signups default to the `customer_support` role. Promote the first user to admin via SQL:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);
```

### 5. Run the app

```bash
npm run dev   # http://localhost:3000
```

---

## Architecture Overview

```
src/
├── middleware.js           # Next.js middleware: session refresh + /dashboard auth guard
├── app/                    # Next.js App Router — pages + server actions
│   ├── signin/             # Email/password sign-in (client component)
│   ├── signup/             # Registration with role + team selection (client component)
│   └── dashboard/          # Protected app shell
│       ├── tickets/        # Ticket list, creation, detail
│       └── admin/          # Admin panel: users, teams, suppliers, issue types
├── components/             # Shared UI components (SignOutButton, Spinner, …)
└── lib/
    ├── supabase/           # Client factories (browser, server, service-role) + middleware
    └── constants/          # Role helpers, ticket statuses, filter logic

supabase/
└── migrations/             # 16 numbered SQL migrations (source of truth for schema)
```

### Core Design Principles

1. **No API routes** — All mutations use Next.js Server Actions. There is no `app/api/` directory.
2. **Defense-in-depth access control** — RLS policies (database level) AND application-level role checks (server components + server actions) enforce permissions independently.
3. **Server-first rendering** — Data fetching happens in server components; client components handle interactivity only.
4. **`cache()` for auth** — `getCachedUser()` deduplicates `auth.getUser()` across layout + page within a single request.

---

## User Roles

| Role | Label shown | Create tickets | View stats | Update tickets | Admin panel |
|---|---|---|---|---|---|
| `customer_support` | "Customer Support" | Yes | No | No | No |
| `team_member` | Their team's name | No | Yes | Yes (own team only) | No |
| `admin` | "Admin" | Yes | Yes (all teams) | Yes | Yes |

Role logic lives in [`src/lib/constants/roles.js`](src/lib/constants/roles.js).

---

## Ticket Lifecycle

```
customer_support creates ticket → status: in_progress
                                        ↕
                             waiting_for_supplier
                                        ↕
                             waiting_for_customer
                                        ↓
                                    resolved
```

- Created by `customer_support` or `admin`
- Assigned to a team (not an individual)
- `team_member` users update status and notes for tickets assigned to their team
- `admin` can view/update any ticket

---

## Key Features

- **Ticket creation** — Booking ID, supplier, issue category, description, CS agent, assigned team, escalation flag, service request flag (+ car plate + odometer)
- **Ticket management** — Status updates, free-text notes
- **SLA tracking** — Per issue-type SLA hours; breach computed in the `get_ticket_stats()` RPC
- **Dashboard stats** — Total, open, resolved, avg resolution time, SLA %, by supplier, by issue type
- **Team filter** — Admins filter stats by team via `?team=<uuid>` query param
- **Admin panel** — Manage users (role/team/enable/disable), teams, suppliers, issue types + SLA

---

## Documentation Index

| Document | What it covers |
|---|---|
| [`src/lib/AUTH_AND_CONSTANTS.md`](src/lib/AUTH_AND_CONSTANTS.md) | Auth flow, Supabase clients, roles, statuses, how to add new roles/statuses |
| [`src/app/dashboard/DASHBOARD.md`](src/app/dashboard/DASHBOARD.md) | Dashboard layout, stats, team filter, permission enforcement |
| [`src/app/dashboard/tickets/TICKETS.md`](src/app/dashboard/tickets/TICKETS.md) | Ticket CRUD, filters, adding new ticket fields |
| [`src/app/dashboard/admin/ADMIN.md`](src/app/dashboard/admin/ADMIN.md) | Admin panel, user management, adding new admin actions |
| [`supabase/DATABASE_SCHEMA.md`](supabase/DATABASE_SCHEMA.md) | Full DB schema, enums, RLS policies, DB functions, how to migrate |
| [`supabase/migrations/MIGRATION_HISTORY.md`](supabase/migrations/MIGRATION_HISTORY.md) | Migration history — what each migration changed and why |
