-- ============================================================
-- Migration 009: Full schema (v2)
--
-- Covers:
--   - Teams table (replaces team text columns)
--   - user_role enum: 3 values (admin, customer_support, team_member)
--   - ticket_status enum: 4 values
--   - profiles: team_id FK, email, disabled flag
--   - tickets: assignee_team_id, cs_agent_id, boolean flags, notes column
--   - SLA on issue_types (replaces sla_rules table)
--   - ticket_updates table dropped (replaced by tickets.notes)
--   - RLS policies, helper functions, triggers, indexes
-- ============================================================


-- ============================================================
-- 1. Drop all existing RLS policies
-- ============================================================
drop policy if exists "Customer support can create tickets" on public.tickets;
drop policy if exists "CS and admin can create tickets" on public.tickets;
drop policy if exists "Users can view tickets by role" on public.tickets;
drop policy if exists "Operations and above can update tickets" on public.tickets;
drop policy if exists "Team and admin can update tickets" on public.tickets;
drop policy if exists "Admin can assign any ticket" on public.tickets;
drop policy if exists "Users can read ticket updates for visible tickets" on public.ticket_updates;
drop policy if exists "Authenticated can add ticket updates" on public.ticket_updates;
drop policy if exists "Users can read attachments for visible tickets" on public.ticket_attachments;
drop policy if exists "Authenticated can add attachments" on public.ticket_attachments;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can update own profile (limited)" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admin can manage all profiles" on public.profiles;
drop policy if exists "Service role can insert profiles" on public.profiles;
drop policy if exists "Authenticated can read suppliers" on public.suppliers;
drop policy if exists "Admin can manage suppliers" on public.suppliers;
drop policy if exists "Authenticated can read issue_types" on public.issue_types;
drop policy if exists "Admin can manage issue_types" on public.issue_types;
drop policy if exists "Authenticated can read sla_rules" on public.sla_rules;
drop policy if exists "Admin can manage sla_rules" on public.sla_rules;


-- ============================================================
-- 2. Drop triggers and functions that reference old enums/columns
-- ============================================================
drop trigger if exists set_ticket_sla_trigger on public.tickets;
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.set_ticket_sla_deadline();
drop function if exists public.get_my_role();
drop function if exists public.get_my_team();
drop function if exists public.get_my_team_id();


-- ============================================================
-- 3. Drop tables no longer needed
-- ============================================================
drop table if exists public.ticket_attachments;
drop table if exists public.ticket_updates;


-- ============================================================
-- 4. Drop old indexes
-- ============================================================
drop index if exists public.idx_tickets_assigned_to;
drop index if exists public.idx_tickets_sla_deadline;
drop index if exists public.idx_tickets_team_assigned;
drop index if exists public.idx_tickets_status;
drop index if exists public.idx_ticket_updates_ticket_id;


-- ============================================================
-- 5. Rename columns
-- ============================================================
alter table public.profiles rename column full_name to name;

alter table public.issue_types rename column name to title;
alter table public.suppliers  rename column name to title;

alter table public.tickets rename column description            to issue_description;
alter table public.tickets rename column number_plate           to car_plate;
alter table public.tickets rename column odometer_reading       to odometer;
alter table public.tickets rename column issue_type_id          to issue_category_id;
alter table public.tickets rename column service_request_opened to service_request_status;


