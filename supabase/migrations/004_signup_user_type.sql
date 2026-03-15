-- Signup: use role and team from signup form (user_metadata)

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  chosen_role text := coalesce(nullif(trim(new.raw_user_meta_data->>'role'), ''), 'customer_support');
  chosen_team text := nullif(trim(new.raw_user_meta_data->>'team'), '');
  valid_role public.user_role;
begin
  -- Validate role is a valid enum value; otherwise default to customer_support
  begin
    valid_role := chosen_role::public.user_role;
  exception when others then
    valid_role := 'customer_support';
  end;

  insert into public.profiles (id, full_name, role, team)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), new.email),
    valid_role,
    chosen_team
  );
  return new;
end;
$$;
