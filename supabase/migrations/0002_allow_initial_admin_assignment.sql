-- Dashboard SQL runs without an authenticated application user. This permits
-- the one-time bootstrap performed by a database administrator, while the
-- trigger still rejects role changes initiated by normal app users.
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change roles';
  end if;
  return new;
end;
$$;