-- ============================================================
-- 6. Create teams table; seed known teams
-- ============================================================
create table if not exists public.teams (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into public.teams (name) values
  ('Operations'),
  ('Logistics'),
  ('Supply'),
  ('Debt Collection'),
  ('Charging Team')
on conflict (name) do nothing;


-- ============================================================
-- 7. Add sla_resolution_hours_limit to issue_types; drop sla_rules
-- ============================================================
alter table public.issue_types
  add column if not exists sla_resolution_hours_limit numeric
    check (sla_resolution_hours_limit > 0);

update public.issue_types it
set sla_resolution_hours_limit = sr.resolution_hours
from public.sla_rules sr
where sr.issue_type_id = it.id
  and sr.priority_level is null;

update public.issue_types it
set sla_resolution_hours_limit = (
  select min(sr.resolution_hours)
  from public.sla_rules sr
  where sr.issue_type_id = it.id
)
where it.sla_resolution_hours_limit is null
  and exists (select 1 from public.sla_rules sr where sr.issue_type_id = it.id);

drop table if exists public.sla_rules;


-- ============================================================
-- 8. Add assignee_team_id FK to tickets; migrate from team_assigned
-- ============================================================
alter table public.tickets
  add column if not exists assignee_team_id uuid references public.teams(id) on delete set null;

update public.tickets t
set assignee_team_id = (
  select tm.id from public.teams tm
  where lower(t.team_assigned) = lower(tm.name)
     or (lower(t.team_assigned) = 'supply team'  and tm.name = 'Supply')
     or (lower(t.team_assigned) = 'charging'      and tm.name = 'Charging Team')
     or (lower(t.team_assigned) = 'damages & fc'  and tm.name = 'Operations')
  limit 1
)
where t.team_assigned is not null;


-- ============================================================
-- 9. Add cs_agent_id FK to tickets
-- ============================================================
alter table public.tickets
  add column if not exists cs_agent_id uuid references public.profiles(id) on delete set null;


-- ============================================================
-- 10. Convert escalation_status text → boolean
-- ============================================================
alter table public.tickets
  alter column escalation_status type boolean
  using (lower(escalation_status) in ('yes', 'true', '1'));

alter table public.tickets
  alter column escalation_status set not null,
  alter column escalation_status set default false;


-- ============================================================
-- 11. Convert service_request_status text → boolean
-- ============================================================
alter table public.tickets
  alter column service_request_status type boolean
  using (lower(service_request_status) in ('yes', 'true', '1'));

alter table public.tickets
  alter column service_request_status set not null,
  alter column service_request_status set default false;


-- ============================================================
-- 12. Drop old ticket columns
-- ============================================================
alter table public.tickets
  drop column if exists priority,
  drop column if exists customer_name,
  drop column if exists customer_contact,
  drop column if exists sla_deadline,
  drop column if exists sla_breached,
  drop column if exists assigned_to,
  drop column if exists cs_agent,
  drop column if exists team_assigned,
  drop column if exists closed_at;


-- ============================================================
-- 13. Recreate ticket_status enum (4 values)
-- ============================================================
create type public.ticket_status_new as enum (
  'in_progress',
  'waiting_for_customer',
  'waiting_for_supplier',
  'resolved'
);

alter table public.tickets alter column status drop default;

alter table public.tickets
  alter column status type public.ticket_status_new
  using (
    case status::text
      when 'waiting_on_supplier' then 'waiting_for_supplier'
      when 'waiting_on_customer' then 'waiting_for_customer'
      when 'resolved'            then 'resolved'
      when 'closed'              then 'resolved'
      else                            'in_progress'
    end
  )::public.ticket_status_new;

alter table public.tickets alter column status set default 'in_progress';

drop type public.ticket_status;
drop type if exists public.ticket_priority;
alter type public.ticket_status_new rename to ticket_status;


-- ============================================================
-- 14. Recreate user_role enum (3 values)
-- ============================================================
create type public.user_role_new as enum (
  'admin',
  'customer_support',
  'team_member'
);

alter table public.profiles alter column role drop default;

alter table public.profiles
  alter column role type public.user_role_new
  using (
    case role::text
      when 'admin'            then 'admin'
      when 'customer_support' then 'customer_support'
      else                         'team_member'
    end
  )::public.user_role_new;

drop type public.user_role;
alter type public.user_role_new rename to user_role;

alter table public.profiles alter column role set default 'customer_support';


-- ============================================================
-- 15. Add team_id FK to profiles; migrate from old team text
-- ============================================================
alter table public.profiles
  add column if not exists team_id uuid references public.teams(id) on delete set null;

update public.profiles p
set team_id = (
  select tm.id from public.teams tm
  where lower(p.team) = lower(tm.name)
     or (lower(p.team) = 'supply team'  and tm.name = 'Supply')
     or (lower(p.team) = 'charging'      and tm.name = 'Charging Team')
     or (lower(p.team) = 'damages & fc'  and tm.name = 'Operations')
  limit 1
)
where p.team is not null;

alter table public.profiles drop column if exists team;


-- ============================================================
-- 16. Add email and disabled columns to profiles
-- ============================================================
alter table public.profiles add column if not exists email    text;
alter table public.profiles add column if not exists disabled boolean not null default false;

-- Backfill email from auth.users
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id;


-- ============================================================
-- 17. Add notes column to tickets
-- ============================================================
alter table public.tickets add column if not exists notes text;


-- ============================================================
-- 18. Enable RLS on teams table
-- ============================================================
alter table public.teams enable row level security;


-- ============================================================
-- 19. Recreate helper functions
-- ============================================================
create or replace function public.get_my_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.get_my_team_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select team_id from public.profiles where id = auth.uid()
$$;


-- ============================================================
-- 20. Recreate handle_new_user trigger (captures email)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  chosen_role text := coalesce(nullif(trim(new.raw_user_meta_data->>'role'), ''), 'customer_support');
  valid_role  text;
  chosen_team uuid := nullif(trim(new.raw_user_meta_data->>'team_id'), '')::uuid;
begin
  begin
    if chosen_role in ('customer_support', 'team_member', 'admin') then
      valid_role := chosen_role;
    else
      valid_role := 'customer_support';
    end if;
  exception when others then
    valid_role := 'customer_support';
  end;

  insert into public.profiles (id, name, email, role, team_id)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), null),
    new.email,
    valid_role,
    case when valid_role = 'team_member' then chosen_team else null end
  )
  on conflict (id) do update set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 21. Recreate all RLS policies
