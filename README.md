# Swapp Service Request Management Platform

Internal ticketing platform for Customer Support and Operations to log, assign, and track service requests with SLA monitoring.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

- Create a project at [supabase.com](https://supabase.com).
- In **SQL Editor** → New query, run the entire contents of:
  - `supabase/migrations/001_swapp_schema.sql`
- In **Authentication** → Providers, enable **Email** (and optionally disable “Confirm email” for local testing).
- Copy **Project URL** and **anon key** (and **service role key** for admin features) into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. First admin user

New signups get the **Customer Support** role by default. To make the first user an admin:

1. Sign up once via the app.
2. In Supabase **SQL Editor** run:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users order by created_at asc limit 1);
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in and use **Dashboard** → **Tickets** and **Admin** (if you are admin/operations manager).

## Roles

| Role                 | Can create tickets | Can see tickets        | Can update status / assign | Admin (users, SLA, suppliers) |
|----------------------|--------------------|------------------------|----------------------------|------------------------------|
| Customer Support     | Yes                | Own                    | Own                        | No                           |
| Operations           | No                 | Assigned to me         | Assigned                   | No                           |
| Operations Manager   | No                 | All                    | All                        | View only (no user management) |
| Admin                | Yes                | All                    | All                        | Full                         |

## Features

- **Ticket creation**: Booking ID, supplier, issue type, priority, description, customer name/contact, number plate.
- **Ticket lifecycle**: New → Assigned → In progress → Waiting on supplier/customer → Resolved → Closed.
- **Assignment**: Manual (admin/operations manager) or leave unassigned.
- **SLA**: Rules per issue type (hours). Deadline set on create; breach can be marked manually; “SLA breaching soon” filter (e.g. &lt; 30 min).
- **Filters**: Pending, Assigned to me, SLA breaching soon, High priority, By supplier.
- **Internal notes**: Add notes on ticket detail; view history.
- **Reporting** (operations manager / admin): Volume, resolved within SLA, breached count, avg resolution time, by issue type, by supplier.
- **Admin**: Manage users (roles), suppliers, issue types, SLA rules.

## Notifications

Email/Slack notifications (new assignment, SLA breach warning, status updates) are not implemented in this repo. Add them via Supabase Edge Functions, a cron job, or your preferred provider (e.g. Resend, Slack API).
