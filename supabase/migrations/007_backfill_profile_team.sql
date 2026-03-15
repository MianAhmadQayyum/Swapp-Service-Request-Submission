-- Ensure all operations users have profile.team aligned with ticket "Team Assigned" values
-- so every account in a user type sees tickets assigned to that type.

update public.profiles
set team = 'Charging Team'
where role = 'operations' and team = 'Charging';

update public.profiles
set team = 'Supply Team'
where role = 'operations' and team = 'Supply';

-- Optional: set team for operations users who have no team (e.g. old accounts)
-- so they see tickets assigned to "Operations"
-- update public.profiles set team = 'Operations' where role = 'operations' and team is null;
