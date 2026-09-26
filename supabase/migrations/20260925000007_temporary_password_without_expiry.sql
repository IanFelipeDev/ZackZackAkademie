-- The temporary password now stays valid until the first sign-in (people may take a while to log in).
-- It must still be changed right away, and Supabase Auth rejects reusing it (error code same_password).
-- See docs/adr/0005-temporary-passwords-and-deactivation.md.

select cron.unschedule('expire-temporary-passwords');

drop function public.expire_temporary_passwords();

-- Lift bans that only existed because a temporary password expired; deactivated accounts stay banned.
update auth.users u
set banned_until = null
from public.profiles p
where p.id = u.id
  and p.must_change_password
  and p.deactivated_at is null
  and u.banned_until is not null;

create or replace function public.clear_temporary_password()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set must_change_password = false where id = new.id and must_change_password;
  return new;
end;
$$;

alter table public.profiles drop column temporary_password_expires_at;
