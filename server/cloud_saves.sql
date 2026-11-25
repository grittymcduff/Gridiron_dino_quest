-- Cloud saves for players signed in with Google.
-- One save per account. Players never touch the table directly: they use the two functions below,
-- which only work for a signed-in (non-anonymous) player and only on that player's own save.
-- Safe to run more than once.

create table if not exists public.dq_saves (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  save       jsonb not null,
  updated_at timestamptz not null default now(),
  constraint dq_saves_size check (pg_column_size(save) < 400000)
);
alter table public.dq_saves enable row level security;
revoke all on public.dq_saves from anon, authenticated;

-- true only for a real (Google) sign-in, not the anonymous online-play sign-in
create or replace function public.dq_is_account() returns boolean
language sql stable set search_path = '' as $$
  select auth.uid() is not null
     and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
$$;

-- read my cloud save: {save, at} or null when there is none yet
create or replace function public.dq_save_get() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r record;
begin
  if not public.dq_is_account() then raise exception 'sign in with Google first'; end if;
  select save, updated_at into r from public.dq_saves where user_id = auth.uid();
  if not found then return null; end if;
  return jsonb_build_object('save', r.save, 'at', r.updated_at);
end $$;

-- write my cloud save.
-- p_base is the cloud time this device last synced with; if the cloud has changed since
-- (another device saved), nothing is written and {conflict:true, at} comes back, unless p_force.
create or replace function public.dq_save_put(p_save jsonb, p_base timestamptz, p_force boolean default false)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare cur timestamptz; now_at timestamptz := clock_timestamp();
begin
  if not public.dq_is_account() then raise exception 'sign in with Google first'; end if;
  if p_save is null or jsonb_typeof(p_save) <> 'object' or not (p_save ? 'lv') then raise exception 'not a save'; end if;
  if pg_column_size(p_save) >= 400000 then raise exception 'save too large'; end if;
  select updated_at into cur from public.dq_saves where user_id = auth.uid() for update;
  if found and not p_force and (p_base is null or cur <> p_base) then
    return jsonb_build_object('conflict', true, 'at', cur);
  end if;
  insert into public.dq_saves(user_id, save, updated_at) values (auth.uid(), p_save, now_at)
  on conflict (user_id) do update set save = excluded.save, updated_at = excluded.updated_at;
  return jsonb_build_object('ok', true, 'at', now_at);
end $$;

revoke all on function public.dq_is_account() from public;
revoke all on function public.dq_save_get() from public;
revoke all on function public.dq_save_put(jsonb, timestamptz, boolean) from public;
grant execute on function public.dq_is_account() to authenticated;
grant execute on function public.dq_save_get() to authenticated;
grant execute on function public.dq_save_put(jsonb, timestamptz, boolean) to authenticated;
