-- =====================================================================
--  Duel spectating: lets anyone signed in watch a duel by its id.
--  A question (and what each player picked) is only revealed once BOTH
--  players have answered it, so spectators can't feed answers.
--  Paste into Supabase > SQL Editor and Run (safe to run again).
-- =====================================================================
create or replace function public.dq_duel_watch(p_id uuid)
returns table(status text, a_name text, b_name text, a_score int, b_score int, a_n int, b_n int,
              winner_name text, level text, stake int, shown jsonb)
language plpgsql security definer set search_path = public as $$
declare v dq_duels; sa int; sb int; na int; nb int; k int;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into v from dq_duels where id = p_id;
  if v.id is null or v.status not in ('active','done') then raise exception 'no such duel'; end if;
  select count(*) filter (where x.ok), count(*) into sa, na from dq_answers x where x.duel = p_id and x.player = v.a;
  select count(*) filter (where x.ok), count(*) into sb, nb from dq_answers x where x.duel = p_id and x.player = v.b;
  k := least(na, nb);
  if v.status = 'done' or now() > v.started_at + dq_deadline() then k := 10; end if;
  return query select v.status, v.a_name, v.b_name, sa, sb, na, nb,
    case when v.winner = v.a then v.a_name when v.winner = v.b then v.b_name else null end, v.level, v.stake,
    coalesce((select jsonb_agg(jsonb_build_object(
        'idx', u.i - 1, 'q', qq.q, 'cat', qq.cat, 'd', qq.d, 'answer', qq.a, 'expl', qq.x,
        'opts', (select to_jsonb(array_agg(o order by md5(p_id::text || qq.id::text || o))) from unnest(array[qq.a] || qq.w) o),
        'a_choice', (select choice from dq_answers where duel = p_id and player = v.a and idx = u.i - 1),
        'a_ok', (select ok from dq_answers where duel = p_id and player = v.a and idx = u.i - 1),
        'b_choice', (select choice from dq_answers where duel = p_id and player = v.b and idx = u.i - 1),
        'b_ok', (select ok from dq_answers where duel = p_id and player = v.b and idx = u.i - 1)) order by u.i)
      from unnest(v.qids) with ordinality u(qid, i) join dq_questions qq on qq.id = u.qid where u.i <= k), '[]'::jsonb);
end $$;
revoke execute on function public.dq_duel_watch(uuid) from public, anon;
grant execute on function public.dq_duel_watch(uuid) to authenticated;