-- ============================================================

-- Teams --
create policy "Authenticated can read teams"
  on public.teams for select to authenticated using (true);

create policy "Admin can manage teams"
  on public.teams for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Profiles --
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admin can manage all profiles"
  on public.profiles for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Suppliers --
create policy "Authenticated can read suppliers"
  on public.suppliers for select to authenticated using (true);

create policy "Admin can manage suppliers"
  on public.suppliers for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Issue types --
create policy "Authenticated can read issue_types"
  on public.issue_types for select to authenticated using (true);

create policy "Admin can manage issue_types"
  on public.issue_types for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Tickets: insert --
create policy "CS and admin can create tickets"
  on public.tickets for insert to authenticated
  with check (
    public.get_my_role() in ('customer_support', 'admin')
    and created_by = auth.uid()
  );

-- Tickets: select (admin: all | cs: own | team_member: their team) --
create policy "Users can view tickets by role"
  on public.tickets for select to authenticated
  using (
    public.get_my_role() = 'admin'
    or (public.get_my_role() = 'customer_support' and created_by = auth.uid())
    or (
      public.get_my_role() = 'team_member'
      and assignee_team_id = public.get_my_team_id()
    )
  );

-- Tickets: update --
create policy "Team and admin can update tickets"
  on public.tickets for update to authenticated
  using (
    public.get_my_role() = 'admin'
    or (
      public.get_my_role() = 'team_member'
      and assignee_team_id = public.get_my_team_id()
    )
  )
  with check (true);


-- ============================================================
-- 22. Recreate indexes
-- ============================================================
create index if not exists idx_tickets_status
  on public.tickets(status);

create index if not exists idx_tickets_assignee_team_id
  on public.tickets(assignee_team_id)
  where assignee_team_id is not null;

create index if not exists idx_tickets_created_at
  on public.tickets(created_at desc);

create index if not exists idx_profiles_role
  on public.profiles(role);

create index if not exists idx_profiles_team_id
  on public.profiles(team_id)
  where team_id is not null;

create index if not exists idx_tickets_created_by
  on public.tickets(created_by);

create index if not exists idx_tickets_supplier_id
  on public.tickets(supplier_id)
  where supplier_id is not null;

create index if not exists idx_tickets_created_by_created_at
  on public.tickets(created_by, created_at desc);


-- ============================================================
-- 23. Prevent non-admin users from self-elevating role/team
-- ============================================================
create or replace function public.prevent_role_team_self_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() = new.id and public.get_my_role() != 'admin' then
    new.role    := old.role;
    new.team_id := old.team_id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.prevent_role_team_self_update();
