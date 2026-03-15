-- Swapp Service Request Management Platform — Full Schema
-- Run in Supabase SQL Editor (New query → paste → Run)

-- Drop legacy table if present
drop table if exists public.user_contacts;

-- Roles enum for profiles
create type public.user_role as enum (
  'customer_support',
  'operations',
  'operations_manager',
  'admin'
);

-- Profiles: extends auth.users with role and team
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'customer_support',
  team text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Suppliers (configurable by admin)
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- Issue types (configurable by admin)
create table if not exists public.issue_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- SLA rules: resolution time in hours per issue type
create table if not exists public.sla_rules (
  id uuid primary key default gen_random_uuid(),
  issue_type_id uuid not null references public.issue_types(id) on delete cascade,
  resolution_hours numeric not null check (resolution_hours > 0),
  priority_level text,
  created_at timestamptz default now(),
  unique(issue_type_id, priority_level)
);

-- Ticket status enum
create type public.ticket_status as enum (
  'new',
  'assigned',
  'in_progress',
  'waiting_on_supplier',
  'waiting_on_customer',
  'resolved',
  'closed'
);

create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');

-- Tickets
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  booking_id text not null,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  issue_type_id uuid not null references public.issue_types(id) on delete restrict,
  priority public.ticket_priority not null default 'medium',
  description text not null,
  number_plate text,
  customer_name text not null,
  customer_contact text,
  status public.ticket_status not null default 'new',
  created_by uuid not null references auth.users(id) on delete restrict,
  assigned_to uuid references auth.users(id) on delete set null,
  sla_deadline timestamptz,
  sla_breached boolean default false,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ticket updates (notes, comments, history)
create table if not exists public.ticket_updates (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  comment text,
  attachment_url text,
  added_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz default now()
);

-- Ticket attachments (separate table for multiple files per ticket)
create table if not exists public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  file_url text not null,
  file_name text,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_assigned_to on public.tickets(assigned_to);
create index if not exists idx_tickets_created_at on public.tickets(created_at desc);
create index if not exists idx_tickets_sla_deadline on public.tickets(sla_deadline) where sla_deadline is not null and status not in ('resolved','closed');
create index if not exists idx_ticket_updates_ticket_id on public.ticket_updates(ticket_id);
create index if not exists idx_profiles_role on public.profiles(role);

-- RLS
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.issue_types enable row level security;
alter table public.sla_rules enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_updates enable row level security;
alter table public.ticket_attachments enable row level security;

-- Helper: get current user's role
create or replace function public.get_my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Profiles: users can read own; admin can manage all
create policy "Users can read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);
create policy "Users can update own profile (limited)"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "Admin can manage all profiles"
  on public.profiles for all to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin')
  with check ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Service role can insert profile (e.g. on signup)
create policy "Service role can insert profiles"
  on public.profiles for insert to service_role
  with check (true);

-- Suppliers: all authenticated read; admin manage
create policy "Authenticated can read suppliers"
  on public.suppliers for select to authenticated using (true);
create policy "Admin can manage suppliers"
  on public.suppliers for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Issue types: all authenticated read; admin manage
create policy "Authenticated can read issue_types"
  on public.issue_types for select to authenticated using (true);
create policy "Admin can manage issue_types"
  on public.issue_types for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- SLA rules: all authenticated read; admin manage
create policy "Authenticated can read sla_rules"
  on public.sla_rules for select to authenticated using (true);
create policy "Admin can manage sla_rules"
  on public.sla_rules for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- Tickets: Customer Support can create and see own; Operations can see assigned and update; Manager/Admin see all
create policy "Customer support can create tickets"
  on public.tickets for insert to authenticated
  with check (
    public.get_my_role() = 'customer_support'
    and created_by = auth.uid()
  );
create policy "Users can view tickets by role"
  on public.tickets for select to authenticated
  using (
    (public.get_my_role() = 'customer_support' and created_by = auth.uid())
    or (public.get_my_role() = 'operations' and assigned_to = auth.uid())
    or (public.get_my_role() in ('operations_manager','admin'))
  );
