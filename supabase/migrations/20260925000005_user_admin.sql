-- Admin user management. See docs/adr/0004-admin-user-invitations.md.

-- The admin screen lists users by email, but auth.users is not exposed to the client, so mirror it on profiles.
alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', 'Student'), new.email);
  return new;
end;
$$;

create function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- Admins manage other people's roles but never their own, so the last admin cannot lock everyone out by accident.
drop policy "admin manages roles" on public.profiles;
create policy "admin manages other users" on public.profiles for update to authenticated
  using (public.app_current_role() = 'admin' and id <> auth.uid())
  with check (public.app_current_role() = 'admin' and id <> auth.uid());

-- The mirrored email is managed by the triggers above, never by the client. A column-level revoke would not
-- override the table-wide grant, so replace it with grants on the editable columns only.
revoke update on public.profiles from authenticated;
grant update (display_name, role) on public.profiles to authenticated;
