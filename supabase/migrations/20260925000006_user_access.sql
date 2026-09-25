-- Account access lifecycle. See docs/adr/0005-temporary-passwords-and-deactivation.md.
--
-- 1. Admins create accounts with a random temporary password that is emailed to the person and never shown to
--    anyone. The person must change it on first sign-in; if they don't within the deadline, the account is banned
--    until an admin resends access.
-- 2. Admins can deactivate (and reactivate) accounts instead of deleting them, so history is preserved.

alter table public.profiles
  add column must_change_password boolean not null default false,
  add column temporary_password_expires_at timestamptz,
  add column deactivated_at timestamptz;

-- A deactivated account keeps no role-based permission, even with a still-valid access token.
create or replace function public.app_current_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and deactivated_at is null;
$$;

-- Clients may still update only display_name and role (grants from migration 0005), so these columns are
-- written exclusively by the Edge Functions (service role) and by the trigger below.

-- Changing the password is what clears the flag, so a student cannot skip the change by editing their profile.
create function public.clear_temporary_password()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set must_change_password = false, temporary_password_expires_at = null
  where id = new.id and must_change_password;
  return new;
end;
$$;

create trigger on_auth_user_password_changed
  after update of encrypted_password on auth.users
  for each row when (old.encrypted_password is distinct from new.encrypted_password)
  execute function public.clear_temporary_password();

-- Bans accounts whose temporary password expired unused. Auth refuses sign-in for banned users server side.
-- Returns how many accounts were banned.
create function public.expire_temporary_passwords()
returns integer language plpgsql security definer set search_path = public as $$
declare
  banned_count integer;
begin
  update auth.users u
  -- A far-future date rather than 'infinity', which the Auth server (Go) cannot parse.
  set banned_until = now() + interval '100 years'
  from public.profiles p
  where p.id = u.id
    and p.must_change_password
    and p.temporary_password_expires_at < now()
    and (u.banned_until is null or u.banned_until < now());
  get diagnostics banned_count = row_count;
  return banned_count;
end;
$$;

revoke execute on function public.expire_temporary_passwords() from public, anon, authenticated;

create extension if not exists pg_cron;

select cron.schedule(
  'expire-temporary-passwords',
  '0 * * * *',
  $$select public.expire_temporary_passwords()$$
);
