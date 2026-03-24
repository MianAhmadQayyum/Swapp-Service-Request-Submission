# Migration History

All schema changes are applied via numbered SQL files. Apply them in order (001 → latest) when setting up a new environment.

---

## Summary Table

| # | File | Key change |
|---|---|---|
| 001 | `001_swapp_schema.sql` | Initial schema |
| 002 | `002_cs_ticket_fields.sql` | CS agent fields + seeded data |
| 003 | `003_team_assigned.sql` | Team assignment text column |
| 004 | `004_signup_user_type.sql` | Signup trigger reads role from metadata |
| 005 | `005_odometer_reading.sql` | Odometer field on tickets |
| 006 | `006_operations_team_tickets.sql` | Team-scoped RLS for operations |
| 007 | `007_backfill_profile_team.sql` | Data fix: align team names |
| 008 | `008_restore_profiles_role.sql` | Safety: restore role column |
| 009 | `009_schema.sql` | **Full v2 schema** (enums, teams, RLS, triggers) |
| 010 | `010_indexes.sql` | Performance indexes |
| 011 | `011_stats_rpc.sql` | `get_ticket_stats()` RPC with SLA + team filter |
| 012 | `012_fix_admin_policy_recursion.sql` | Fix profiles admin policy recursion via `get_my_role()` |
| 013 | `013_issue_types_catalog.sql` | Canonical `issue_types` titles + SLA hours; prune unused types |

---

## Detailed History

### 001 — Initial schema

Created the foundational tables and types:
- Enums: `user_role` (4 values: `customer_support`, `operations`, `operations_manager`, `admin`), `ticket_status` (7 values), `ticket_priority`
- Tables: `profiles`, `suppliers`, `issue_types`, `sla_rules`, `tickets`, `ticket_updates`, `ticket_attachments`
- RLS policies for all tables
- Triggers: `handle_new_user` (creates profile on signup), `set_ticket_sla_deadline` (computed SLA on insert)

### 002 — CS ticket fields

- Added `cs_agent` (text), `escalation_status` (boolean), `service_request_opened` (boolean) to tickets
- Seeded 21 supplier rows and 28 issue type rows

### 003 — Team assigned

- Added `team_assigned` text column to tickets (denormalized; later replaced by FK in 009)

### 004 — Signup user type

- Updated `handle_new_user` trigger to read `role` and `team` from `raw_user_meta_data`
- This allows the signup form to pass a role that gets applied to the profile automatically

### 005 — Odometer reading

- Added `odometer_reading` text column to tickets

### 006 — Operations team tickets

- Added `get_my_team()` helper function
- Added RLS policies so `operations` role can see tickets matching their team assignment

### 007 — Backfill profile team

- Data fix: normalised `profile.team` values to match the `team_assigned` values on tickets
- No schema change, only data update

### 008 — Restore profiles role

- Safety migration run after an incident where the `role` column was accidentally dropped
- Idempotent: checks for column existence before adding

### 009 — Full v2 schema — BREAKING

Consolidates all v2 changes into one file. Key changes:

- **`teams` table** — normalised teams; `team_assigned` text replaced with `assignee_team_id` uuid FK
- **`user_role` enum** — collapsed 4 → 3 values: removed `operations` and `operations_manager`, added `team_member`
- **`ticket_status` enum** — collapsed 7 → 4 values: kept `in_progress`, `waiting_for_supplier`, `waiting_for_customer`, `resolved`
- **SLA** — `sla_rules` table dropped; `sla_resolution_hours_limit` moved into `issue_types`
- **Dropped** — `ticket_attachments`, `ticket_updates`, `sla_rules`, `ticket_priority` enum, `priority`, `customer_name`, `customer_contact`, `sla_deadline`, `sla_breached`, `assigned_to`, `closed_at`
- **Added** — `cs_agent_id` (FK replacing text `cs_agent`), `car_plate`, `odometer` (renamed), `notes text`, `email`, `disabled boolean`
- **RLS rewritten** — complete new policy set using `get_my_role()` and `get_my_team_id()`
- **Triggers** — updated `handle_new_user` (captures email, team_id), added `prevent_role_team_self_update`

### 010 — Performance indexes

- Added `idx_tickets_created_by` and `idx_tickets_supplier_id` (partial, WHERE NOT NULL)
- Added `idx_tickets_created_by_created_at` composite index for paginated queries scoped by user

### 011 — Stats RPC

- Added `get_ticket_stats(p_team_id uuid DEFAULT NULL)` returning a jsonb object
- Returns: total, per-status counts, `tickets_with_sla`, `within_sla`, `breached_sla`, `breached_unresolved`, `avg_resolution_hours`, `by_supplier`, `by_issue_type`
- `p_team_id` filters all stats to a single team (used by admin dashboard team dropdown)
