# Supabase — Database Schema, Auth, and Policies

This document is the authoritative reference for the database structure. The actual SQL lives in `supabase/migrations/`. This document reflects the **final state after all 16 migrations**.

---

## Tables

### `public.profiles`

One row per authenticated user. Created automatically by the `on_auth_user_created` trigger.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | | FK → `auth.users(id)` ON DELETE CASCADE |
| `name` | text | | Full display name |
| `email` | text | | Copied from `auth.users` on signup |
| `role` | `user_role` enum | `customer_support` | See enum values below |
| `team_id` | uuid nullable | | FK → `teams(id)` ON DELETE SET NULL |
| `disabled` | boolean | `false` | If true, user is blocked from the dashboard |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | |

### `public.teams`

Operational teams that tickets are assigned to.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text NOT NULL UNIQUE | |

Seeded: Operations, Logistics, Supply, Debt Collection, Charging Team.

### `public.suppliers`

Car rental / service suppliers used in ticket creation.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text NOT NULL UNIQUE | |
| `created_at` | timestamptz | |

Seeded with 21+ real supplier names (e.g. Thrifty DXB, Dollar DXB, Swapp-Avis…).

### `public.issue_types`

Issue categories with optional SLA resolution limits.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `title` | text NOT NULL UNIQUE | |
| `sla_resolution_hours_limit` | numeric nullable | Hours; must be > 0; NULL means no SLA for this type |
| `created_at` | timestamptz | |

Seeded with 28+ categories.

### `public.tickets`

Core entity. Every service request is a ticket.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | | |
| `booking_id` | text NOT NULL | | Customer booking reference |
| `supplier_id` | uuid NOT NULL | | FK → `suppliers(id)` ON DELETE RESTRICT |
| `issue_category_id` | uuid NOT NULL | | FK → `issue_types(id)` ON DELETE RESTRICT |
| `issue_description` | text NOT NULL | | |
| `cs_agent_id` | uuid nullable | | FK → `profiles(id)` ON DELETE SET NULL |
| `assignee_team_id` | uuid nullable | | FK → `teams(id)` ON DELETE SET NULL |
| `status` | `ticket_status` enum | `in_progress` | See enum below |
| `escalation_status` | boolean NOT NULL | `false` | |
| `service_request_status` | boolean NOT NULL | `false` | |
| `car_plate` | text nullable | | Only relevant when `service_request_status = true` |
| `odometer` | text nullable | | Only relevant when `service_request_status = true` |
| `notes` | text nullable | | Free-text notes (single field; no history) |
| `created_by` | uuid NOT NULL | | FK → `auth.users(id)` ON DELETE RESTRICT |
| `resolved_at` | timestamptz nullable | | Set when status → `resolved`; cleared on un-resolve |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | |

---

## Dropped Tables (historical reference)

These tables existed in early migrations and were removed:

| Table | Removed in | Replaced by |
|---|---|---|
| `public.sla_rules` | 009 | `issue_types.sla_resolution_hours_limit` |
| `public.ticket_attachments` | 009 | (removed, not replaced) |
| `public.ticket_updates` | 010 | `tickets.notes` (single text field) |

---

## Enums

### `public.user_role`

```sql
'customer_support'   -- default for new signups
'team_member'        -- operations / team users
'admin'              -- full access
```

### `public.ticket_status`

```sql
'in_progress'            -- default on creation
'waiting_for_supplier'
'waiting_for_customer'
'resolved'
```

> **Note on Postgres enums:** You can ADD values (`ALTER TYPE ... ADD VALUE '...'`) but cannot remove or rename values without dropping and recreating the type (which requires dropping dependent columns first). Plan enum values carefully.

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies are defined per table and operation.

### `public.teams`

| Operation | Who | Condition |
|---|---|---|
| SELECT | All authenticated | Always |
| INSERT / UPDATE / DELETE | Admin only | `get_my_role() = 'admin'` |

### `public.profiles`

| Operation | Who | Condition |
|---|---|---|
| SELECT | Own row | `auth.uid() = id` |
| SELECT | Admin | All rows |
| UPDATE | Own row | `auth.uid() = id` (but trigger blocks role/team changes) |
| UPDATE | Admin | All rows |
| INSERT | Service role only | Used by the signup trigger |

### `public.suppliers`

| Operation | Who | Condition |
|---|---|---|
| SELECT | All authenticated | Always |
| INSERT / UPDATE / DELETE | Admin only | `get_my_role() = 'admin'` |

### `public.issue_types`

| Operation | Who | Condition |
|---|---|---|
| SELECT | All authenticated | Always |
| INSERT / UPDATE / DELETE | Admin only | `get_my_role() = 'admin'` |

