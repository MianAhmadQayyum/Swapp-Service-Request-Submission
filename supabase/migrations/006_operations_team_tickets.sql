-- Operations/team users: view and manage tickets assigned to their team (team_assigned)

-- Helper: get current user's team (for operations role)
create or replace function public.get_my_team()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select team from public.profiles where id = auth.uid()
$$;

-- Drop existing ticket policies so we can replace them
drop policy if exists "Users can view tickets by role" on public.tickets;
drop policy if exists "Operations and above can update tickets" on public.tickets;

-- Tickets SELECT: Customer Support sees own; Operations see tickets assigned to them (assigned_to) OR to their team (team_assigned); Manager/Admin see all
create policy "Users can view tickets by role"
  on public.tickets for select to authenticated
  using (
    (public.get_my_role() = 'customer_support' and created_by = auth.uid())
    or (public.get_my_role() = 'operations' and (
      assigned_to = auth.uid()
      or (public.get_my_team() is not null and team_assigned = public.get_my_team())
    ))
    or (public.get_my_role() in ('operations_manager','admin'))
  );

-- Tickets UPDATE: Customer Support can update own; Operations can update tickets they can see (assigned to them or their team); Manager/Admin can update all
create policy "Operations and above can update tickets"
  on public.tickets for update to authenticated
  using (
    (public.get_my_role() = 'customer_support' and created_by = auth.uid())
    or (public.get_my_role() = 'operations' and (
      assigned_to = auth.uid()
      or (public.get_my_team() is not null and team_assigned = public.get_my_team())
    ))
    or (public.get_my_role() in ('operations_manager','admin'))
  )
  with check (true);

-- Ticket updates: allow read/add when user can see the ticket (including by team)
drop policy if exists "Users can read ticket updates for visible tickets" on public.ticket_updates;
drop policy if exists "Authenticated can add ticket updates" on public.ticket_updates;

create policy "Users can read ticket updates for visible tickets"
  on public.ticket_updates for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_updates.ticket_id
      and (
        (public.get_my_role() = 'customer_support' and t.created_by = auth.uid())
        or (public.get_my_role() = 'operations' and (
          t.assigned_to = auth.uid()
          or (public.get_my_team() is not null and t.team_assigned = public.get_my_team())
        ))
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
        or (public.get_my_role() = 'operations' and (
          t.assigned_to = auth.uid()
          or (public.get_my_team() is not null and t.team_assigned = public.get_my_team())
        ))
        or (public.get_my_role() in ('operations_manager','admin'))
      )
    )
  );

-- Ticket attachments: same visibility by team
drop policy if exists "Users can read attachments for visible tickets" on public.ticket_attachments;
drop policy if exists "Authenticated can add attachments" on public.ticket_attachments;

create policy "Users can read attachments for visible tickets"
  on public.ticket_attachments for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_attachments.ticket_id
      and (
        (public.get_my_role() = 'customer_support' and t.created_by = auth.uid())
        or (public.get_my_role() = 'operations' and (
          t.assigned_to = auth.uid()
          or (public.get_my_team() is not null and t.team_assigned = public.get_my_team())
        ))
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
        or (public.get_my_role() = 'operations' and (
          t.assigned_to = auth.uid()
          or (public.get_my_team() is not null and t.team_assigned = public.get_my_team())
        ))
        or (public.get_my_role() in ('operations_manager','admin'))
      )
    )
  );

-- Index to speed up team_assigned filters
create index if not exists idx_tickets_team_assigned on public.tickets(team_assigned) where team_assigned is not null;
