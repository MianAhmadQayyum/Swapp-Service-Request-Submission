# src/lib — Auth, Supabase Clients, and Constants

This directory contains the core infrastructure shared across the app: Supabase client factories, session middleware, role definitions, and ticket constants.

---

## Directory Structure

```
src/lib/
├── supabase/
│   ├── client.js       # Browser Supabase client (for client components)
│   ├── server.js       # Server Supabase client + getCachedUser + getCachedProfile
│   └── middleware.js   # Session refresh logic used in Next.js middleware
├── constants/
│   ├── roles.js        # Role enum values + permission helper functions
│   └── tickets.js      # Ticket statuses, filter definitions, filter appliers
└── utils.js            # Shared utilities (formatDate, …)
```

---

## Auth Flow

### Sign-up

1. User fills the `/signup` form: name, email, password, role, (optional) team.
2. Client calls `supabase.auth.signUp({ email, password, options: { data: { full_name, role, team_id } } })`.
3. Supabase inserts a row in `auth.users`.
4. The `on_auth_user_created` database trigger fires `handle_new_user()`, which reads `raw_user_meta_data` and inserts a row into `public.profiles` with the role and team_id.
5. User is redirected to `/dashboard`.

> **Role validation in the trigger:** The trigger validates the role value against the `user_role` enum. Invalid values fall back to `customer_support`.

### Sign-in

1. User submits `/signin` form.
2. Client calls `supabase.auth.signInWithPassword({ email, password })`.
3. On success, redirected to `/dashboard`.

### Session Management (Middleware)

- `src/middleware.js` is the Next.js middleware entry point. It imports and calls `updateSession` from `src/lib/supabase/middleware.js`.
- On every request, `updateSession` refreshes the Supabase Auth session cookie if it is expiring soon.
- For `/dashboard/**` paths: if there is no active session, the user is redirected to `/signin`.

### Sign-out

- `SignOutButton` (client component) calls `supabase.auth.signOut()` and redirects to `/signin`.

### Disabled Users

- `profiles.disabled = true` blocks dashboard access even if the auth session is valid.
- The dashboard layout (`src/app/dashboard/layout.js`) checks this flag server-side and calls `supabase.auth.signOut()` + redirects if true.
- This does **not** invalidate the Supabase Auth token immediately — it only blocks dashboard access on the next request.

---

## Supabase Client Factories

### `client.js` — Browser client

```js
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

Use in **client components** only (`"use client"`). Created with `createBrowserClient` from `@supabase/ssr`. Uses the public anon key.

Used in: `signin/page.js`, `signup/page.js`, `src/components/SignOutButton.js`.

### `server.js` — Server client

```js
import { createClient, getCachedUser } from "@/lib/supabase/server";
const supabase = await createClient();
const { data: { user } } = await getCachedUser();
```

Use in **server components and server actions**. Created with `createServerClient` from `@supabase/ssr`, wired to `next/headers` cookies for session propagation.

**`getCachedUser()`** — wraps `supabase.auth.getUser()` in React `cache()`. Deduplicates the auth call when both layout and page server components call it in the same render pass.

**`getCachedProfile()`** — wraps the `public.profiles` DB fetch in React `cache()`. Selects `role, team_id, name, disabled, teams(name)`. Every server component (layout, page, etc.) in the same request calls this and gets the same result — only one DB query is made. Returns `null` if there is no authenticated user.

```js
import { getCachedProfile } from "@/lib/supabase/server";
const profile = await getCachedProfile();
const role = profile?.role ?? DEFAULT_ROLE;
```

### `middleware.js` — Session refresher

Called only from `src/middleware.js`. Not used directly in components. Uses `supabase.auth.getSession()` (not `getUser()`) for performance — middleware should not verify the JWT with every request.

---

## Role System (`constants/roles.js`)

### Enum values (must match `public.user_role` DB enum)

```js
"customer_support"   // Can create tickets; sees only own tickets
"team_member"        // Can update tickets; sees only team-assigned tickets; has stats
"admin"              // Full access; all tickets; admin panel
```

### Permission helpers

```js
canCreateTickets(role)   // → true for customer_support and admin
canViewDashboard(role)   // → true for admin and team_member (shows stats)
canAccessAdmin(role)     // → true for admin only
isTeamMember(role)       // → true for team_member only
canUpdateTicket(role)    // → true for admin and team_member
```

These helpers are used in server components to decide what to render and whether to redirect. They are also implicitly enforced by RLS at the database level.

### `ROLES` array

Used to populate the role dropdown in the signup form and admin user management:

```js
[
  { value: "customer_support", label: "Customer Support" },
  { value: "team_member",      label: "Team Member" },
  { value: "admin",            label: "Admin" },
]
```

### `ROLE_LABELS` map

Used to display a user's role in the UI. `team_member` maps to `null` — the UI shows the team name instead.

---

## Adding a New Role

This requires changes in 4 places:

### 1. Database — add to the enum

```sql
-- Create a new migration file: supabase/migrations/0XX_new_role.sql
ALTER TYPE public.user_role ADD VALUE 'new_role_name';
```

> Postgres enums can only be extended (values added), not modified. Values cannot be removed once added without dropping and recreating the enum.

### 2. Database — update RLS policies

Review the policies in `supabase/README.md` (or the latest migration). Add appropriate SELECT/INSERT/UPDATE policies for the new role on `public.tickets` and any other tables as needed.

### 3. `constants/roles.js`

- Add the value + label to the `ROLES` array.
- Add the display label to `ROLE_LABELS`.
- Add or update permission helper functions (`canCreateTickets`, `canUpdateTicket`, etc.) to include the new role where appropriate.

### 4. Application logic

- In `dashboard/layout.js`: handle any redirects or special cases.
- In `dashboard/tickets/page.js`: add a scoping clause to the ticket query if the new role should only see a subset.
- In server actions: adjust `requireAdmin()` or add a new guard function if needed.

---

## Ticket Status System (`constants/tickets.js`)

### Status values (must match `public.ticket_status` DB enum)

```
in_progress           → "In Progress"         (amber)
waiting_for_supplier  → "Awaiting — Supplier"  (purple)
waiting_for_customer  → "Awaiting — Customer"  (cyan)
resolved              → "Resolved"             (emerald)
```

### Filter system

`FILTERS` is an array of filter objects with `key`, `label`, and a matching function. `FILTER_APPLY` maps each filter key to a function that receives a Supabase query builder and applies the correct `.eq()` or `.in()` constraint.

### Adding a New Ticket Status

This requires changes in 3 places:

### 1. Database — add to the enum

```sql
-- New migration: supabase/migrations/0XX_new_status.sql
ALTER TYPE public.ticket_status ADD VALUE 'new_status';
```

Also update `get_ticket_stats()` if you want the new status counted in the stats RPC (see `supabase/README.md`).

### 2. `constants/tickets.js`

- Add to `STATUS_OPTIONS` array (used in the status update dropdown).
- Add a filter entry to `FILTERS` if you want a filter button for this status.
- Add to `FILTER_APPLY` map.

### 3. `tickets/actions.js`

If the new status should trigger side effects (like setting `resolved_at`), update the `saveTicket` server action.