### `public.tickets`

| Operation | Who | Condition |
|---|---|---|
| INSERT | `customer_support` | `created_by = auth.uid()` |
| INSERT | `admin` | `created_by = auth.uid()` |
| SELECT | `admin` | All tickets |
| SELECT | `customer_support` | `created_by = auth.uid()` |
| SELECT | `team_member` | `assignee_team_id = get_my_team_id()` |
| UPDATE | Same as SELECT | Same conditions as SELECT |

> The application also adds explicit `WHERE` clauses to ticket queries (defense-in-depth). This means access is restricted by both RLS and query-level filtering.

---

## Database Functions

### `get_my_role()` → `user_role`

`STABLE, SECURITY DEFINER` — Returns the current authenticated user's role from `public.profiles`. Used in RLS policies.

```sql
SELECT get_my_role();
```

### `get_my_team_id()` → uuid

`STABLE, SECURITY DEFINER` — Returns the current user's `team_id`. Used in the `team_member` RLS policy on tickets.

### `handle_new_user()` (trigger function)

Fires `AFTER INSERT ON auth.users`. Reads `role`, `team_id`, `full_name` from `raw_user_meta_data`. Validates role against the enum (defaults to `customer_support` if invalid). Inserts a row into `public.profiles`. Uses `ON CONFLICT (id) DO UPDATE SET email` for idempotency.

### `prevent_role_team_self_update()` (trigger function)

Fires `BEFORE UPDATE ON public.profiles`. If the current user is not an admin and is trying to update their own `role` or `team_id`, the trigger raises an exception. This prevents privilege escalation.

### `get_ticket_stats(p_team_id uuid DEFAULT NULL)` → jsonb

`SECURITY INVOKER` — Respects the caller's RLS. Returns aggregated stats for the dashboard:

| Field | Description |
|---|---|
| `total` | Total ticket count |
| `in_progress` | Count with status `in_progress` |
| `waiting_for_supplier` | Count with status `waiting_for_supplier` |
| `waiting_for_customer` | Count with status `waiting_for_customer` |
| `resolved` | Count with status `resolved` |
| `tickets_with_sla` | Tickets whose issue type has an SLA limit set |
| `within_sla` | Resolved before the SLA deadline |
| `breached_sla` | Exceeded the SLA deadline (resolved late OR still open past deadline) |
| `breached_unresolved` | Exceeded deadline AND still open |
| `avg_resolution_hours` | Average hours from created_at to resolved_at (1 decimal place) |
| `by_supplier` | `{ supplier_title: count }` object |
| `by_issue_type` | `{ issue_type_title: count }` object |

When `p_team_id` is provided, all counts are scoped to tickets with `assignee_team_id = p_team_id`.

---

## Indexes

| Index name | Table | Columns | Condition |
|---|---|---|---|
| `idx_tickets_status` | tickets | status | — |
| `idx_tickets_assignee_team_id` | tickets | assignee_team_id | WHERE NOT NULL |
| `idx_tickets_created_at` | tickets | created_at DESC | — |
| `idx_tickets_created_by` | tickets | created_by | — |
| `idx_tickets_supplier_id` | tickets | supplier_id | WHERE NOT NULL |
| `idx_tickets_created_by_created_at` | tickets | (created_by, created_at DESC) | — |
| `idx_profiles_role` | profiles | role | — |
| `idx_profiles_team_id` | profiles | team_id | WHERE NOT NULL |

---

## Triggers

| Trigger name | Table | Timing | Function called |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER INSERT FOR EACH ROW | `handle_new_user()` |
| `profiles_protect_role` | `public.profiles` | BEFORE UPDATE FOR EACH ROW | `prevent_role_team_self_update()` |

---

## Adding a Migration

1. Create a new file: `supabase/migrations/0XX_description.sql` (increment the number).
2. Write idempotent SQL where possible (use `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, etc.).
3. Apply in Supabase SQL Editor, or via the Supabase CLI: `supabase db push`.
4. Update this document to reflect the new schema state.
5. Add an entry to `supabase/migrations/README.md`.

### Common migration patterns

```sql
-- Add a column
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS my_field text;

-- Add an enum value
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'new_status';

-- Add a new RLS policy
CREATE POLICY "policy_name" ON public.tickets
  FOR SELECT TO authenticated
  USING (get_my_role() = 'admin');

-- Drop a policy before replacing it
DROP POLICY IF EXISTS "old_policy_name" ON public.tickets;

-- Replace a DB function (recreate with CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.get_ticket_stats(...)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER AS $$
...
$$;
```
