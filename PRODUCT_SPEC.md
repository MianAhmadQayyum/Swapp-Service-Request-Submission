# Swapp — Service Request Submission: Product Spec

---

## Definitions

| Term | Meaning |
|---|---|
| **CS Agent** | A user with the `customer_support` role |
| **Team Member** | A user with the `team_member` role, assigned to one operational team |
| **Team** | An operational unit: Operations, Logistics, Supply, Debt Collection, or Charging Team |

---

## Role System

There are **3 roles** in the system. Teams (Logistics, Operations, etc.) are separate entities — a `team_member` user is assigned to exactly one team.

| Role | Description |
|---|---|
| `admin` | Full access to all tickets, dashboard stats, and admin panel |
| `customer_support` | Can create tickets; sees only their own tickets |
| `team_member` | Can view and update tickets assigned to their team; sees team-scoped dashboard stats |

---

## Teams

Teams are a separate table. A `team_member` is linked to one team via `team_id` on their profile.

- Operations
- Logistics
- Supply
- Debt Collection
- Charging Team

---

## Screens

### Create Ticket

**Access:** `customer_support`, `admin`

Fields:

| Field | Type | Notes |
|---|---|---|
| Booking ID | Text | Required |
| Supplier | Supplier (FK) | Required |
| CS Agent | User with `customer_support` role (FK) | Required |
| Issue Category | Issue Type (FK) | Required |
| Issue Description | Text | Required |
| Assign to Team | Team (FK) | Required |
| Escalated | Boolean (checkbox) | Default: false |
| Service Request Opened | Boolean (checkbox) | Default: false |
| Car Plate | Text | Only shown when service request is checked |
| Odometer Reading | Text | Only shown when service request is checked |

After creation:
- `admin` / `team_member` are redirected to the ticket detail page
- `customer_support` is redirected to the ticket list

---

### View All Tickets

**Access:** `admin`, `team_member`

- `admin` sees all tickets
- `team_member` sees only tickets assigned to their team

Filters available: All, Open, In Progress, Awaiting Supplier, Awaiting Customer, Resolved, Escalated

Additional filters for `admin`: by supplier, by team

Columns: Booking ID, Issue (category + supplier), Status, Team, Flags (Escalated / Service Req), Created date

Pagination: 25 tickets per page, sortable by Booking ID, Status, Created date

On clicking a ticket: opens the ticket detail page.

---

### Ticket Detail

**Access:** All roles (subject to their ticket visibility scope)

- All roles can view the full ticket details
- `admin` and `team_member` can update the ticket status and add/edit notes
- `customer_support` has read-only access (no update tab)

---

### Dashboard

**Access:** `admin`, `team_member`

- `admin` sees stats for all tickets (with optional team filter dropdown)
- `team_member` sees stats scoped to tickets assigned to their team

#### Stat Cards

| Card | Description |
|---|---|
| Total Tickets | Count of all tickets |
| Open Tickets | Count where status is `in_progress`, `waiting_for_supplier`, or `waiting_for_customer` |
| Resolved | Count where status is `resolved` |
| In Progress | Count where status is `in_progress` |
| Awaiting Supplier | Count where status is `waiting_for_supplier` |
| Awaiting Customer | Count where status is `waiting_for_customer` |
| Resolved Within SLA | % of SLA-tracked tickets resolved before their SLA deadline |
| Breached SLA | % of SLA-tracked tickets where the deadline was missed |
| Breached SLA — Still Open | Count of tickets past their SLA deadline that are not yet resolved |
| Avg Resolution Time | Average hours from creation to resolution for resolved tickets |
| Tickets by Supplier | Breakdown of ticket count per supplier |
| Tickets by Issue Type | Breakdown of ticket count per issue category |

---

## DB Schema

### `tickets`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `booking_id` | `text` | |
| `status` | `ticket_status` enum | Default: `in_progress` |
| `supplier_id` | `uuid` FK → `suppliers.id` | |
| `cs_agent_id` | `uuid` FK → `profiles.id` | User with `customer_support` role |
| `issue_category_id` | `uuid` FK → `issue_types.id` | |
| `issue_description` | `text` | |
| `assignee_team_id` | `uuid` FK → `teams.id` | |
| `escalation_status` | `boolean` | Default: `false` |
| `service_request_status` | `boolean` | Default: `false` |
| `car_plate` | `text` | Nullable |
| `odometer` | `text` | Nullable |
| `notes` | `text` | Nullable; free-text field for team updates |
| `created_by` | `uuid` FK → `profiles.id` | The CS agent who created the ticket |
| `created_at` | `timestamptz` | Auto-set |
| `resolved_at` | `timestamptz` | Set when status changes to `resolved` |

**`ticket_status` enum:** `in_progress`, `waiting_for_supplier`, `waiting_for_customer`, `resolved`

---

### `issue_types`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | |
| `sla_resolution_hours_limit` | `numeric` | Nullable; SLA window in hours |

---

### `suppliers`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `title` | `text` | |

---

### `teams`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | One of: Operations, Logistics, Supply, Debt Collection, Charging Team |

---

### `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | FK → `auth.users.id` |
| `name` | `text` | |
| `email` | `text` | Synced from `auth.users` |
| `role` | `user_role` enum | Default: `customer_support` |
| `team_id` | `uuid` FK → `teams.id` | Only set for `team_member` users |
| `disabled` | `boolean` | Default: `false`; blocks dashboard access without revoking auth token |

**`user_role` enum:** `admin`, `customer_support`, `team_member`
