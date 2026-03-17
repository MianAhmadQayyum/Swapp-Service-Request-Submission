# Tickets — CRUD, Filters, and Data Flow

This directory handles ticket listing, creation, and detail/update.

---

## File Structure

```
src/app/dashboard/tickets/
├── page.js              # Server: paginated, filtered ticket list
├── loading.js           # Skeleton shown during streaming
├── actions.js           # Server actions: createTicket + saveTicket
├── TicketFilters.js     # Client: filter buttons + supplier/team dropdowns (uses setParam helper)
├── TicketTable.js       # Server: sortable table of tickets
├── new/
│   ├── page.js          # Server: permission guard + data fetch for new ticket form
│   └── NewTicketForm.js # Client: ticket creation form
└── [id]/
    ├── page.js          # Server: fetch ticket + relations

src/components/
├── StatusBadge.js       # Shared status badge (used by TicketTable + [id]/page)
└── ...

src/lib/utils.js         # formatDate — used by TicketTable and [id]/page
    └── TicketDetailClient.js  # Client: status/notes update form (team_member + admin only)
```

---

## Ticket Creation

### Permission guard (`new/page.js`)

Server component. Checks `canCreateTickets(profile.role)`. Redirects to `/dashboard/tickets` if the role cannot create tickets. Fetches all needed select data in parallel:

```js
const [suppliersRes, issueTypesRes, csAgentsRes, teamsRes] = await Promise.all([
  supabase.from("suppliers").select("id, title").order("title"),
  supabase.from("issue_types").select("id, title").order("title"),
  supabase.from("profiles").select("id, name").eq("role", "customer_support"),
  supabase.from("teams").select("id, name").order("name"),
]);
```

### Form (`NewTicketForm.js`)

Client component. Fields:

| Field | Required | Notes |
|---|---|---|
| Booking ID | Yes | Free text |
| Supplier | Yes | Dropdown from `suppliers` table |
| CS Agent | No | Dropdown from `profiles` where `role = customer_support` |
| Issue Category | Yes | Dropdown from `issue_types` table |
| Issue Description | Yes | Textarea |
| Assign to Team | No | Dropdown from `teams` table |
| Escalation Status | No | Yes/No select; defaults to No |
| Service Request | No | Yes/No select; shows car plate + odometer when Yes |
| Car Number Plate | Conditional | Only when service_request_status = true |
| Odometer | Conditional | Only when service_request_status = true |

On submit → calls `createTicket` server action. On success → navigates to ticket detail (admin/team_member) or tickets list (customer_support).

### Server action (`actions.js` → `createTicket`)

```
createTicket(formData)
  1. Verify user is authenticated
  2. Extract and validate required fields
  3. Build ticket object (car_plate + odometer only if service_request_status)
  4. supabase.from("tickets").insert(ticket)
  5. revalidatePath("/dashboard") + revalidatePath("/dashboard/tickets")
  6. Return { success: true, ticketId } or { error }
```

---

## Ticket List

### Page (`page.js`)

Server component. Reads URL search params:

| Param | Purpose | Default |
|---|---|---|
| `filter` | Filter key from `FILTERS` constant | `all` |
| `supplier` | Supplier UUID to filter by | — |
| `team` | Team UUID (admin only) | — |
| `sort` | Column: `created_at`, `booking_id`, `status` | `created_at` |
| `dir` | `asc` or `desc` | `desc` |
| `page` | Page number (1-indexed) | `1` |

Pagination: 25 tickets per page.

**Role-based query scoping (in addition to RLS):**

```js
// customer_support — own tickets only
if (role === "customer_support") query = query.eq("created_by", user.id);

// team_member — team-assigned tickets only
if (role === "team_member") query = query.eq("assignee_team_id", profile.team_id);

// admin — all tickets (no additional filter)
```

Joins fetched in one query:
```
suppliers(title)
issue_types!issue_category_id(title)
teams!assignee_team_id(name)
```

### Table (`TicketTable.js`)

Server component. Columns: Booking ID (clickable link, full-row clickable via CSS overlay), Issue Type + Supplier, Status badge, Team, Flags (escalated / service request badges), Created date.

Sort links toggle `asc`/`desc` by updating the URL search params.

### Filters (`TicketFilters.js`)

Client component. Uses `useSearchParams` + `router.push` to update filter params without a full page navigation. Resets `page` to `1` on any filter change.

Filter buttons are defined in `src/lib/constants/tickets.js` (`FILTERS` array). The supplier and team dropdowns are separate selects that append `?supplier=` or `?team=` to the URL.

---

## Ticket Detail & Update

### Page (`[id]/page.js`)

Server component. Fetches the ticket by ID with full joins:

```
tickets
  suppliers(title)
  issue_types!issue_category_id(title)
  profiles!cs_agent_id(name)          -- CS agent name
  teams!assignee_team_id(name)         -- Assigned team name
```

Renders the full ticket detail view. Passes `canUpdate = canUpdateTicket(profile.role)` to `TicketDetailClient`.

### Update form (`TicketDetailClient.js`)

Client component. Only rendered if `canUpdate = true` (admin and team_member). Fields: status select + notes textarea + Save/Cancel buttons.

Calls `saveTicket(ticketId, status, notes)` server action. On success → navigates to `/dashboard/tickets`.

### Server action (`actions.js` → `saveTicket`)

```
saveTicket(ticketId, status, notes)
  1. Verify user is authenticated
  2. Build update object: { status, notes, updated_at: new Date() }
  3. If status === "resolved" → set resolved_at = now()
  4. If status !== "resolved" → clear resolved_at (set to null)
  5. supabase.from("tickets").update(...).eq("id", ticketId)
  6. revalidatePath for dashboard and tickets
  7. Return { success: true } or { error }
```

---

## Adding a New Ticket Field

### 1. Database migration

```sql
-- supabase/migrations/0XX_add_my_field.sql
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS my_field text;
```

### 2. Creation form (`NewTicketForm.js`)

Add the form input. Include the field name in the `formData` passed to `createTicket`.

### 3. Server action — `createTicket`

Extract from formData and add to the insert object:

```js
const my_field = formData.get("my_field") || null;
// ...
const ticket = { ..., my_field };
```

### 4. Ticket detail (`[id]/page.js` + `TicketDetailClient.js`)

Add the field to the SELECT query and display it in the detail view.

### 5. Update action — `saveTicket` (if the field should be editable)

Add the field to `saveTicket` parameters and the update object.

### 6. Table (`TicketTable.js`) — optional

Add a new column if the field should appear in the list view. Update the query in `page.js` to include it in the SELECT.
