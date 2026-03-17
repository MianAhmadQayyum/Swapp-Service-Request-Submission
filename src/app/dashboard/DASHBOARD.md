# Dashboard — Layout, Stats, and Permission Enforcement

The dashboard is the protected main app. Every route under `/dashboard` requires an authenticated session.

---

## File Structure

```
src/app/dashboard/
├── layout.js               # Server: auth guard, profile fetch, nav shell
├── page.js                 # Server: dashboard home (stats + team filter)
├── loading.js              # Skeleton loader shown during server component streaming
├── DashboardReports.js     # Server: fetches get_ticket_stats() RPC
├── DashboardReportsClient.js # Client: renders stat cards and breakdown lists
├── DashboardTeamFilter.js  # Client: team filter dropdown (admin only)
├── tickets/                # See TICKETS.md
└── admin/                  # See ADMIN.md

src/components/
└── SignOutButton.js         # Client: calls supabase.auth.signOut() — shared component
```

---

## Layout (`layout.js`)

The layout is a **server component** that wraps every dashboard route. It:

1. Calls `getCachedUser()` to get the authenticated user.
2. If no user → redirects to `/signin`.
3. Fetches `public.profiles` row for the user (role, name, team_id, disabled).
4. If `profile.disabled === true` → signs out + redirects to `/signin`.
5. Renders the nav header (with the user's name/team) and passes `children`.

The profile is fetched once in the layout and passed to child components as props where needed. This avoids duplicate DB calls across layout + page.

### Nav links rendered by role

| Link | Shown to |
|---|---|
| Dashboard | Everyone |
| Tickets | Everyone |
| New Ticket | `canCreateTickets(role)` = customer_support + admin |
| Admin | `canAccessAdmin(role)` = admin only |

---

## Dashboard Home (`page.js`)

A server component. Reads the `?team=` query param (uuid) from the URL.

- Passes `teamId` to `<DashboardReports>` (stats component)
- Renders `<DashboardTeamFilter>` (only for admin) — a client dropdown that updates the URL

### Stats visibility

Stats are rendered inside a `<Suspense>` boundary. The `DashboardReports` server component calls the `get_ticket_stats` RPC. If the user is a `team_member`, the RLS inside the RPC automatically scopes results to their team. If admin, results are global (or scoped to `p_team_id` if provided).

`customer_support` users see the dashboard page but no stats widget.

---

## Stats Components

### `DashboardReports.js` (server)

Calls `supabase.rpc("get_ticket_stats", { p_team_id: teamId || null })`. Returns `null` on error. Passes all fields to `DashboardReportsClient`.

### `DashboardReportsClient.js` (client)

Renders stat cards in three rows:

| Row | Cards |
|---|---|
| 1 | Total tickets, Open (all non-resolved), Resolved, Avg Resolution Time |
| 2 | In Progress, Waiting — Supplier, Waiting — Customer |
| 3 | Resolved Within SLA (%), Breached SLA (%), Breached SLA Still Open (count) |

Plus two breakdown lists: **By Supplier** and **By Issue Type**.

### `DashboardTeamFilter.js` (client)

A `<select>` dropdown populated with all teams. On change, pushes `?team=<uuid>` to the URL using `router.push`. Only rendered for `admin` role.

---

## Permission Enforcement Pattern

Permissions are enforced at two independent layers:

### Layer 1 — Server component / server action guard

Every page and action starts with an auth check:

```js
// In a server component (page.js):
const { data: { user } } = await getCachedUser();
if (!user) redirect("/signin");

const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
if (!canAccessAdmin(profile.role)) redirect("/dashboard");
```

```js
// In a server action:
async function requireAdmin() {
  const { data: { user } } = await getCachedUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile.role !== "admin") return { error: "Forbidden" };
  return { supabase };
}
```

### Layer 2 — Database RLS policies

Even if the application-level check is bypassed, RLS prevents unauthorised reads/writes at the database level. See [`supabase/README.md`](../../supabase/README.md#row-level-security) for the full policy list.

---

## Revalidation

Server actions call `revalidatePath` from `next/cache` directly after mutations. There is no shared helper — each action file handles its own revalidation inline:

```js
import { revalidatePath } from "next/cache";

// After a ticket mutation:
revalidatePath("/dashboard");
revalidatePath("/dashboard/tickets");

// After an admin-only mutation:
revalidatePath("/dashboard/admin");
```

This clears the Next.js server-side cache and triggers a fresh data fetch on the next request.
