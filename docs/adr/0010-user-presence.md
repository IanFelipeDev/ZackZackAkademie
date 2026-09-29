# ADR-0010: Online status and last access for admins

- Status: Accepted
- Date: 2026-09-29

## Context

Admins want to see who is using the platform right now and when each person last used it. Supabase's
`auth.users.last_sign_in_at` only changes on a password sign-in; sessions refresh silently for weeks, so it
does not reflect actual use.

## Decision

- The app sends a heartbeat (`touch_presence()` RPC) on load, every 2 minutes while the tab is visible and when
  the tab becomes visible again (`usePresenceHeartbeat` in `AppLayout`). It uses the normal session JWT: no extra
  token or key.
- `touch_presence()` is `security definer`, takes no arguments, writes `auth.uid()` and the server's `now()`
  into `user_presence`, and skips writes less than 30 seconds apart. Clients have no insert/update grants, so
  nobody can mark another account or backdate activity.
- `user_presence` is a separate table because teachers can read `profiles`; only admins may read presence (RLS).
- "Online now" means activity within the last 5 minutes (`isOnline`). `/admin/usuarios` shows the online count,
  an "only online" filter and "Último acesso …" per person, refetching every minute.
- No history is kept: one row per person, overwritten.

## Consequences

- Accuracy is about two minutes; closing the tab shows the person as online for up to five more minutes.
- People who have not opened the app since this change show "Nenhum acesso registrado".
- Students should be told that the time of their last access is recorded (LGPD transparency).
