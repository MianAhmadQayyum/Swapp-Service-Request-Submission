# Admin Panel — User Management, Teams, Suppliers, Issue Types

The admin panel (`/dashboard/admin`) is accessible only to users with `role = 'admin'`. It provides UI and server actions for managing all configurable data in the system.

---

## File Structure

```
src/app/dashboard/admin/
├── page.js             # Server: admin guard + data fetch + layout
├── actions.js          # All admin server actions
├── AdminUsers.js       # Client: user role/team/disable management
├── AdminSimpleList.js  # Client: generic add/delete list (used for teams + suppliers)
└── AdminIssueTypes.js  # Client: create/update SLA/delete issue types
```

---

## Access Guard

The page is a server component that checks the role before rendering:

```js
// page.js
const profile = await getProfile(user.id);
if (!canAccessAdmin(profile.role)) redirect("/dashboard");
```

All server actions in `actions.js` also start with `requireAdmin()`:

```js
async function requireAdmin() {
  const { data: { user } } = await getCachedUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { supabase: null, error: "Forbidden" };
  return { supabase, error: null };
}
```

This means even if someone calls an admin action directly, the DB check prevents execution.

---

## User Management (`AdminUsers.js`)

Shows a table of all profiles. Per row:

- **Role select** — changes role immediately via `updateProfileRole(userId, role)`. Disabled for own row.
- **Team select** — only enabled when role is `team_member`. Changes team via `updateProfileTeam(userId, teamId)`. Shows a warning badge if `team_member` has no team set.
- **Revoke / Restore button** — toggles `profiles.disabled` via `revokeUserAccess(userId)` / `restoreUserAccess(userId)`.

### Server actions for users

| Action | What it does |
|---|---|
| `updateProfileRole(userId, role)` | Sets `profiles.role` for the given user |
| `updateProfileTeam(userId, teamId)` | Sets `profiles.team_id` for the given user |
| `revokeUserAccess(userId)` | Sets `profiles.disabled = true`; blocks dashboard access on next load |
| `restoreUserAccess(userId)` | Sets `profiles.disabled = false` |

Note: `revokeUserAccess` blocks self-revoke (returns error if `userId === currentUser.id`).

---

## Team & Supplier Management (`AdminSimpleList.js`)

Both teams and suppliers use the shared `AdminSimpleList` client component. It accepts:

| Prop | Type | Purpose |
|---|---|---|
| `items` | `{ id, label }[]` | Items to display in the list |
| `fieldName` | string | FormData key for the create input (`"name"` for teams, `"title"` for suppliers) |
| `placeholder` | string | Input placeholder text |
| `onCreate` | server action | Called with a `FormData` on add |
| `onDelete` | server action | Called with the item `id` on delete |

The server actions (`createTeam`, `deleteTeam`, `createSupplier`, `deleteSupplier`) are imported in `page.js` and passed as props — Next.js App Router supports passing server actions as props to client components.

### Server actions

| Action | What it does |
|---|---|
| `createTeam(formData)` | Inserts into `public.teams` |
| `deleteTeam(id)` | Deletes team; NULLs FK references via ON DELETE SET NULL |
| `createSupplier(formData)` | Inserts into `public.suppliers` |
| `deleteSupplier(id)` | Deletes supplier (fails if tickets reference it — ON DELETE RESTRICT) |

### Adding another simple list entity

Pass `onCreate` and `onDelete` server actions as props to `AdminSimpleList`. No new component needed.

---

## Issue Type Management (`AdminIssueTypes.js`)

- **Add issue type** — form with `title` + optional `sla_resolution_hours_limit` → `createIssueType(formData)`
- **Edit SLA** — per-row inline input for SLA hours; saves on blur → `updateIssueTypeSla(id, slaHours)`
- **Delete issue type** — per-row delete button → `deleteIssueType(id)`

The `sla_resolution_hours_limit` is used in `get_ticket_stats()` to compute SLA compliance.

### Server actions for issue types

| Action | What it does |
|---|---|
| `createIssueType(formData)` | Inserts into `public.issue_types` with title + optional SLA hours |
| `updateIssueTypeSla(id, slaHours)` | Updates `sla_resolution_hours_limit` for an issue type |
| `deleteIssueType(id)` | Deletes issue type (will fail if tickets reference it via FK RESTRICT) |

---

## Adding a New Admin Section

To add a new configurable entity (e.g. "Categories"):

### 1. Database

Create a migration to add the table:

```sql
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_authenticated" ON public.categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "categories_all_admin" ON public.categories
  FOR ALL TO authenticated USING (get_my_role() = 'admin');
```

### 2. Server actions (`actions.js`)

Add CRUD actions following the same pattern as teams/suppliers:

```js
export async function createCategory(formData) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  const name = formData.get("name");
  const { error: dbError } = await supabase.from("categories").insert({ name });
  if (dbError) return { error: dbError.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}

export async function deleteCategory(id) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  const { error: dbError } = await supabase.from("categories").delete().eq("id", id);
  if (dbError) return { error: dbError.message };
  revalidatePath("/dashboard/admin");
  return { success: true };
}
```

### 3. Client component (`AdminCategories.js`)

Create a client component following the same pattern as `AdminTeams.js`. Import and call the server actions.

### 4. Admin page (`page.js`)

Fetch the categories in the parallel data fetch at the top of the page and pass to `<AdminCategories>`.
