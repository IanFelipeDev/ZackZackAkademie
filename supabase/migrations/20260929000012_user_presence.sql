-- Last activity per account, for "online now" and "last access" in user administration (ADR-0010).
-- A separate table instead of a profiles column: teachers can read profiles, but only admins may see activity.

create table public.user_presence (
  user_id      uuid primary key references public.profiles (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

-- Called by the app on load and every few minutes while the tab is visible. The caller comes from the session
-- JWT (auth.uid()) and the time from the server, so nobody can mark another account or backdate activity.
-- Writes at most once per 30 seconds per account.
create function public.touch_presence()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return;
  end if;
  insert into public.user_presence (user_id, last_seen_at)
  values (auth.uid(), now())
  on conflict (user_id) do update set last_seen_at = excluded.last_seen_at
  where public.user_presence.last_seen_at < now() - interval '30 seconds';
end;
$$;

revoke execute on function public.touch_presence() from public, anon;
grant execute on function public.touch_presence() to authenticated;

-- Clients only read; every write goes through touch_presence().
revoke all on public.user_presence from anon, authenticated;
grant select on public.user_presence to authenticated;

alter table public.user_presence enable row level security;

create policy "admins read presence" on public.user_presence for select to authenticated
  using (public.app_current_role() = 'admin');
