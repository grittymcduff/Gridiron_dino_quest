-- Keep-awake pings: one tiny row each time someone joins a room.
-- Players sign in anonymously, which gives them the "authenticated" role,
-- so insert has to be allowed for that role (not just "anon").
-- Safe to run more than once.
create table if not exists public.room_pings (
  id bigint generated always as identity primary key,
  room text not null check (length(room) <= 32),
  at timestamptz not null default now()
);
alter table public.room_pings enable row level security;
revoke all on public.room_pings from anon, authenticated;
grant insert (room) on public.room_pings to anon, authenticated;
-- if an older version of the table used a serial id, inserting needs the sequence too
do $$ declare s text; begin
  select pg_get_serial_sequence('public.room_pings', a.attname) into s
  from pg_attribute a where a.attrelid = 'public.room_pings'::regclass and a.attname = 'id';
  if s is not null and not exists (select 1 from pg_attribute where attrelid='public.room_pings'::regclass and attname='id' and attidentity <> '')
  then execute format('grant usage on sequence %s to anon, authenticated', s); end if;
end $$;
drop policy if exists "room pings insert" on public.room_pings;
create policy "room pings insert" on public.room_pings
  for insert to anon, authenticated with check (length(room) <= 32);