create policy "Operations and above can update tickets"
  on public.tickets for update to authenticated
  using (
    public.get_my_role() in ('operations','operations_manager','admin')
    or (public.get_my_role() = 'customer_support' and created_by = auth.uid())
  )
  with check (true);
create policy "Admin can assign any ticket"
  on public.tickets for update to authenticated
  using (public.get_my_role() = 'admin');

-- Ticket updates: visible to anyone who can see the ticket; add by authenticated
create policy "Users can read ticket updates for visible tickets"
  on public.ticket_updates for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_updates.ticket_id
      and (
        (public.get_my_role() = 'customer_support' and t.created_by = auth.uid())
        or (public.get_my_role() = 'operations' and t.assigned_to = auth.uid())
        or (public.get_my_role() in ('operations_manager','admin'))
      )
    )
  );
create policy "Authenticated can add ticket updates"
  on public.ticket_updates for insert to authenticated
  with check (
    added_by = auth.uid()
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_updates.ticket_id
      and (
        (public.get_my_role() = 'customer_support' and t.created_by = auth.uid())
        or (public.get_my_role() in ('operations','operations_manager','admin'))
      )
    )
  );

-- Ticket attachments: same as ticket updates
create policy "Users can read attachments for visible tickets"
  on public.ticket_attachments for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_attachments.ticket_id
      and (
        (public.get_my_role() = 'customer_support' and t.created_by = auth.uid())
        or (public.get_my_role() = 'operations' and t.assigned_to = auth.uid())
        or (public.get_my_role() in ('operations_manager','admin'))
      )
    )
  );
create policy "Authenticated can add attachments"
  on public.ticket_attachments for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.tickets t
      where t.id = ticket_attachments.ticket_id
      and (
        (public.get_my_role() = 'customer_support' and t.created_by = auth.uid())
        or (public.get_my_role() in ('operations','operations_manager','admin'))
      )
    )
  );

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'customer_support'
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed default issue types and SLA rules (optional)
insert into public.issue_types (name) values
  ('Accident'),
  ('Car Replacement'),
  ('Faulty Car'),
  ('Technical Issue')
on conflict (name) do nothing;

-- SLA rules (issue type name → hours). Link after issue_types exist.
do $$
declare
  aid uuid; rid uuid; rep uuid; fid uuid; tid uuid;
begin
  select id into aid from public.issue_types where name = 'Accident' limit 1;
  select id into rid from public.issue_types where name = 'Car Replacement' limit 1;
  select id into fid from public.issue_types where name = 'Faulty Car' limit 1;
  select id into tid from public.issue_types where name = 'Technical Issue' limit 1;
  if aid is not null and not exists (select 1 from public.sla_rules where issue_type_id = aid) then
    insert into public.sla_rules (issue_type_id, resolution_hours) values (aid, 2);
  end if;
  if rid is not null and not exists (select 1 from public.sla_rules where issue_type_id = rid) then
    insert into public.sla_rules (issue_type_id, resolution_hours) values (rid, 4);
  end if;
  if fid is not null and not exists (select 1 from public.sla_rules where issue_type_id = fid) then
    insert into public.sla_rules (issue_type_id, resolution_hours) values (fid, 6);
  end if;
  if tid is not null and not exists (select 1 from public.sla_rules where issue_type_id = tid) then
    insert into public.sla_rules (issue_type_id, resolution_hours) values (tid, 8);
  end if;
end $$;

-- Seed a few suppliers for demo (optional)
insert into public.suppliers (name) values
  ('Supplier A'),
  ('Supplier B')
on conflict (name) do nothing;

-- Trigger: set sla_deadline on ticket insert from sla_rules
create or replace function public.set_ticket_sla_deadline()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  hours numeric;
begin
  if new.created_at is null then
    new.created_at := now();
  end if;
  select resolution_hours into hours
  from public.sla_rules
  where issue_type_id = new.issue_type_id
  order by priority_level nulls first
  limit 1;
  if hours is not null and new.sla_deadline is null then
    new.sla_deadline := new.created_at + (hours || ' hours')::interval;
  end if;
  return new;
end;
$$;
drop trigger if exists set_ticket_sla_trigger on public.tickets;
create trigger set_ticket_sla_trigger
  before insert on public.tickets
  for each row execute function public.set_ticket_sla_deadline();
