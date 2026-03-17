-- Fix: "Admin can manage all profiles" policy used an inline subquery on
-- profiles, which triggers RLS evaluation on the same table → infinite recursion.
-- Replace with get_my_role() (SECURITY DEFINER) which bypasses RLS.

drop policy if exists "Admin can manage all profiles" on public.profiles;

create or replace function public.get_my_role()
returns user_role
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "Admin can manage all profiles"
  on public.profiles for all to authenticated
  using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');
