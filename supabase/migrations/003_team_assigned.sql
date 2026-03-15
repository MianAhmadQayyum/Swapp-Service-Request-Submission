-- Team Assigned dropdown for new ticket form

alter table public.tickets
  add column if not exists team_assigned text;
